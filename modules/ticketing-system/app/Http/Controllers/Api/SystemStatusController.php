<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SystemStatusController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(SystemStatus::query()->orderBy('name')->get());
    }

    public function update(Request $request, SystemStatus $systemStatus): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['operational', 'degraded', 'outage', 'maintenance'])],
            'message' => ['nullable', 'string'],
        ]);

        $systemStatus->update($data + ['checked_at' => now()]);

        return response()->json($systemStatus);
    }
}
