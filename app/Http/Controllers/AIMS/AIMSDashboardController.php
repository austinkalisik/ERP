<?php

namespace App\Http\Controllers\AIMS;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AIMSDashboardController extends Controller
{
    public function index()
    {
        // FIXED: Removed Schema::hasTable() — it hits information_schema on every
        // request. Tables exist in production; no need to check at runtime.
        // Also combined into one query instead of three separate counts.
        $counts = DB::table('items')->selectRaw("
            COUNT(*) as total,
            SUM(current_stock = 0) as out_of_stock,
            SUM(current_stock > 0 AND current_stock <= minimum_stock) as low_stock
        ")->first();

        return response()->json([
            'total_items'        => (int) ($counts->total        ?? 0),
            'low_stock_items'    => (int) ($counts->low_stock    ?? 0),
            'out_of_stock_items' => (int) ($counts->out_of_stock ?? 0),
        ]);
    }

    public function stockDistribution()
    {
        // FIXED: Was 4 separate queries. Now 1 query with conditional aggregation.
        $counts = DB::table('items')->selectRaw("
            SUM(current_stock > minimum_stock) as in_stock,
            SUM(current_stock > 0 AND current_stock <= minimum_stock) as low_stock,
            SUM(current_stock = 0) as out_of_stock,
            SUM(maximum_stock > 0 AND current_stock > maximum_stock) as overstock
        ")->first();

        return response()->json([
            'in_stock'     => (int) ($counts->in_stock     ?? 0),
            'low_stock'    => (int) ($counts->low_stock    ?? 0),
            'out_of_stock' => (int) ($counts->out_of_stock ?? 0),
            'overstock'    => (int) ($counts->overstock    ?? 0),
        ]);
    }

    public function lowStockTrend()
    {
        // FIXED: Was 7 separate COUNT queries (one per day in a PHP loop).
        // Now 1 query — get all low-stock items updated in the last 7 days
        // and group by date in the DB, then fill in any missing days in PHP.

        $startDate = Carbon::now()->subDays(6)->startOfDay();

        $rows = DB::table('items')
            ->selectRaw("DATE(updated_at) as date, COUNT(*) as count")
            ->where('updated_at', '>=', $startDate)
            ->where('current_stock', '>', 0)
            ->whereColumn('current_stock', '<=', 'minimum_stock')
            ->groupByRaw('DATE(updated_at)')
            ->orderBy('date')
            ->pluck('count', 'date');

        // Fill in all 7 days — days with no updates get 0
        $days = collect(range(6, 0))->map(function ($i) use ($rows) {
            $date = Carbon::now()->subDays($i)->format('Y-m-d');
            return [
                'date'  => $date,
                'count' => (int) ($rows[$date] ?? 0),
            ];
        });

        return response()->json($days);
    }
}