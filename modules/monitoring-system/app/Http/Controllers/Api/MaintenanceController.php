<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MaintenanceLog;
use App\Services\AuditLogService;
use Illuminate\Http\Request;

class MaintenanceController extends Controller
{
    public function index() { return MaintenanceLog::with('device:id,name,type', 'technician:id,name')->latest()->paginate(50); }
    public function show(MaintenanceLog $maintenance) { return $maintenance->load('device.location', 'technician'); }

    public function store(Request $request, AuditLogService $audit)
    {
        $log = MaintenanceLog::create($this->validated($request));
        $audit->record($request->user()->id, 'maintenance.created', $log, [], $request);
        return response()->json($log->load('device', 'technician'), 201);
    }

    public function update(Request $request, MaintenanceLog $maintenance, AuditLogService $audit)
    {
        $maintenance->update($this->validated($request, true));
        $audit->record($request->user()->id, 'maintenance.updated', $maintenance, [], $request);
        return $maintenance->load('device', 'technician');
    }

    public function destroy(MaintenanceLog $maintenance)
    {
        $maintenance->delete();
        return response()->noContent();
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $rule = $partial ? 'sometimes' : 'required';
        return $request->validate([
            'device_id' => [$rule, 'exists:devices,id'],
            'assigned_technician_id' => ['nullable', 'exists:users,id'],
            'issue' => [$rule, 'string'],
            'priority' => [$rule, 'string'],
            'status' => [$rule, 'string'],
            'due_date' => ['nullable', 'date'],
            'resolution_notes' => ['nullable', 'string'],
        ]);
    }
}
