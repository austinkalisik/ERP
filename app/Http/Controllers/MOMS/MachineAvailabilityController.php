<?php
namespace App\Http\Controllers\MOMS;

use App\Http\Controllers\Controller;
use App\Models\MOMS\Machine;
use App\Models\MOMS\MaintenanceLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MachineAvailabilityController extends Controller
{
    public function index(Request $request)
    {
        $from = Carbon::parse($request->query('from', now()->subDays(30)->toDateString()))->startOfDay();
        $to   = Carbon::parse($request->query('to',   now()->toDateString()))->endOfDay();

        $periodHours = $from->diffInHours($to);
        $machineId   = $request->query('machine_id');

        $machineQuery = Machine::query();
        if ($machineId) $machineQuery->where('id', $machineId);
        $machines = $machineQuery->get();

        // ── Maintenance logs in period ───────────────────────────────────────
        $maintenanceLogs = MaintenanceLog::whereBetween('start_time', [$from, $to])
            ->when($machineId, fn($q) => $q->where('machine_id', $machineId))
            ->get()
            ->groupBy('machine_id');

        // ── Per-machine calculations ─────────────────────────────────────────
        $machineData = $machines->map(function ($machine) use ($maintenanceLogs, $periodHours, $from, $to) {
            $mMaintenance = $maintenanceLogs->get($machine->id, collect());

            $plannedHours = $mMaintenance->sum(function ($m) {
                if (!$m->start_time || !$m->end_time) return 0;
                return max(0, Carbon::parse($m->start_time)->diffInMinutes(Carbon::parse($m->end_time)) / 60);
            });

            $totalDowntime   = $plannedHours;
            $availableHours  = max(0, $periodHours - $totalDowntime);
            $availabilityPct = $periodHours > 0
                ? round(($availableHours / $periodHours) * 100, 2)
                : 0;

            $laborPartsCost = DB::table('repair_costs')
                ->where('machine_id', $machine->id)
                ->whereBetween('cost_date', [$from->toDateString(), $to->toDateString()])
                ->sum('amount');

            return [
                'id'               => $machine->id,
                'machine_id'       => $machine->machine_id,
                'make'             => $machine->make,
                'model'            => $machine->model,
                'category'         => $machine->category,
                'location'         => $machine->location,
                'status'           => $machine->status,
                'availability_pct' => $availabilityPct,
                'available_hours'  => round($availableHours, 2),
                'unplanned_hours'  => 0,
                'planned_hours'    => round($plannedHours, 2),
                'total_downtime'   => round($totalDowntime, 2),
                'failure_count'    => 0,
                'mtbf'             => null,
                'mttr'             => null,
                'labor_parts_cost' => round($laborPartsCost, 2),
                'failure_reasons'  => [],
            ];
        });

        $machineCount    = $machines->count();
        $avgAvailability = $machineCount > 0 ? round($machineData->avg('availability_pct'), 2) : 0;
        $totalPlanned    = round($machineData->sum('planned_hours'), 2);

        $days      = (int) $from->diffInDays($to) + 1;
        $dailyData = [];

        if ($days <= 90) {
            $cursor = $from->copy();
            while ($cursor->lte($to)) {
                $dayStart = $cursor->copy()->startOfDay();
                $dayEnd   = $cursor->copy()->endOfDay();

                $downHours = MaintenanceLog::whereBetween('start_time', [$dayStart, $dayEnd])
                    ->when($machineId, fn($q) => $q->where('machine_id', $machineId))
                    ->get()
                    ->sum(function ($m) use ($dayStart, $dayEnd) {
                        if (!$m->start_time || !$m->end_time) return 0;
                        $start = max(Carbon::parse($m->start_time), $dayStart);
                        $end   = min(Carbon::parse($m->end_time), $dayEnd);
                        return max(0, $start->diffInMinutes($end) / 60);
                    });

                $totalMachineHours = $machineCount * 24;
                $dailyAvail = $totalMachineHours > 0
                    ? round((($totalMachineHours - $downHours) / $totalMachineHours) * 100, 1)
                    : 100;

                $dailyData[] = [
                    'date'         => $cursor->toDateString(),
                    'availability' => $dailyAvail,
                    'downtime'     => round($downHours, 2),
                ];

                $cursor->addDay();
            }
        }

        $problematic = $machineData->sortByDesc('planned_hours')->values()->take(10);

        return response()->json([
            'period' => [
                'from'         => $from->toDateString(),
                'to'           => $to->toDateString(),
                'period_hours' => $periodHours,
            ],
            'summary' => [
                'machine_count'     => $machineCount,
                'avg_availability'  => $avgAvailability,
                'total_unplanned'   => 0,
                'total_planned'     => $totalPlanned,
                'total_failures'    => 0,
                'online'            => $machineData->filter(fn($m) => $m['availability_pct'] > 0)->count(),
                'offline_unplanned' => 0,
                'offline_planned'   => $machineData->filter(fn($m) => $m['planned_hours'] >= $periodHours)->count(),
            ],
            'machines'    => $machineData->values(),
            'problematic' => $problematic,
            'daily_trend' => $dailyData,
        ]);
    }
}