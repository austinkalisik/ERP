<?php

namespace App\Http\Controllers\MOMS\Finance;

use App\Http\Controllers\Controller;
use App\Models\MOMS\FuelPricing;
use App\Models\MOMS\FuelTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class FuelPricingController extends Controller
{
    /**
     * Get current fuel pricing and history.
     * FIXED: Added cache — this data changes rarely (only when manually updated).
     * Cache is cleared in store() so it stays fresh after updates.
     */
    public function index()
    {
        $data = Cache::remember('moms.fuel_pricing', 600, function () {
            $currentPrice = FuelPricing::getCurrentPrice();

            $history = FuelPricing::with('updatedBy')
                ->orderBy('effective_date', 'desc')
                ->take(10)
                ->get()
                ->map(fn($record) => [
                    'id'             => $record->id,
                    'cost_per_litre' => $record->cost_per_litre,
                    'effective_date' => $record->effective_date->format('Y-m-d H:i:s'),
                    'notes'          => $record->notes,
                    'updated_by'     => $record->updatedBy?->name ?? 'System',
                ]);

            return [
                'currentPrice' => $currentPrice ? [
                    'id'             => $currentPrice->id,
                    'cost_per_litre' => $currentPrice->cost_per_litre,
                    'effective_date' => $currentPrice->effective_date->format('Y-m-d H:i:s'),
                    'last_updated'   => $currentPrice->updated_at->format('Y-m-d H:i:s'),
                    'notes'          => $currentPrice->notes,
                ] : null,
                'history' => $history,
            ];
        });

        return response()->json($data);
    }

    /**
     * Store new fuel pricing.
     * FIXED: Clears the cache after saving so index() returns fresh data.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'cost_per_litre' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
            'notes'          => 'nullable|string',
        ]);

        if (isset($validated['effective_date'])) {
            $validated['effective_date'] = Carbon::parse($validated['effective_date'], config('app.timezone'))
                ->format('Y-m-d H:i:s');
        }

        $validated['updated_by'] = Auth::id();

        $pricing = FuelPricing::create($validated);

        // Clear cache so next request gets the new price
        Cache::forget('moms.fuel_pricing');

        return response()->json([
            'message' => 'Fuel pricing updated successfully',
            'data'    => [
                'id'             => $pricing->id,
                'cost_per_litre' => $pricing->cost_per_litre,
                'effective_date' => $pricing->effective_date->format('Y-m-d H:i:s'),
                'notes'          => $pricing->notes,
            ],
        ], 201);
    }

    /**
     * Get fuel costs report grouped by date.
     * FIXED: Removed Carbon instance check — groupBy('transaction_date') already
     * returns date strings from MySQL. The extra instanceof check was dead code.
     */
    public function fuelCosts(Request $request)
    {
        $startDate = $request->input('start_date', now()->subMonth()->format('Y-m-d'));
        $endDate   = $request->input('end_date',   now()->format('Y-m-d'));

        $transactions = FuelTransaction::whereBetween('transaction_date', [$startDate, $endDate])
            ->select(
                DB::raw('DATE(transaction_date) as date'),
                DB::raw('SUM(volume) as volume'),
                DB::raw('SUM(total_cost) as cost')
            )
            ->groupBy(DB::raw('DATE(transaction_date)'))
            ->orderBy('date', 'desc')
            ->get()
            ->map(fn($t) => [
                'date'   => $t->date,
                'volume' => round((float) $t->volume, 2),
                'cost'   => round((float) $t->cost,   2),
            ]);

        return response()->json([
            'transactions' => $transactions,
            'totalVolume'  => round($transactions->sum('volume'), 2),
            'totalCost'    => round($transactions->sum('cost'),   2),
        ]);
    }
}