<?php

namespace App\Http\Controllers\MOMS;

use App\Http\Controllers\Controller;
use App\Models\MOMS\Breakdown;
use App\Models\User;
use App\Notifications\MOMS\BreakdownNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class BreakdownController extends Controller
{
    /**
     * Display a listing of breakdowns
     */
    public function index()
    {
        $breakdowns = Breakdown::with(['machine', 'reportedBy'])
            ->orderBy('incident_time', 'desc')
            ->get()
            ->map(function ($breakdown) {
                return [
                    'id'               => $breakdown->id,
                    'machine_id'       => $breakdown->machine ? $breakdown->machine->machine_id : 'N/A',
                    'breakdown_type'   => $breakdown->breakdown_type,
                    'severity'         => $breakdown->severity,
                    'incident_time'    => $breakdown->incident_time->format('Y-m-d H:i:s'),
                    'description'      => $breakdown->description,
                    'diagnostics'      => $breakdown->diagnostics,
                    'downtime_minutes' => $breakdown->downtime_minutes,
                    'repair_cost'      => $breakdown->repair_cost,
                    'status'           => $breakdown->status,
                    'reported_by'      => $breakdown->reportedBy ? $breakdown->reportedBy->name : 'System',
                    'resolved_at'      => $breakdown->resolved_at ? $breakdown->resolved_at->format('Y-m-d H:i:s') : null,
                ];
            });

        return response()->json($breakdowns);
    }

    /**
     * Store a newly created breakdown
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'machine_id'       => 'required|exists:machines,id',
            'breakdown_type'   => 'required|string|max:255',
            'severity'         => 'required|in:Minor,Moderate,Critical',
            'incident_time'    => 'required|date',
            'description'      => 'required|string',
            'diagnostics'      => 'nullable|string',
            'downtime_minutes' => 'nullable|integer|min:0',
            'repair_cost'      => 'nullable|numeric|min:0',
            'status'           => 'required|in:Reported,Under Repair,Resolved,Pending Parts',
        ]);

        if (isset($validated['incident_time'])) {
            $validated['incident_time'] = Carbon::parse($validated['incident_time'], config('app.timezone'))->format('Y-m-d H:i:s');
        }

        $validated['reported_by'] = Auth::id();

        $breakdown = Breakdown::create($validated);
        $breakdown->load(['machine', 'reportedBy']);

        // ── Notify all MOMS users instantly ───────────────────────────────
        $momsUsers = User::whereIn('role', [
            'system_admin',
            'moms_manager',
            'moms_supervisor',
            'moms_operator',
        ])->get();

        foreach ($momsUsers as $user) {
            // Don't notify the person who reported it
            if ($user->id !== Auth::id()) {
                $user->notify(new BreakdownNotification($breakdown));
            }
        }

        return response()->json([
            'message' => 'Breakdown reported successfully',
            'data'    => [
                'id'             => $breakdown->id,
                'machine_id'     => $breakdown->machine ? $breakdown->machine->machine_id : 'N/A',
                'breakdown_type' => $breakdown->breakdown_type,
                'severity'       => $breakdown->severity,
                'incident_time'  => $breakdown->incident_time->format('Y-m-d H:i:s'),
                'status'         => $breakdown->status,
                'reported_by'    => $breakdown->reportedBy ? $breakdown->reportedBy->name : 'System',
            ],
        ], 201);
    }

    /**
     * Display the specified breakdown
     */
    public function show($id)
    {
        $breakdown = Breakdown::with(['machine', 'reportedBy'])->findOrFail($id);

        return response()->json([
            'id'               => $breakdown->id,
            'machine_id'       => $breakdown->machine ? $breakdown->machine->machine_id : 'N/A',
            'breakdown_type'   => $breakdown->breakdown_type,
            'severity'         => $breakdown->severity,
            'incident_time'    => $breakdown->incident_time->format('Y-m-d H:i:s'),
            'description'      => $breakdown->description,
            'diagnostics'      => $breakdown->diagnostics,
            'downtime_minutes' => $breakdown->downtime_minutes,
            'repair_cost'      => $breakdown->repair_cost,
            'status'           => $breakdown->status,
            'reported_by'      => $breakdown->reportedBy ? $breakdown->reportedBy->name : 'System',
            'resolved_at'      => $breakdown->resolved_at ? $breakdown->resolved_at->format('Y-m-d H:i:s') : null,
            'created_at'       => $breakdown->created_at->format('Y-m-d H:i:s'),
            'updated_at'       => $breakdown->updated_at->format('Y-m-d H:i:s'),
        ]);
    }

    /**
     * Update the specified breakdown
     */
    public function update(Request $request, $id)
    {
        $breakdown = Breakdown::findOrFail($id);

        $validated = $request->validate([
            'breakdown_type'   => 'sometimes|string|max:255',
            'severity'         => 'sometimes|in:Minor,Moderate,Critical',
            'incident_time'    => 'sometimes|date',
            'description'      => 'sometimes|string',
            'diagnostics'      => 'nullable|string',
            'downtime_minutes' => 'nullable|integer|min:0',
            'repair_cost'      => 'nullable|numeric|min:0',
            'status'           => 'sometimes|in:Reported,Under Repair,Resolved,Pending Parts',
        ]);

        if (isset($validated['incident_time'])) {
            $validated['incident_time'] = Carbon::parse($validated['incident_time'], config('app.timezone'))->format('Y-m-d H:i:s');
        }

        if (isset($validated['status']) && $validated['status'] === 'Resolved' && !$breakdown->resolved_at) {
            $validated['resolved_at'] = now();
        }

        $breakdown->update($validated);
        $breakdown->load(['machine', 'reportedBy']);

        return response()->json([
            'message' => 'Breakdown updated successfully',
            'data'    => [
                'id'             => $breakdown->id,
                'machine_id'     => $breakdown->machine ? $breakdown->machine->machine_id : 'N/A',
                'breakdown_type' => $breakdown->breakdown_type,
                'severity'       => $breakdown->severity,
                'status'         => $breakdown->status,
            ],
        ]);
    }

    /**
     * Remove the specified breakdown
     */
    public function destroy($id)
    {
        $breakdown = Breakdown::findOrFail($id);
        $breakdown->delete();

        return response()->json(['message' => 'Breakdown deleted successfully']);
    }

    /**
     * Get breakdown statistics
     */
    public function stats()
    {
        $totalBreakdowns = Breakdown::count();

        $thisMonth = Breakdown::whereMonth('incident_time', now()->month)
            ->whereYear('incident_time', now()->year)
            ->count();

        $criticalCount = Breakdown::where('severity', 'Critical')
            ->where('status', '!=', 'Resolved')
            ->count();

        $activeBreakdowns = Breakdown::whereIn('status', ['Reported', 'Under Repair', 'Pending Parts'])
            ->count();

        $avgDowntime    = Breakdown::whereNotNull('downtime_minutes')->avg('downtime_minutes') ?? 0;
        $totalRepairCost = Breakdown::sum('repair_cost') ?? 0;

        return response()->json([
            'totalBreakdowns'  => $totalBreakdowns,
            'thisMonth'        => $thisMonth,
            'criticalCount'    => $criticalCount,
            'activeBreakdowns' => $activeBreakdowns,
            'avgDowntime'      => round($avgDowntime, 2),
            'totalRepairCost'  => round($totalRepairCost, 2),
        ]);
    }
}