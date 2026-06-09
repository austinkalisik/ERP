<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\CRM\CrmClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ClientController extends Controller
{
    /**
     * GET /api/crm/clients
     * Single query — client list with subscription status counts.
     * No N+1: withCount() generates subqueries, not loops.
     */
    public function index(Request $request): JsonResponse
    {
        $query = CrmClient::query()
            ->withCount([
                'subscriptions as active_subscriptions'   => fn($q) => $q->where('status', 'Active'),
                'subscriptions as expiring_subscriptions' => fn($q) => $q->where('status', 'Expiring'),
                'subscriptions as expired_subscriptions'  => fn($q) => $q->where('status', 'Expired'),
            ])
            ->orderBy('name', 'asc');

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name',            'like', "%{$s}%")
                  ->orWhere('contact_person', 'like', "%{$s}%")
                  ->orWhere('email',          'like', "%{$s}%")
                  ->orWhere('phone',          'like', "%{$s}%");
            });
        }

        return response()->json(
            $query->paginate($request->get('per_page', 15))
        );
    }

    /**
     * POST /api/crm/clients
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email'          => 'nullable|email|max:255',
            'phone'          => 'nullable|string|max:50',
            'address'        => 'nullable|string|max:500',
            'tin_number'     => 'nullable|string|max:50',
            'notes'          => 'nullable|string',
        ]);

        $client = CrmClient::create($validated);

        $this->audit($request, 'created', $client->id, "Created CRM client: {$client->name}");

        return response()->json([
            'message' => 'Client created successfully',
            'id'      => $client->id,
            'client'  => $client,
        ], 201);
    }

    /**
     * GET /api/crm/clients/{id}
     * ONE request — everything ClientView needs.
     */
    public function show(int $id): JsonResponse
    {
        $client = CrmClient::with([
            'subscriptions.service',
        ])->findOrFail($id);

        $subscriptions = $client->subscriptions->map(fn($sub) => [
            'id'            => $sub->id,
            'service_name'  => $sub->service?->name ?? '—',
            'billing_cycle' => $sub->billing_cycle,
            'amount'        => $sub->amount,
            'start_date'    => $sub->start_date?->toDateString(),
            'expiry_date'   => $sub->expiry_date?->toDateString(),
            'status'        => $sub->status,
            'credit_days'   => $sub->credit_days,
            'notes'         => $sub->notes,
        ]);

        return response()->json([
            'id'             => $client->id,
            'name'           => $client->name,
            'contact_person' => $client->contact_person,
            'email'          => $client->email,
            'phone'          => $client->phone,
            'address'        => $client->address,
            'tin_number'     => $client->tin_number,
            'notes'          => $client->notes,
            'total_credits'  => $client->subscriptions->sum('credit_days'),
            'subscriptions'  => $subscriptions,
        ]);
    }

    /**
     * PUT /api/crm/clients/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $client = CrmClient::findOrFail($id);

        $validated = $request->validate([
            'name'           => 'sometimes|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email'          => 'nullable|email|max:255',
            'phone'          => 'nullable|string|max:50',
            'address'        => 'nullable|string|max:500',
            'tin_number'     => 'nullable|string|max:50',
            'notes'          => 'nullable|string',
        ]);

        $client->update($validated);

        return response()->json([
            'message' => 'Client updated successfully',
            'client'  => $client->fresh(),
        ]);
    }

    /**
     * DELETE /api/crm/clients/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $client = CrmClient::findOrFail($id);
        $name   = $client->name;
        $client->delete();

        $this->audit($request, 'deleted', $id, "Deleted CRM client: {$name}");

        return response()->json(['message' => 'Client deleted successfully']);
    }

    private function audit(Request $request, string $action, int $modelId, string $description): void
    {
        try {
            AuditLog::create([
                'user_id'     => $request->user()->id,
                'user_name'   => $request->user()->name,
                'user_role'   => $request->user()->role,
                'model_type'  => 'App\\Models\\CRM\\CrmClient',
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