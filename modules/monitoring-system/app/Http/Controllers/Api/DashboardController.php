<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\Event;
use App\Models\Location;
use App\Models\MaintenanceLog;
use App\Services\DeviceStatusService;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __invoke(DeviceStatusService $devices)
    {
        $summary = $devices->summary();

        return [
            'kpis' => [
                'total_devices' => $summary['total'],
                'online_devices' => $summary['online'],
                'offline_devices' => $summary['offline'],
                'critical_alarms' => Event::where('severity', 'critical')->where('acknowledged', false)->count(),
                'warning_alarms' => Event::whereIn('severity', ['high', 'medium'])->where('acknowledged', false)->count(),
                'active_fire_signals' => Event::whereHas('device', fn ($q) => $q->where('type', 'Fire Alarm'))->where('acknowledged', false)->count(),
                'hvac_faults' => Event::whereHas('device', fn ($q) => $q->where('type', 'HVAC'))->whereIn('event_type', ['fault', 'alarm'])->count(),
                'cctv_offline' => Device::where('type', 'CCTV')->where('status', 'offline')->count(),
            ],
            'device_status' => $summary,
            'latest_events' => Event::with('device:id,name,type')->latest('occurred_at')->limit(12)->get(),
            'event_trends' => Event::selectRaw('date(occurred_at) as day, severity, count(*) as total')->where('occurred_at', '>=', now()->subDays(7))->groupBy('day', 'severity')->orderBy('day')->get(),
            'locations' => Location::withCount('devices')->get(),
            'maintenance_open' => MaintenanceLog::whereIn('status', ['open', 'in progress'])->count(),
            'type_counts' => Device::select('type', DB::raw('count(*) as total'))->groupBy('type')->orderBy('type')->get(),
        ];
    }
}
