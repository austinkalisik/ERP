<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * Get all audit logs with filtering
     */
    public function index(Request $request)
    {
        $query = AuditLog::with('user')
            ->latest();

        // Filter by module
        if ($request->has('module') && $request->module !== 'All') {
            $query->where('module', $request->module);
        }

        // Filter by action
        if ($request->has('action') && $request->action !== 'All') {
            $query->where('action', $request->action);
        }

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by date range
        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('created_at', [
                $request->start_date,
                $request->end_date . ' 23:59:59'
            ]);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('user_name', 'like', "%{$search}%");
            });
        }

        $logs = $query->paginate($request->per_page ?? 50);

        return response()->json($logs);
    }

    /**
     * Get audit log details
     */
    public function show($id)
    {
        $log = AuditLog::with('user')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $log,
        ]);
    }

    /**
     * Get audit logs for a specific model
     */
    public function getModelLogs(Request $request)
    {
        $request->validate([
            'model_type' => 'required|string',
            'model_id' => 'required|integer',
        ]);

        $logs = AuditLog::where('model_type', $request->model_type)
            ->where('model_id', $request->model_id)
            ->with('user')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }

    /**
     * Get statistics
     */
    public function statistics()
    {
        $totalLogs = AuditLog::count();
        $todayLogs = AuditLog::whereDate('created_at', today())->count();
        $weekLogs = AuditLog::whereBetween('created_at', [
            now()->startOfWeek(),
            now()->endOfWeek()
        ])->count();

        $topUsers = AuditLog::selectRaw('user_name, COUNT(*) as count')
            ->whereNotNull('user_name')
            ->whereBetween('created_at', [now()->subDays(30), now()])
            ->groupBy('user_name')
            ->orderByDesc('count')
            ->limit(5)
            ->get();

        $actionBreakdown = AuditLog::selectRaw('action, COUNT(*) as count')
            ->whereBetween('created_at', [now()->subDays(30), now()])
            ->groupBy('action')
            ->get();

        $moduleBreakdown = AuditLog::selectRaw('module, COUNT(*) as count')
            ->whereNotNull('module')
            ->whereBetween('created_at', [now()->subDays(30), now()])
            ->groupBy('module')
            ->get();

        return response()->json([
            'total_logs' => $totalLogs,
            'today_logs' => $todayLogs,
            'week_logs' => $weekLogs,
            'top_users' => $topUsers,
            'action_breakdown' => $actionBreakdown,
            'module_breakdown' => $moduleBreakdown,
        ]);
    }

    /**
     * Get recent activity
     */
    public function recentActivity(Request $request)
    {
        $limit = $request->limit ?? 20;

        $logs = AuditLog::with('user')
            ->latest()
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }
}