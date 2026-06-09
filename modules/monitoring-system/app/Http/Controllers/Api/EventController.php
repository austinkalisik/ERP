<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Services\AlarmService;
use App\Services\AuditLogService;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(Request $request)
    {
        return Event::with('device:id,name,type')
            ->when($request->severity, fn ($q, $s) => $q->where('severity', $s))
            ->when($request->event_type, fn ($q, $t) => $q->where('event_type', $t))
            ->when($request->acknowledged !== null, fn ($q) => $q->where('acknowledged', filter_var($request->acknowledged, FILTER_VALIDATE_BOOLEAN)))
            ->latest('occurred_at')->paginate(60);
    }

    public function show(Event $event) { return $event->load('device.location', 'acknowledgements'); }

    public function acknowledge(Request $request, Event $event, AlarmService $alarms, AuditLogService $audit)
    {
        $data = $request->validate(['notes' => ['nullable', 'string', 'max:2000']]);
        $event = $alarms->acknowledge($event, $request->user(), $data['notes'] ?? null);
        $audit->record($request->user()->id, 'event.acknowledged', $event, ['notes' => $data['notes'] ?? null], $request);
        return $event->load('device:id,name,type');
    }
}
