<?php

namespace App\Services;

use App\Models\Device;

class DeviceStatusService
{
    public function summary(): array
    {
        $byStatus = Device::query()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');

        return [
            'total' => Device::count(),
            'online' => (int) ($byStatus['online'] ?? 0),
            'offline' => (int) ($byStatus['offline'] ?? 0),
            'warning' => (int) ($byStatus['warning'] ?? 0),
            'alarm' => (int) ($byStatus['alarm'] ?? 0),
            'maintenance' => (int) ($byStatus['maintenance'] ?? 0),
            'by_status' => $byStatus,
            'by_type' => Device::query()->selectRaw('type, count(*) as total')->groupBy('type')->orderBy('type')->get(),
        ];
    }
}
