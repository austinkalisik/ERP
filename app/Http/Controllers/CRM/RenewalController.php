<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\CRM\CrmPayment;
use App\Models\CRM\CrmSubscription;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RenewalController extends Controller
{
    /**
     * GET /api/crm/renewals
     *
     * Returns subscriptions due for renewal filtered by window:
     *   window = 30 | 60 | 90 | overdue   (default: 30)
     *   search  = client name
     *   service = service_id
     *   page, per_page
     *
     * Response:
     *   data:    [...subscriptions]
     *   meta:    { total, last_page, current_page, per_page }
     *   summary: { due_30, due_60, due_90, overdue }
     */
    public function index(Request $request): JsonResponse
    {
        $window  = $request->get('window', '30');
        $search  = $request->get('search', '');
        $service = $request->get('service', '');
        $perPage = (int) $request->get('per_page', 20);
        $page    = (int) $request->get('page', 1);

        $query = CrmSubscription::with([
            'client:id,name,contact_person,email,phone',
            'service:id,name',
        ]);

        // ── Window filter ─────────────────────────────────────────────────────
        if ($window === 'overdue') {
            $query->where('expiry_date', '<', now()->startOfDay())
                  ->where('status', '!=', 'Suspended');
        } else {
            $days = (int) $window;
            $query->whereBetween('expiry_date', [
                now()->startOfDay(),
                now()->startOfDay()->addDays($days),
            ])->where('status', '!=', 'Suspended');
        }

        // ── Search ────────────────────────────────────────────────────────────
        if ($search !== '') {
            $query->whereHas('client', fn($q) =>
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('contact_person', 'like', "%{$search}%")
            );
        }

        // ── Service filter ────────────────────────────────────────────────────
        if ($service !== '') {
            $query->where('service_id', (int) $service);
        }

        $query->orderBy('expiry_date', 'asc');

        $paginated = $query->paginate($perPage, ['*'], 'page', $page);

        $rows = $paginated->getCollection()->map(fn($sub) => [
            'id'             => $sub->id,
            'client_id'      => $sub->client_id,
            'client_name'    => $sub->client?->name           ?? '—',
            'contact_person' => $sub->client?->contact_person ?? null,
            'phone'          => $sub->client?->phone          ?? null,
            'email'          => $sub->client?->email          ?? null,
            'service_id'     => $sub->service_id,
            'service_name'   => $sub->service?->name          ?? '—',
            'billing_cycle'  => $sub->billing_cycle,
            'amount'         => (float) $sub->amount,
            'start_date'     => $sub->start_date?->toDateString(),
            'expiry_date'    => $sub->expiry_date?->toDateString(),
            'status'         => $sub->status,
            'credit_days'    => (int) $sub->credit_days,
            'days_left'      => (int) now()->startOfDay()
                                    ->diffInDays($sub->expiry_date->startOfDay(), false),
        ]);

        // ── Summary counts — single SQL round-trip ────────────────────────────
        $summary = DB::selectOne("
            SELECT
                SUM(CASE WHEN expiry_date >= CURDATE()
                         AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
                         AND status != 'Suspended' THEN 1 ELSE 0 END) AS due_30,
                SUM(CASE WHEN expiry_date >= CURDATE()
                         AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)
                         AND status != 'Suspended' THEN 1 ELSE 0 END) AS due_60,
                SUM(CASE WHEN expiry_date >= CURDATE()
                         AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)
                         AND status != 'Suspended' THEN 1 ELSE 0 END) AS due_90,
                SUM(CASE WHEN expiry_date < CURDATE()
                         AND status != 'Suspended' THEN 1 ELSE 0 END) AS overdue
            FROM crm_subscriptions
        ");

        return response()->json([
            'data' => $rows->values(),
            'meta' => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
            'summary' => [
                'due_30'  => (int) ($summary->due_30  ?? 0),
                'due_60'  => (int) ($summary->due_60  ?? 0),
                'due_90'  => (int) ($summary->due_90  ?? 0),
                'overdue' => (int) ($summary->overdue ?? 0),
            ],
        ]);
    }

    /**
     * POST /api/crm/renewals/{id}/renew
     *
     * Extends expiry_date by one billing cycle and records a payment.
     * Always extends from current expiry (not today) to honour partial periods.
     *
     * Body: { amount, payment_date, notes? }
     */
    public function renew(Request $request, int $id): JsonResponse
    {
        $sub = CrmSubscription::with('client:id,name', 'service:id,name')
            ->findOrFail($id);

        $validated = $request->validate([
            'amount'       => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'notes'        => 'nullable|string|max:500',
        ]);

        $cycleMonths = match ($sub->billing_cycle) {
            'Quarterly'   => 3,
            'Semi-Annual' => 6,
            'Annual'      => 12,
            default       => 1, // Monthly
        };

        $currentExpiry = $sub->expiry_date instanceof Carbon
            ? $sub->expiry_date
            : Carbon::parse($sub->expiry_date);

        $newExpiry = $currentExpiry->copy()->addMonths($cycleMonths);

        // Record payment
        $payment = CrmPayment::create([
            'subscription_id' => $sub->id,
            'amount'          => $validated['amount'],
            'payment_date'    => $validated['payment_date'],
            'period_from'     => $currentExpiry->toDateString(),
            'period_to'       => $newExpiry->toDateString(),
            'notes'           => $validated['notes'] ?? null,
            'recorded_by'     => Auth::id(),
        ]);

        // Extend subscription
        $sub->update(['expiry_date' => $newExpiry]);
        $sub->refreshStatus();

        $this->audit(
            $request,
            'renewed',
            $sub->id,
            "Renewed subscription #{$sub->id} ({$sub->client?->name} — {$sub->service?->name}). " .
            "New expiry: {$newExpiry->toDateString()}. Amount: K{$validated['amount']}."
        );

        return response()->json([
            'message'    => "Subscription renewed. New expiry: {$newExpiry->format('d M Y')}.",
            'new_expiry' => $newExpiry->toDateString(),
            'payment_id' => $payment->id,
            'status'     => $sub->fresh()->status,
        ]);
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