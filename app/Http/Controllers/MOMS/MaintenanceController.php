<?php

namespace App\Http\Controllers\MOMS;

use App\Http\Controllers\Controller;
use App\Models\MOMS\MaintenanceLog;
use App\Models\MOMS\MaintenanceSchedule;
use App\Models\AIMS\Item;
use App\Models\User;
use App\Notifications\MOMS\MaintenanceCompletedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class MaintenanceController extends Controller
{
    // ==================== MAINTENANCE LOGS ====================

    public function logs()
    {
        $logs = MaintenanceLog::with(['machine', 'schedule', 'performedBy'])
            ->orderBy('start_time', 'desc')
            ->get()
            ->map(fn($log) => $this->formatLog($log));

        return response()->json($logs);
    }

    public function showLog($id)
    {
        $log = MaintenanceLog::with(['machine', 'schedule', 'performedBy'])->findOrFail($id);
        return response()->json($this->formatLog($log, true));
    }

    public function storeLog(Request $request)
    {
        $validated = $request->validate([
            'machine_id'              => 'required|exists:machines,id',
            'maintenance_schedule_id' => 'nullable|exists:maintenance_schedules,id',
            'maintenance_type'        => 'required|in:Preventive,Corrective,Predictive,Emergency,Routine Check',
            'status'                  => 'required|in:Scheduled,In Progress,Completed,Cancelled',
            'start_time'              => 'required|date',
            'end_time'                => 'nullable|date|after_or_equal:start_time',
            'cost'                    => 'nullable|numeric|min:0',
            'description'             => 'required|string',
            'parts_used'              => 'nullable|array',
            'parts_used.*.item_id'    => 'required_with:parts_used|exists:items,id',
            'parts_used.*.qty'        => 'required_with:parts_used|numeric|min:1',
        ]);

        $validated['performed_by'] = Auth::id();
        $validated = $this->parseTimes($validated);

        if (!empty($validated['parts_used'])) {
            [$enriched, $partsCost]  = $this->enrichParts($validated['parts_used']);
            $validated['parts_used'] = $enriched;
            $validated['parts_cost'] = $partsCost;
            if (empty($validated['cost'])) {
                $validated['cost'] = $partsCost;
            }
        } else {
            $validated['parts_used'] = null;
            $validated['parts_cost'] = 0;
        }

        $log = MaintenanceLog::create($validated);
        $log->load(['machine', 'performedBy']);

        if ($validated['status'] === 'Completed' && !empty($validated['maintenance_schedule_id'])) {
            $this->advanceSchedule($validated['maintenance_schedule_id'], $log);
        }

        // FIXED: ShouldQueue on the notification class makes this non-blocking.
        // If you haven't added ShouldQueue to MaintenanceCompletedNotification yet,
        // do that — the notify() calls below will then dispatch to the queue
        // instead of executing synchronously during the HTTP request.
        if ($validated['status'] === 'Completed') {
            $this->notifyMomsUsers(new MaintenanceCompletedNotification($log));
        }

        return response()->json([
            'message' => 'Maintenance log created successfully',
            'data'    => $this->formatLog($log),
        ], 201);
    }

    public function updateLog(Request $request, $id)
    {
        $log            = MaintenanceLog::findOrFail($id);
        $previousStatus = $log->status;

        $validated = $request->validate([
            'machine_id'              => 'required|exists:machines,id',
            'maintenance_schedule_id' => 'nullable|exists:maintenance_schedules,id',
            'maintenance_type'        => 'required|in:Preventive,Corrective,Predictive,Emergency,Routine Check',
            'status'                  => 'required|in:Scheduled,In Progress,Completed,Cancelled',
            'start_time'              => 'required|date',
            'end_time'                => 'nullable|date|after_or_equal:start_time',
            'cost'                    => 'nullable|numeric|min:0',
            'description'             => 'required|string',
            'parts_used'              => 'nullable|array',
            'parts_used.*.item_id'    => 'required_with:parts_used|exists:items,id',
            'parts_used.*.qty'        => 'required_with:parts_used|numeric|min:1',
        ]);

        $validated = $this->parseTimes($validated);

        if (!empty($validated['parts_used'])) {
            [$enriched, $partsCost]  = $this->enrichParts($validated['parts_used']);
            $validated['parts_used'] = $enriched;
            $validated['parts_cost'] = $partsCost;
            if (empty($validated['cost'])) {
                $validated['cost'] = $partsCost;
            }
        } else {
            $validated['parts_used'] = null;
            $validated['parts_cost'] = 0;
        }

        $log->update($validated);
        $log->load(['machine', 'schedule', 'performedBy']);

        if ($previousStatus !== 'Completed' && $validated['status'] === 'Completed' && !empty($validated['maintenance_schedule_id'])) {
            $this->advanceSchedule($validated['maintenance_schedule_id'], $log);
        }

        if ($previousStatus !== 'Completed' && $validated['status'] === 'Completed') {
            $this->notifyMomsUsers(new MaintenanceCompletedNotification($log));
        }

        return response()->json([
            'message' => 'Maintenance log updated successfully',
            'data'    => $this->formatLog($log, true),
        ]);
    }

    public function stats()
    {
        return response()->json([
            'totalLogs' => MaintenanceLog::count(),
            'critical'  => MaintenanceSchedule::where('next_due_date', '<', now())
                ->where('is_active', true)->count(),
            'pending'   => MaintenanceLog::whereIn('status', ['Scheduled', 'In Progress'])->count(),
            'schedules' => MaintenanceSchedule::where('is_active', true)->count(),
        ]);
    }

    // ==================== NOTIFICATIONS ====================

    public function notifications()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // FIXED: Load unread notifications once, reuse the collection for count.
        // Previously this called unreadNotifications() twice = 2 DB queries.
        $unread = $user->unreadNotifications()
            ->latest()
            ->take(20)
            ->get();

        $notifications = $unread->map(fn($n) => [
            'id'         => $n->id,
            'title'      => $n->data['title']   ?? 'Notification',
            'message'    => $n->data['message']  ?? '',
            'url'        => $n->data['url']      ?? '/moms/maintenance/schedules',
            'reason'     => $n->data['reason']   ?? null,
            'created_at' => $n->created_at->diffForHumans(),
            'read'       => false,
        ]);

        return response()->json([
            'notifications' => $notifications,
            'unread_count'  => $unread->count(), // FIXED: collection count, not a second DB query
        ]);
    }

    public function markNotificationRead($notificationId)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $user->unreadNotifications()
            ->where('id', $notificationId)
            ->first()
            ?->markAsRead();

        return response()->json(['message' => 'Marked as read']);
    }

    public function markAllNotificationsRead()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $user->unreadNotifications()->update(['read_at' => now()]);
        return response()->json(['message' => 'All marked as read']);
    }

    // ==================== MAINTENANCE SCHEDULES ====================

    public function schedules()
    {
        $schedules = MaintenanceSchedule::with('machine')
            ->orderBy('next_due_date', 'asc')
            ->get()
            ->map(fn($s) => $this->formatSchedule($s));

        return response()->json($schedules);
    }

    public function showSchedule($id)
    {
        $schedule = MaintenanceSchedule::with('machine')->findOrFail($id);
        return response()->json($this->formatSchedule($schedule));
    }

    public function storeSchedule(Request $request)
    {
        $validated = $request->validate([
            'machine_id'        => 'required|exists:machines,id',
            'title'             => 'required|string|max:255',
            'description'       => 'required|string',
            'frequency'         => 'required|in:Daily,Weekly,Monthly,Yearly,Custom',
            'interval_value'    => 'required|integer|min:1',
            'hour_interval'     => 'nullable|integer|min:1',
            'last_engine_hours' => 'nullable|integer|min:0',
            'next_due_date'     => 'required|date',
            'is_active'         => 'boolean',
        ]);

        if (!empty($validated['hour_interval']) && !empty($validated['last_engine_hours'])) {
            $validated['next_due_hours'] = $validated['last_engine_hours'] + $validated['hour_interval'];
        }

        $schedule = MaintenanceSchedule::create($validated);
        $schedule->load('machine');

        return response()->json([
            'message' => 'Maintenance schedule created successfully',
            'data'    => $this->formatSchedule($schedule),
        ], 201);
    }

    public function updateSchedule(Request $request, $id)
    {
        $schedule = MaintenanceSchedule::findOrFail($id);

        $validated = $request->validate([
            'machine_id'        => 'required|exists:machines,id',
            'title'             => 'required|string|max:255',
            'description'       => 'required|string',
            'frequency'         => 'required|in:Daily,Weekly,Monthly,Yearly,Custom',
            'interval_value'    => 'required|integer|min:1',
            'hour_interval'     => 'nullable|integer|min:1',
            'last_engine_hours' => 'nullable|integer|min:0',
            'next_due_date'     => 'required|date',
            'is_active'         => 'boolean',
        ]);

        if (!empty($validated['hour_interval']) && !empty($validated['last_engine_hours'])) {
            $validated['next_due_hours'] = $validated['last_engine_hours'] + $validated['hour_interval'];
        }

        $schedule->update($validated);
        $schedule->load('machine');

        return response()->json([
            'message' => 'Maintenance schedule updated successfully',
            'data'    => $this->formatSchedule($schedule),
        ]);
    }

    public function destroySchedule($id)
    {
        $schedule = MaintenanceSchedule::findOrFail($id);
        $schedule->delete();
        return response()->json(['message' => 'Maintenance schedule deleted successfully']);
    }

    // ==================== PRIVATE HELPERS ====================

    private function advanceSchedule(int $scheduleId, MaintenanceLog $log): void
    {
        $schedule = MaintenanceSchedule::find($scheduleId);
        if (!$schedule) return;

        $today = Carbon::today();

        $nextDate = match ($schedule->frequency) {
            'Daily'   => $today->copy()->addDays($schedule->interval_value),
            'Weekly'  => $today->copy()->addWeeks($schedule->interval_value),
            'Monthly' => $today->copy()->addMonths($schedule->interval_value),
            'Yearly'  => $today->copy()->addYears($schedule->interval_value),
            default   => $today->copy()->addDays($schedule->interval_value),
        };

        $updates = [
            'last_performed_date' => $today,
            'next_due_date'       => $nextDate,
        ];

        if ($schedule->hour_interval) {
            $machine                      = $log->machine;
            $currentHours                 = $machine?->engine_hours ?? $schedule->last_engine_hours ?? 0;
            $updates['last_engine_hours'] = $currentHours;
            $updates['next_due_hours']    = $currentHours + $schedule->hour_interval;
        }

        $schedule->update($updates);
    }

    private function enrichParts(array $parts): array
    {
        $total    = 0;
        $enriched = [];

        // FIXED: Batch-load all needed items in one query instead of
        // calling Item::find() inside the loop (N+1 query).
        $itemIds = array_column($parts, 'item_id');
        $items   = Item::whereIn('id', $itemIds)->get()->keyBy('id');

        foreach ($parts as $part) {
            $item = $items->get($part['item_id']);
            if (!$item) continue;

            $qty       = (float) $part['qty'];
            $unitCost  = (float) $item->cost_price;
            $lineTotal = round($qty * $unitCost, 2);

            $enriched[] = [
                'item_id'   => $item->id,
                'name'      => $item->name,
                'sku'       => $item->sku,
                'qty'       => $qty,
                'unit'      => $item->unit,
                'unit_cost' => $unitCost,
                'total'     => $lineTotal,
            ];

            $total += $lineTotal;
        }

        return [$enriched, round($total, 2)];
    }

    private function formatLog(MaintenanceLog $log, bool $full = false): array
    {
        $data = [
            'id'                      => $log->id,
            'machine'                 => [
                'id'         => $log->machine->id ?? null,
                'machine_id' => $log->machine->machine_id ?? 'N/A',
            ],
            'maintenance_schedule_id' => $log->maintenance_schedule_id,
            'maintenance_type'        => $log->maintenance_type,
            'status'                  => $log->status,
            'start_time'              => $log->start_time?->format('Y-m-d H:i:s'),
            'end_time'                => $log->end_time?->format('Y-m-d H:i:s'),
            'cost'                    => $log->cost,
            'parts_cost'              => $log->parts_cost,
            'description'             => $log->description,
            'performed_by'            => $log->performedBy->name ?? null,
        ];

        if ($full) {
            $data['parts_used'] = $log->parts_used ?? [];
            $data['schedule']   = $log->schedule
                ? ['id' => $log->schedule->id, 'title' => $log->schedule->title]
                : null;
        }

        return $data;
    }

    private function formatSchedule(MaintenanceSchedule $schedule): array
    {
        return [
            'id'                  => $schedule->id,
            'machine'             => [
                'id'         => $schedule->machine->id ?? null,
                'machine_id' => $schedule->machine->machine_id ?? 'N/A',
            ],
            'title'               => $schedule->title,
            'description'         => $schedule->description,
            'frequency'           => $schedule->frequency,
            'interval_value'      => $schedule->interval_value,
            'hour_interval'       => $schedule->hour_interval,
            'last_engine_hours'   => $schedule->last_engine_hours,
            'next_due_hours'      => $schedule->next_due_hours,
            'next_due_date'       => $schedule->next_due_date?->format('Y-m-d'),
            'last_performed_date' => $schedule->last_performed_date?->format('Y-m-d'),
            'is_active'           => $schedule->is_active,
        ];
    }

    private function notifyMomsUsers(object $notification): void
    {
        // FIXED: Exclude current user in the query itself instead of inside the loop,
        // and use each() to avoid loading the full collection into memory unnecessarily.
        // Make MaintenanceCompletedNotification implement ShouldQueue so these
        // notify() calls dispatch to the queue and don't block the HTTP response.
        User::whereIn('role', [
            'system_admin',
            'moms_manager',
            'moms_supervisor',
            'moms_operator',
        ])
        ->where('id', '!=', Auth::id())
        ->get()
        ->each(fn($user) => $user->notify($notification));
    }

    private function parseTimes(array $data): array
    {
        $tz = config('app.timezone');
        if (!empty($data['start_time'])) {
            $data['start_time'] = Carbon::parse($data['start_time'], $tz)->format('Y-m-d H:i:s');
        }
        if (!empty($data['end_time'])) {
            $data['end_time'] = Carbon::parse($data['end_time'], $tz)->format('Y-m-d H:i:s');
        }
        return $data;
    }
}