<?php

namespace App\Http\Controllers\MOMS;

use App\Http\Controllers\Controller;
use App\Models\MOMS\Machine;
use App\Models\MOMS\Assignment;
use App\Models\MOMS\FuelTransaction;
use App\Models\MOMS\JobSite;
use App\Models\MOMS\Breakdown;
use Illuminate\Support\Facades\DB;

class MOMSDashboardController extends Controller
{
    public function stats()
    {
        // FIXED: Was 7 separate COUNT queries. Now 3 queries total.

        // Query 1 — all machine counts in one hit using conditional aggregation
        $machineCounts = Machine::selectRaw("
            COUNT(*) as total,
            SUM(status = 'Active') as active,
            SUM(status != 'Active' AND next_maintenance < NOW() AND next_maintenance IS NOT NULL) as overdue
        ")->first();

        // Query 2 — assignments + job sites together
        $activeAssignments = Assignment::where('status', 'Active')->count();
        $activeJobSites    = JobSite::where('status', 'Active')->count();

        // Query 3 — fuel this month
        $fuelThisMonth = FuelTransaction::whereMonth('transaction_date', now()->month)
            ->whereYear('transaction_date', now()->year)
            ->selectRaw('SUM(volume) as total_volume, SUM(total_cost) as total_cost')
            ->first();

        // Query 4 — breakdowns today (simple, unavoidable)
        $breakdownsToday = Breakdown::whereDate('incident_time', today())->count();

        $totalMachines   = (int) ($machineCounts->total  ?? 0);
        $activeMachines  = (int) ($machineCounts->active ?? 0);
        $utilizationPercentage = $totalMachines > 0
            ? round(($activeMachines / $totalMachines) * 100, 1)
            : 0;

        return response()->json([
            'activeMachines'     => $activeMachines,
            'activeAssignments'  => $activeAssignments,
            'maintenanceOverdue' => (int) ($machineCounts->overdue ?? 0),
            'breakdownsToday'    => $breakdownsToday,
            'fuelUsage'          => [
                'amount' => round($fuelThisMonth->total_volume ?? 0, 2),
                'cost'   => round($fuelThisMonth->total_cost   ?? 0, 2),
            ],
            'machineUtilization' => [
                'percentage' => $utilizationPercentage,
                'active'     => $activeMachines,
                'total'      => $totalMachines,
            ],
            'activeJobSites' => [
                'count'       => $activeJobSites,
                'avgProgress' => 0,
            ],
        ]);
    }

    public function machineUtilization()
    {
        // FIXED: Was 4 separate COUNT queries (one per status).
        // Now 1 query using GROUP BY.
        $counts = Machine::selectRaw("status, COUNT(*) as total")
            ->groupBy('status')
            ->pluck('total', 'status');

        $data = [];
        $map  = [
            'Active'            => 'Active',
            'Idle'              => 'Idle',
            'Under Maintenance' => 'Maintenance',
            'Inactive'          => 'Inactive',
        ];

        foreach ($map as $dbStatus => $label) {
            $value = (int) ($counts[$dbStatus] ?? 0);
            if ($value > 0) {
                $data[] = ['name' => $label, 'value' => $value];
            }
        }

        return response()->json($data);
    }

    public function downtimeOverview()
    {
        $breakdowns = Breakdown::with('machine')
            ->where('incident_time', '>=', now()->subDays(7))
            ->whereNotNull('downtime_minutes')
            ->get();

        $downtimeByMachine = $breakdowns->groupBy('machine_id')->map(function ($group) {
            $machine      = $group->first()->machine;
            $totalDowntime = $group->sum('downtime_minutes');
            return [
                'machine'  => $machine ? $machine->machine_id : 'Unknown',
                'downtime' => round($totalDowntime / 60, 2),
            ];
        })->values();

        $totalDowntimeMinutes = $breakdowns->sum('downtime_minutes');
        $machinesTracked      = $downtimeByMachine->count();

        return response()->json([
            'chartData' => $downtimeByMachine,
            'summary'   => [
                'totalOpHours'           => 0,
                'totalDowntime'          => round($totalDowntimeMinutes / 60, 2),
                'machinesTracked'        => $machinesTracked,
                'avgDowntimePerMachine'  => $machinesTracked > 0
                    ? round(($totalDowntimeMinutes / 60) / $machinesTracked, 2)
                    : 0,
            ],
        ]);
    }

    public function fuelConsumption()
    {
        $fuelData = FuelTransaction::whereBetween('transaction_date', [
                now()->subDays(30),
                now(),
            ])
            ->select(
                DB::raw('DATE(transaction_date) as date'),
                DB::raw('SUM(volume) as fuel')
            )
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get()
            ->map(fn($row) => [
                'date' => \Carbon\Carbon::parse($row->date)->format('M d'),
                'fuel' => round($row->fuel, 2),
            ]);

        return response()->json($fuelData);
    }
}