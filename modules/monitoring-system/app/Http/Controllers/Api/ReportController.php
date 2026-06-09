<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\MaintenanceLog;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function summary()
    {
        return [
            'daily_alarm_report' => Event::whereIn('event_type', ['alarm', 'fault'])->selectRaw('date(occurred_at) as day, severity, count(*) as total')->groupBy('day', 'severity')->orderByDesc('day')->limit(30)->get(),
            'device_downtime_report' => Event::where('message', 'like', '%offline%')->with('device:id,name,type')->latest('occurred_at')->limit(50)->get(),
            'maintenance_report' => MaintenanceLog::with('device:id,name,type')->latest()->limit(50)->get(),
            'fire_alarm_event_report' => Event::whereHas('device', fn ($q) => $q->where('type', 'Fire Alarm'))->latest('occurred_at')->limit(50)->get(),
            'hvac_fault_report' => Event::whereHas('device', fn ($q) => $q->where('type', 'HVAC'))->whereIn('event_type', ['fault', 'alarm'])->latest('occurred_at')->limit(50)->get(),
            'events_by_type' => Event::select('event_type', DB::raw('count(*) as total'))->groupBy('event_type')->get(),
        ];
    }
}
