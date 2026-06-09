<?php

namespace App\Http\Controllers\MOMS;

use App\Http\Controllers\Controller;
use App\Models\MOMS\FuelTransaction;
use App\Models\User;
use App\Notifications\MOMS\FuelTransactionNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class FuelTransactionController extends Controller
{
    public function index()
    {
        // FIXED: Added pagination — full table dump gets slower as transactions grow.
        $transactions = FuelTransaction::with(['machine', 'loggedBy'])
            ->orderBy('transaction_date', 'desc')
            ->paginate(50);

        return response()->json([
            'data' => $transactions->getCollection()->map(fn($t) => $this->formatTransaction($t)),
            'meta' => [
                'total'        => $transactions->total(),
                'current_page' => $transactions->currentPage(),
                'last_page'    => $transactions->lastPage(),
                'per_page'     => $transactions->perPage(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'machine_id'       => 'required|exists:machines,id',
            'fuel_type'        => 'required|in:Diesel,Petrol,LPG,CNG',
            'volume'           => 'required|numeric|min:0',
            'unit_price'       => 'required|numeric|min:0',
            'total_cost'       => 'required|numeric|min:0',
            'transaction_date' => 'required|date',
            'engine_hours'     => 'nullable|numeric|min:0',
            'notes'            => 'nullable|string',
        ]);

        $validated['logged_by'] = Auth::id();

        $transaction = FuelTransaction::create($validated);
        $transaction->load(['machine', 'loggedBy']);

        // FIXED: Exclude current user in the query, not in the loop.
        // Add ShouldQueue to FuelTransactionNotification so these
        // notify() calls don't block the HTTP response.
        User::whereIn('role', [
            'system_admin',
            'moms_manager',
            'moms_supervisor',
        ])
        ->where('id', '!=', Auth::id())
        ->get()
        ->each(fn($user) => $user->notify(new FuelTransactionNotification($transaction)));

        return response()->json([
            'message' => 'Fuel transaction logged successfully',
            'data'    => $this->formatTransaction($transaction),
        ], 201);
    }

    public function show($id)
    {
        $transaction = FuelTransaction::with(['machine', 'loggedBy'])->findOrFail($id);
        return response()->json($this->formatTransaction($transaction));
    }

    public function update(Request $request, $id)
    {
        $transaction = FuelTransaction::findOrFail($id);

        $validated = $request->validate([
            'machine_id'       => 'sometimes|exists:machines,id',
            'fuel_type'        => 'sometimes|in:Diesel,Petrol,LPG,CNG',
            'volume'           => 'sometimes|numeric|min:0',
            'unit_price'       => 'sometimes|numeric|min:0',
            'total_cost'       => 'sometimes|numeric|min:0',
            'transaction_date' => 'sometimes|date',
            'engine_hours'     => 'nullable|numeric|min:0',
            'notes'            => 'nullable|string',
        ]);

        $transaction->update($validated);
        $transaction->load(['machine', 'loggedBy']);

        return response()->json([
            'message' => 'Fuel transaction updated successfully',
            'data'    => $this->formatTransaction($transaction),
        ]);
    }

    public function destroy($id)
    {
        FuelTransaction::findOrFail($id)->delete();
        return response()->json(['message' => 'Fuel transaction deleted successfully']);
    }

    public function stats()
    {
        // FIXED: Was 4 separate queries. Combined into 2.

        // Query 1 — scalar stats in one hit
        $totals = FuelTransaction::selectRaw("
            COUNT(*) as total_transactions,
            SUM(MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?) as this_month,
            AVG(unit_price) as avg_cost_per_unit
        ", [now()->month, now()->year])->first();

        // Query 2 — distinct fuel types (small result, unavoidable)
        $fuelTypes = FuelTransaction::select('fuel_type')
            ->distinct()
            ->pluck('fuel_type')
            ->toArray();

        if (empty($fuelTypes)) {
            $fuelTypes = ['Diesel', 'Petrol', 'LPG', 'CNG'];
        }

        return response()->json([
            'totalTransactions' => (int) ($totals->total_transactions ?? 0),
            'thisMonth'         => (int) ($totals->this_month         ?? 0),
            'fuelTypes'         => $fuelTypes,
            'avgCostPerUnit'    => round($totals->avg_cost_per_unit   ?? 0, 2),
        ]);
    }

    public function consumptionReport(Request $request)
    {
        $startDate = $request->input('startDate', now()->subMonth()->format('Y-m-d'));
        $endDate   = $request->input('endDate',   now()->format('Y-m-d'));

        $report = FuelTransaction::with('machine')
            ->whereBetween('transaction_date', [$startDate, $endDate])
            ->select(
                'machine_id',
                DB::raw('SUM(volume) as total_volume'),
                DB::raw('SUM(engine_hours) as total_engine_hours'),
                DB::raw('COUNT(*) as transaction_count')
            )
            ->groupBy('machine_id')
            ->get()
            ->map(function ($item) {
                $totalVolume = round($item->total_volume, 2);
                $engineHours = round($item->total_engine_hours ?? 0, 2);
                $efficiency  = $engineHours > 0
                    ? round($totalVolume / $engineHours, 2)
                    : 0;

                return [
                    'machine_id'        => $item->machine ? $item->machine->machine_id : 'Unknown',
                    'machine_name'      => $item->machine ? $item->machine->name       : 'Unknown',
                    'total_volume'      => $totalVolume,
                    'engine_hours'      => $engineHours,
                    'efficiency'        => $efficiency,
                    'transaction_count' => $item->transaction_count,
                ];
            });

        return response()->json($report);
    }

    private function formatTransaction(FuelTransaction $t): array
    {
        return [
            'id'               => $t->id,
            'machine_id'       => $t->machine ? $t->machine->machine_id : 'N/A',
            'machine_name'     => $t->machine ? $t->machine->name       : 'N/A',
            'fuel_type'        => $t->fuel_type,
            'volume'           => $t->volume,
            'unit_price'       => $t->unit_price,
            'total_cost'       => $t->total_cost,
            'engine_hours'     => $t->engine_hours ?? 0,
            'transaction_date' => $t->transaction_date->format('Y-m-d'),
            'logged_by'        => $t->loggedBy ? $t->loggedBy->name : 'System',
            'notes'            => $t->notes,
        ];
    }
}