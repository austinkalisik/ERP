<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\Item;
use App\Models\SystemNotification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    protected function getIntSetting(string $key, int $default): int
    {
        $value = DB::table('settings')->where('key', $key)->value('value');

        if (! is_numeric($value)) {
            return $default;
        }

        return (int) $value;
    }

    protected function lowStockQuery(int $defaultThreshold)
    {
        return Item::query()
            ->where('quantity', '>', 0)
            ->where(function ($query) use ($defaultThreshold) {
                $query->where(function ($sub) {
                    $sub->whereNotNull('reorder_level')
                        ->whereColumn('quantity', '<=', 'reorder_level');
                })->orWhere(function ($sub) use ($defaultThreshold) {
                    $sub->whereNull('reorder_level')
                        ->where('quantity', '<=', $defaultThreshold);
                });
            });
    }

    public function index()
    {
        $lowStockThreshold = $this->getIntSetting('low_stock_threshold', 5);
        $overdueDays = $this->getIntSetting('assignment_overdue_days', 7);
        $assignmentTrendStart = now()->subDays(6)->startOfDay();

        $statusCounts = Item::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $assignmentTrend = Assignment::query()
            ->selectRaw('DATE(assigned_at) as day, COALESCE(SUM(quantity), 0) as total')
            ->whereNotNull('assigned_at')
            ->where('assigned_at', '>=', $assignmentTrendStart)
            ->groupBy('day')
            ->orderBy('day')
            ->pluck('total', 'day');

        $assignmentTrend = collect(range(0, 6))->map(function (int $offset) use ($assignmentTrendStart, $assignmentTrend) {
            $date = $assignmentTrendStart->copy()->addDays($offset);
            $key = $date->toDateString();

            return [
                'label' => $date->format('D'),
                'date' => $key,
                'value' => (int) ($assignmentTrend[$key] ?? 0),
            ];
        })->values();

        return response()->json([
            'total_assets' => Item::count(),
            'available' => Item::where('status', Item::STATUS_AVAILABLE)
                ->where('quantity', '>', 0)
                ->count(),
            'assigned' => (int) Assignment::whereNull('returned_at')->sum('quantity'),
            'maintenance' => (int) ($statusCounts[Item::STATUS_MAINTENANCE] ?? 0),
            'low_stock' => $this->lowStockQuery($lowStockThreshold)->count(),
            'overdue' => Assignment::whereNotNull('assigned_at')
                ->whereNull('returned_at')
                ->where('assigned_at', '<', now()->subDays($overdueDays))
                ->count(),
            'notifications_count' => Auth::id()
                ? SystemNotification::where('user_id', Auth::id())->whereNull('read_at')->count()
                : 0,
            'recent_assignments' => Assignment::with(['item', 'user', 'assignedDepartment'])
                ->latest('assigned_at')
                ->limit(5)
                ->get(),
            'recent_items' => Item::with(['category', 'supplier'])
                ->latest()
                ->limit(5)
                ->get(),
            'charts' => [
                'asset_status' => [
                    ['label' => 'Available', 'value' => (int) ($statusCounts[Item::STATUS_AVAILABLE] ?? 0), 'color' => '#10b981'],
                    ['label' => 'Maintenance', 'value' => (int) ($statusCounts[Item::STATUS_MAINTENANCE] ?? 0), 'color' => '#f43f5e'],
                    ['label' => 'Lost', 'value' => (int) ($statusCounts[Item::STATUS_LOST] ?? 0), 'color' => '#f97316'],
                    ['label' => 'Retired', 'value' => (int) ($statusCounts[Item::STATUS_RETIRED] ?? 0), 'color' => '#64748b'],
                ],
                'assignment_trend' => $assignmentTrend,
            ],
            'refreshed_at' => now()->toIso8601String(),
        ]);
    }
}
