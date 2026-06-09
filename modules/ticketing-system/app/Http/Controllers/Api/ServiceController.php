<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ServiceController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Service::query()
            ->withCount([
                'tickets',
                'tickets as open_tickets_count' => fn ($query) => $query->whereIn('status', ['open', 'in_progress', 'waiting_client']),
                'tickets as sla_risk_count' => fn ($query) => $query->whereIn('status', ['open', 'in_progress', 'waiting_client'])->where('due_at', '<=', now()->addHours(4)),
            ])
            ->orderBy('name')
            ->get());
    }

    public function store(Request $request): JsonResponse
    {
        $service = Service::create($this->validated($request));

        return response()->json($service, 201);
    }

    public function show(Service $service): JsonResponse
    {
        return response()->json($service->load('tickets.client'));
    }

    public function update(Request $request, Service $service): JsonResponse
    {
        $service->update($this->validated($request, true));

        return response()->json($service);
    }

    public function destroy(Service $service): JsonResponse
    {
        $service->delete();

        return response()->json(['deleted' => true]);
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$required, 'string', 'max:255'],
            'category' => [$required, 'string', 'max:255'],
            'owner_team' => ['nullable', 'string', 'max:255'],
            'default_sla_minutes' => ['nullable', 'integer', 'min:15', 'max:525600'],
            'status' => [$required, Rule::in(['operational', 'degraded', 'outage', 'maintenance'])],
            'description' => ['nullable', 'string'],
        ]);
    }
}
