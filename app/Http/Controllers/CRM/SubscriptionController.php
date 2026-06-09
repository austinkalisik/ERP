<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\CRM\CrmPayment;
use App\Models\CRM\CrmServiceInterruption;
use App\Models\CRM\CrmSubscription;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class SubscriptionController extends Controller
{
    /**
     * GET /api/crm/subscriptions
     * Filters: search, filter (active|expiring_soon|expired|suspended), service, client_id
     */
    public function index(Request $request): JsonResponse
    {
        $query = CrmSubscription::with([
            'client:id,name',
            'service:id,name',
        ])->orderBy('expiry_date', 'asc');

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->whereHas('client',   fn($c)  => $c->where('name',  'like', "%{$s}%"))
                  ->orWhereHas('service', fn($sv) => $sv->where('name', 'like', "%{$s}%"));
            });
        }

        if ($request->filled('filter')) {
            match ($request->filter) {
                'active'        => $query->where('status', 'Active'),
                'expiring_soon' => $query->where('status', 'Expiring'),
                'expired'       => $query->where('status', 'Expired'),
                'suspended'     => $query->where('status', 'Suspended'),
                default         => null,
            };
        }

        if ($request->filled('service')) {
            $query->where('service_id', $request->service);
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        $paginated = $query->paginate($request->get('per_page', 20));
        $paginated->getCollection()->transform(fn($sub) => $this->formatRow($sub));

        return response()->json($paginated);
    }

    /**
     * POST /api/crm/subscriptions
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'client_id'     => 'required|exists:crm_clients,id',
            'service_id'    => 'required|exists:crm_services,id',
            'billing_cycle' => 'required|in:Monthly,Quarterly,Semi-Annual,Annual',
            'amount'        => 'required|numeric|min:0',
            'start_date'    => 'required|date',
            'expiry_date'   => 'required|date|after:start_date',
            'notes'         => 'nullable|string',
        ]);

        $validated['status']      = $this->computeStatus($validated['expiry_date']);
        $validated['credit_days'] = 0;

        $sub = CrmSubscription::create($validated);

        $this->audit($request, 'created', $sub->id,
            "Created subscription #{$sub->id} for client #{$sub->client_id}");

        return response()->json([
            'message' => 'Subscription created successfully',
            'id'      => $sub->id,
        ], 201);
    }

    /**
     * GET /api/crm/subscriptions/{id}
     * Everything SubscriptionView needs in one request.
     */
    public function show(int $id): JsonResponse
    {
        $sub = CrmSubscription::with([
            'client:id,name',
            'service:id,name',
            'payments',
            'interruptions',
            'attachments',
        ])->findOrFail($id);

        return response()->json([
            'id'            => $sub->id,
            'client_id'     => $sub->client_id,
            'client_name'   => $sub->client?->name,
            'service_id'    => $sub->service_id,
            'service_name'  => $sub->service?->name,
            'billing_cycle' => $sub->billing_cycle,
            'amount'        => $sub->amount,
            'start_date'    => $sub->start_date?->toDateString(),
            'expiry_date'   => $sub->expiry_date?->toDateString(),
            'status'        => $sub->status,
            'credit_days'   => $sub->credit_days,
            'notes'         => $sub->notes,

            'payments' => $sub->payments->map(fn($p) => [
                'id'           => $p->id,
                'amount'       => $p->amount,
                'payment_date' => $p->payment_date?->toDateString(),
                'period_from'  => $p->period_from?->toDateString(),
                'period_to'    => $p->period_to?->toDateString(),
                'notes'        => $p->notes,
            ]),

            'interruptions' => $sub->interruptions->map(fn($i) => [
                'id'          => $i->id,
                'from_date'   => $i->from_date?->toDateString(),
                'to_date'     => $i->to_date?->toDateString(),
                'credit_days' => $i->credit_days,
                'reason'      => $i->reason,
            ]),

            'attachments' => $sub->attachments->map(fn($a) => [
                'id'             => $a->id,
                'file_name'      => $a->file_name,
                'file_type'      => $a->file_type,
                'size_formatted' => $a->size_formatted,
                'url'            => $a->url,
            ]),
        ]);
    }

    /**
     * PUT /api/crm/subscriptions/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $sub = CrmSubscription::findOrFail($id);

        $validated = $request->validate([
            'service_id'    => 'sometimes|exists:crm_services,id',
            'billing_cycle' => 'sometimes|in:Monthly,Quarterly,Semi-Annual,Annual',
            'amount'        => 'sometimes|numeric|min:0',
            'start_date'    => 'sometimes|date',
            'expiry_date'   => 'sometimes|date',
            'status'        => 'sometimes|in:Active,Expiring,Expired,Suspended',
            'notes'         => 'nullable|string',
        ]);

        $sub->update($validated);
        $sub->refreshStatus();

        return response()->json(['message' => 'Subscription updated successfully']);
    }

    /**
     * DELETE /api/crm/subscriptions/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        CrmSubscription::findOrFail($id)->delete();

        return response()->json(['message' => 'Subscription deleted successfully']);
    }

    /*
    |--------------------------------------------------------------------------
    | Payments
    |--------------------------------------------------------------------------
    */

    /**
     * POST /api/crm/subscriptions/{id}/payments
     */
    public function storePayment(Request $request, int $id): JsonResponse
    {
        $sub = CrmSubscription::findOrFail($id);

        $validated = $request->validate([
            'amount'       => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'period_from'  => 'nullable|date',
            'period_to'    => 'nullable|date|after_or_equal:period_from',
            'notes'        => 'nullable|string|max:500',
        ]);

        $payment = CrmPayment::create([
            ...$validated,
            'subscription_id' => $sub->id,
            'recorded_by'     => Auth::id(),
        ]);

        $sub->refreshStatus();

        $this->audit($request, 'created', $sub->id,
            "Recorded payment of K{$validated['amount']} for subscription #{$sub->id}");

        return response()->json([
            'message' => 'Payment recorded successfully',
            'id'      => $payment->id,
        ], 201);
    }

    /**
     * DELETE /api/crm/payments/{paymentId}
     */
    public function destroyPayment(int $paymentId): JsonResponse
    {
        $payment = CrmPayment::findOrFail($paymentId);
        $subId   = $payment->subscription_id;
        $payment->delete();

        optional(CrmSubscription::find($subId))?->refreshStatus();

        return response()->json(['message' => 'Payment deleted successfully']);
    }

    /*
    |--------------------------------------------------------------------------
    | Service Interruptions (credit days)
    |--------------------------------------------------------------------------
    */

    /**
     * POST /api/crm/subscriptions/{id}/interruptions
     * Auto-computes credit_days and extends expiry_date.
     */
    public function storeInterruption(Request $request, int $id): JsonResponse
    {
        $sub = CrmSubscription::findOrFail($id);

        $validated = $request->validate([
            'from_date' => 'required|date',
            'to_date'   => 'required|date|after_or_equal:from_date',
            'reason'    => 'nullable|string|max:500',
        ]);

        $creditDays = Carbon::parse($validated['from_date'])
            ->diffInDays(Carbon::parse($validated['to_date'])) + 1;

        $interruption = CrmServiceInterruption::create([
            'subscription_id' => $sub->id,
            'from_date'       => $validated['from_date'],
            'to_date'         => $validated['to_date'],
            'credit_days'     => $creditDays,
            'reason'          => $validated['reason'] ?? null,
        ]);

        $sub->update([
            'expiry_date' => $sub->expiry_date->addDays($creditDays),
            'credit_days' => $sub->credit_days + $creditDays,
        ]);

        $sub->refreshStatus();

        $this->audit($request, 'updated', $sub->id,
            "Logged {$creditDays}-day interruption for subscription #{$sub->id} ({$validated['from_date']} to {$validated['to_date']})");

        return response()->json([
            'message'     => "Interruption logged. +{$creditDays} days credit added to expiry.",
            'credit_days' => $creditDays,
            'id'          => $interruption->id,
        ], 201);
    }

    /**
     * DELETE /api/crm/interruptions/{interruptionId}
     * Reverses the credit days from expiry_date.
     */
    public function destroyInterruption(int $interruptionId): JsonResponse
    {
        $interruption = CrmServiceInterruption::findOrFail($interruptionId);
        $sub          = CrmSubscription::findOrFail($interruption->subscription_id);
        $creditDays   = $interruption->credit_days;

        $interruption->delete();

        $sub->update([
            'expiry_date' => $sub->expiry_date->subDays($creditDays),
            'credit_days' => max(0, $sub->credit_days - $creditDays),
        ]);

        $sub->refreshStatus();

        return response()->json([
            'message' => "Interruption deleted. -{$creditDays} days removed from expiry.",
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Private helpers
    |--------------------------------------------------------------------------
    */

    private function formatRow(CrmSubscription $sub): array
    {
        return [
            'id'            => $sub->id,
            'client_id'     => $sub->client_id,
            'client_name'   => $sub->client?->name ?? '—',
            'service_id'    => $sub->service_id,
            'service_name'  => $sub->service?->name ?? '—',
            'billing_cycle' => $sub->billing_cycle,
            'amount'        => $sub->amount,
            'start_date'    => $sub->start_date?->toDateString(),
            'expiry_date'   => $sub->expiry_date?->toDateString(),
            'status'        => $sub->status,
            'credit_days'   => $sub->credit_days,
        ];
    }

    private function computeStatus(string $expiryDate): string
    {
        $daysLeft = now()->startOfDay()->diffInDays(
            Carbon::parse($expiryDate)->startOfDay(),
            false
        );

        return match (true) {
            $daysLeft < 0   => 'Expired',
            $daysLeft <= 30 => 'Expiring',
            default         => 'Active',
        };
    }

    private function audit(Request $request, string $action, int $modelId, string $description): void
    {
        try {
            AuditLog::create([
                'user_id'     => $request->user()->id,
                'user_name'   => $request->user()->name,
                'user_role'   => $request->user()->role,
                'model_type'  => 'App\\Models\\CRM\\CrmSubscription',
                'model_id'    => $modelId,
                'action'      => $action,
                'description' => $description,
                'ip_address'  => $request->ip(),
                'user_agent'  => $request->userAgent(),
                'module'      => 'CRM',
            ]);
        } catch (\Throwable $e) {
            Log::warning("CRM audit log failed: {$e->getMessage()}");
        }
    }
}