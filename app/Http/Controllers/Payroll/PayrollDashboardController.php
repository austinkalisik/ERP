<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\Payroll\Payroll;
use Illuminate\Support\Facades\DB;

class PayrollDashboardController extends Controller
{
    public function stats()
    {
        // FIXED: Was 6 separate queries. Now 2 queries total.

        // Query 1 — all scalar stats in one hit using conditional aggregation
        $totals = Payroll::selectRaw("
            COUNT(*) as total_runs,
            SUM(status = 'Pending') as pending_runs,
            SUM(CASE WHEN status = 'Paid' THEN net_pay ELSE 0 END) as completed_amount,
            SUM(CASE WHEN status = 'Pending' THEN net_pay ELSE 0 END) as pending_amount,
            SUM(net_pay) as total_amount
        ")->first();

        // Query 2 — status distribution for chart (needs GROUP BY, can't fold into above)
        $statusData = Payroll::select('status', DB::raw('COUNT(*) as value'))
            ->groupBy('status')
            ->get()
            ->map(fn($row) => [
                'name'  => $row->status,
                'value' => $row->value,
            ]);

        // Query 3 — trend data (needs GROUP BY on date, separate concern)
        $trendData = Payroll::select(
                DB::raw("DATE_FORMAT(pay_period_start, '%Y-%m') as month"),
                DB::raw('SUM(net_pay) as amount')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json([
            'totalRuns'          => (int) ($totals->total_runs       ?? 0),
            'pendingRuns'        => (int) ($totals->pending_runs      ?? 0),
            'completedAmount'    => round($totals->completed_amount   ?? 0, 2),
            'pendingAmount'      => round($totals->pending_amount     ?? 0, 2),
            'totalPayrollAmount' => round($totals->total_amount       ?? 0, 2),
            'statusData'         => $statusData,
            'trendData'          => $trendData,
        ]);
    }
}