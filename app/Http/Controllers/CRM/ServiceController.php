<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\CRM\CrmService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    /**
     * GET /api/crm/services
     * Returns ALL services (active + inactive) so Services.jsx management
     * page can show the Active/Inactive badge correctly.
     * Dropdowns (SubscriptionCreate, Subscriptions) filter by is_active
     * client-side since it's already in the response.
     */
    public function index(): JsonResponse
    {
        return response()->json(
            CrmService::orderBy('name')
                ->get(['id', 'name', 'description', 'is_active'])
        );
    }

    /**
     * POST /api/crm/services
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255|unique:crm_services,name',
            'description' => 'nullable|string|max:500',
        ]);

        $service = CrmService::create($validated);

        return response()->json([
            'message' => 'Service created successfully',
            'service' => $service,
        ], 201);
    }

    /**
     * PUT /api/crm/services/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $service = CrmService::findOrFail($id);

        $validated = $request->validate([
            'name'        => 'sometimes|string|max:255|unique:crm_services,name,' . $id,
            'description' => 'nullable|string|max:500',
            'is_active'   => 'sometimes|boolean',
        ]);

        $service->update($validated);

        return response()->json([
            'message' => 'Service updated successfully',
            'service' => $service->fresh(),
        ]);
    }

    /**
     * DELETE /api/crm/services/{id}
     * Deactivates instead of hard-deleting if subscriptions exist.
     */
    public function destroy(int $id): JsonResponse
    {
        $service = CrmService::findOrFail($id);

        if ($service->subscriptions()->exists()) {
            $service->update(['is_active' => false]);
            return response()->json([
                'message' => 'Service deactivated (has existing subscriptions, cannot delete).',
            ]);
        }

        $service->delete();

        return response()->json(['message' => 'Service deleted successfully']);
    }
}