<?php
// ── App\Http\Controllers\MOMS\RepairCostController.php ────────────────────

namespace App\Http\Controllers\MOMS;

use App\Http\Controllers\Controller;
use App\Models\MOMS\RepairCost;
use App\Models\MOMS\Machine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RepairCostController extends Controller
{
    // ── GET /api/moms/finance/repair-costs ───────────────────────────────────
    public function index(Request $request)
    {
        $query = RepairCost::with(['machine', 'recorder'])
            ->orderByDesc('cost_date');

        if ($request->filled('machine_id')) $query->where('machine_id', $request->machine_id);
        if ($request->filled('cost_type'))  $query->where('cost_type',  $request->cost_type);
        if ($request->filled('from'))       $query->whereDate('cost_date', '>=', $request->from);
        if ($request->filled('to'))         $query->whereDate('cost_date', '<=', $request->to);

        return response()->json($query->paginate(30));
    }

    // ── POST /api/moms/finance/repair-costs ──────────────────────────────────
    public function store(Request $request)
    {
        $data = $request->validate([
            'machine_id'         => 'required|exists:machines,id',
            'maintenance_log_id' => 'nullable|exists:maintenance_logs,id',
            'breakdown_id'       => 'nullable|exists:breakdowns,id',
            'cost_type'          => 'required|in:labour,parts,external_service,other',
            'description'        => 'required|string|max:500',
            'amount'             => 'required|numeric|min:0',
            'currency'           => 'sometimes|string|max:10',
            'supplier'           => 'nullable|string|max:255',
            'invoice_ref'        => 'nullable|string|max:255',
            'cost_date'          => 'required|date',
            'notes'              => 'nullable|string',
        ]);

        $cost = RepairCost::create(array_merge($data, ['recorded_by' => Auth::id()]));

        return response()->json([
            'message' => 'Repair cost recorded.',
            'data'    => $cost->load('machine', 'recorder'),
        ], 201);
    }

    // ── PUT /api/moms/finance/repair-costs/{id} ───────────────────────────────
    public function update(Request $request, $id)
    {
        $cost = RepairCost::findOrFail($id);
        $data = $request->validate([
            'cost_type'   => 'sometimes|in:labour,parts,external_service,other',
            'description' => 'sometimes|string|max:500',
            'amount'      => 'sometimes|numeric|min:0',
            'currency'    => 'sometimes|string|max:10',
            'supplier'    => 'nullable|string|max:255',
            'invoice_ref' => 'nullable|string|max:255',
            'cost_date'   => 'sometimes|date',
            'notes'       => 'nullable|string',
        ]);
        $cost->update($data);
        return response()->json(['message' => 'Updated.', 'data' => $cost]);
    }

    // ── DELETE /api/moms/finance/repair-costs/{id} ────────────────────────────
    public function destroy($id)
    {
        RepairCost::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted.']);
    }

    // ── GET /api/moms/finance/repair-costs/summary ───────────────────────────
    // Aggregated data for the chart dashboard.
    public function summary(Request $request)
    {
        $from = $request->query('from', now()->subDays(30)->toDateString());
        $to   = $request->query('to',   now()->toDateString());

        // Total by cost type
        $byType = RepairCost::whereBetween('cost_date', [$from, $to])
            ->select('cost_type', DB::raw('SUM(amount) as total'))
            ->groupBy('cost_type')
            ->get()
            ->keyBy('cost_type');

        // Top 10 machines by total R&M spend
        $byMachine = RepairCost::whereBetween('cost_date', [$from, $to])
            ->join('machines', 'repair_costs.machine_id', '=', 'machines.id')
            ->select(
                'machines.machine_id as machine_ref',
                DB::raw("CONCAT(machines.make, ' ', machines.model) as label"),
                DB::raw('SUM(repair_costs.amount) as total')
            )
            ->groupBy('repair_costs.machine_id', 'machines.machine_id', 'machines.make', 'machines.model')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        // Monthly trend (last 6 months)
        $trend = RepairCost::where('cost_date', '>=', now()->subMonths(6)->startOfMonth())
            ->select(
                DB::raw("DATE_FORMAT(cost_date, '%Y-%m') as month"),
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // KPIs
        $totalThisPeriod = RepairCost::whereBetween('cost_date', [$from, $to])->sum('amount');
        $totalLastPeriod = RepairCost::whereBetween('cost_date', [
            now()->parse($from)->subDays(now()->parse($to)->diffInDays($from))->toDateString(),
            now()->parse($from)->subDay()->toDateString(),
        ])->sum('amount');

        return response()->json([
            'kpi' => [
                'total_this_period' => round($totalThisPeriod, 2),
                'total_last_period' => round($totalLastPeriod, 2),
                'change_pct'        => $totalLastPeriod > 0
                    ? round((($totalThisPeriod - $totalLastPeriod) / $totalLastPeriod) * 100, 1)
                    : null,
            ],
            'by_type'    => $byType,
            'by_machine' => $byMachine,
            'trend'      => $trend,
            'from'       => $from,
            'to'         => $to,
        ]);
    }
}