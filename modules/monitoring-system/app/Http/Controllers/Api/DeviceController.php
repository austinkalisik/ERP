<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Services\AuditLogService;
use Illuminate\Http\Request;

class DeviceController extends Controller
{
    public function index(Request $request)
    {
        return Device::with('location')
            ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%$s%")->orWhere('type', 'like', "%$s%"))
            ->when($request->type, fn ($q, $type) => $q->where('type', $type))
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->latest()->paginate(50);
    }

    public function store(Request $request, AuditLogService $audit)
    {
        $device = Device::create($this->validated($request));
        $audit->record($request->user()->id, 'device.created', $device, [], $request);
        return response()->json($device->load('location'), 201);
    }

    public function show(Device $device)
    {
        return $device->load(['location', 'readings' => fn ($q) => $q->latest('recorded_at')->limit(25), 'events' => fn ($q) => $q->latest('occurred_at')->limit(25)]);
    }

    public function update(Request $request, Device $device, AuditLogService $audit)
    {
        $device->update($this->validated($request, true));
        $audit->record($request->user()->id, 'device.updated', $device, [], $request);
        return $device->load('location');
    }

    public function destroy(Request $request, Device $device, AuditLogService $audit)
    {
        $audit->record($request->user()->id, 'device.deleted', $device, ['name' => $device->name], $request);
        $device->delete();
        return response()->noContent();
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $rule = $partial ? 'sometimes' : 'required';
        return $request->validate([
            'location_id' => ['nullable', 'exists:locations,id'],
            'name' => [$rule, 'string'],
            'type' => [$rule, 'string'],
            'ip_address' => ['nullable', 'string'],
            'protocol' => [$rule, 'string'],
            'status' => [$rule, 'string'],
            'last_heartbeat' => ['nullable', 'date'],
            'manufacturer' => ['nullable', 'string'],
            'model' => ['nullable', 'string'],
            'serial_number' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'metadata' => ['nullable', 'array'],
        ]);
    }
}
