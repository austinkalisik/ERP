<?php

namespace App\Http\Controllers\MOMS;

use App\Http\Controllers\Controller;
use App\Models\MOMS\ShiftOperation;
use App\Models\MOMS\Assignment;
use App\Models\MOMS\Machine;
use App\Models\MOMS\Operator;
use App\Notifications\MOMS\OperationApprovedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OperationsController extends Controller
{
    const DEPARTMENTS = [
        'Mine Operations',
        'Civil & Infrastructure',
        'Plant & Equipment',
        'Drill & Blast',
        'Logistics & Transport',
        'Health, Safety & Environment',
        'Maintenance',
        'Administration',
    ];

    public function index(Request $request)
    {
        $query = ShiftOperation::with(['operator.user', 'machine', 'assignment'])
            ->orderBy('shift_start_time', 'desc');

        if ($request->filled('status'))      $query->where('status', $request->status);
        if ($request->filled('machine_id'))  $query->where('machine_id', $request->machine_id);
        if ($request->filled('operator_id')) $query->where('operator_id', $request->operator_id);
        if ($request->filled('department'))  $query->where('department', $request->department);

        $operations = $query->paginate($request->get('per_page', 15));

        return response()->json($operations);
    }

    // ✅ NEW: Recent operations for MOMS dashboard
    public function recent(Request $request)
    {
        $limit = $request->get('limit', 5);

        $operations = ShiftOperation::with(['operator.user', 'machine'])
            ->orderBy('shift_start_time', 'desc')
            ->limit($limit)
            ->get()
            ->map(fn($op) => $this->formatOperation($op));

        return response()->json(['operations' => $operations]);
    }

    public function daily(Request $request)
    {
        $date = $request->get('date', now()->toDateString());

        $operations = ShiftOperation::with(['operator.user', 'machine', 'assignment'])
            ->whereDate('shift_start_time', $date)
            ->orderBy('shift_start_time', 'asc')
            ->get()
            ->map(fn($op) => $this->formatOperation($op));

        return response()->json(['operations' => $operations]);
    }

    public function stats()
    {
        return response()->json([
            'totalShifts'     => ShiftOperation::count(),
            'inProgress'      => ShiftOperation::where('status', 'In Progress')->count(),
            'pendingApproval' => ShiftOperation::where('status', 'Pending Approval')->count(),
            'approved'        => ShiftOperation::where('status', 'Approved')->count(),
        ]);
    }

    public function departments()
    {
        return response()->json(['departments' => self::DEPARTMENTS]);
    }

    public function show($id)
    {
        $op = ShiftOperation::with(['operator.user', 'machine', 'assignment'])->findOrFail($id);
        return response()->json(['operation' => $this->formatOperation($op)]);
    }

    public function startShift(Request $request)
    {
        $validated = $request->validate([
            'operator_id'            => 'required|exists:operators,id',
            'machine_id'             => 'required|exists:machines,id',
            'assignment_id'          => 'nullable|exists:assignments,id',
            'starting_hour_meter'    => 'required|numeric|min:0',
            'starting_odometer'      => 'nullable|numeric|min:0',
            'fuel_level_observed'    => 'required|in:Full,3/4,1/2,1/4,Empty',
            'estimated_fuel_in_tank' => 'nullable|numeric|min:0',
            'engine_condition'       => 'nullable|in:Pass,Fail,N/A',
            'tires_condition'        => 'nullable|in:Pass,Fail,N/A',
            'lights_signals'         => 'nullable|in:Pass,Fail,N/A',
            'brakes_responsive'      => 'nullable|in:Pass,Fail,N/A',
            'fluid_levels'           => 'nullable|in:Pass,Fail,N/A',
            'safety_equipment'       => 'nullable|in:Pass,Fail,N/A',
            'mirrors_windows'        => 'nullable|in:Pass,Fail,N/A',
            'seatbelt_functioning'   => 'nullable|in:Pass,Fail,N/A',
            'checklist_notes'        => 'nullable|string|max:2000',
            'operator_remarks'       => 'nullable|string|max:2000',
            'location'               => 'nullable|string|max:255',
            'department'             => 'nullable|string|max:255',
        ]);

        $activeShift = ShiftOperation::where('machine_id', $validated['machine_id'])
            ->where('status', 'In Progress')
            ->first();

        if ($activeShift) {
            return response()->json([
                'message'         => 'This machine already has an active shift in progress.',
                'active_shift_id' => $activeShift->id,
            ], 422);
        }

        $operation = ShiftOperation::create(array_merge($validated, [
            'shift_start_time' => now(),
            'status'           => 'In Progress',
        ]));

        return response()->json([
            'message'   => 'Shift started successfully.',
            'operation' => $this->formatOperation($operation->load(['operator.user', 'machine'])),
        ], 201);
    }

    public function endShift(Request $request, $id)
    {
        $operation = ShiftOperation::findOrFail($id);

        if ($operation->status !== 'In Progress') {
            return response()->json(['message' => 'This shift is not currently in progress.'], 422);
        }

        $validated = $request->validate([
            'ending_hour_meter'   => 'required|numeric|min:0',
            'ending_odometer'     => 'nullable|numeric|min:0',
            'fuel_consumed'       => 'nullable|numeric|min:0',
            'ready_hours'         => 'nullable|numeric|min:0',
            'standby_hours'       => 'nullable|numeric|min:0',
            'breakdown_hours'     => 'nullable|numeric|min:0',
            'pm_hours'            => 'nullable|numeric|min:0',
            'delay_reason'        => 'nullable|string|max:1000',
            'production_quantity' => 'nullable|numeric|min:0',
            'production_unit'     => 'nullable|string|max:50',
            'tons'                => 'nullable|numeric|min:0',
            'trips'               => 'nullable|integer|min:0',
            'location'            => 'nullable|string|max:255',
            'department'          => 'nullable|string|max:255',
            'end_shift_notes'     => 'nullable|string|max:2000',
        ]);

        if ($validated['ending_hour_meter'] < $operation->starting_hour_meter) {
            return response()->json([
                'message' => 'Ending hour meter (' . $validated['ending_hour_meter'] . ') cannot be less than starting (' . $operation->starting_hour_meter . ').',
            ], 422);
        }

        $operation->update(array_merge($validated, [
            'work_done'      => $validated['production_quantity'] ?? null,
            'shift_end_time' => now(),
            'status'         => 'Pending Approval',
        ]));

        return response()->json([
            'message'   => 'Shift ended. Pending supervisor approval.',
            'operation' => $this->formatOperation($operation->fresh()->load(['operator.user', 'machine'])),
        ]);
    }

    public function approve($id)
    {
        $operation = ShiftOperation::with(['operator.user', 'machine'])->findOrFail($id);

        if ($operation->status !== 'Pending Approval') {
            return response()->json(['message' => 'Only shifts with Pending Approval status can be approved.'], 422);
        }

        $operation->update(['status' => 'Approved']);

        $operatorUser = $operation->operator->user ?? null;
        if ($operatorUser) {
            $operatorUser->notify(new OperationApprovedNotification($operation));
        }

        return response()->json([
            'message'   => 'Shift report approved.',
            'operation' => $this->formatOperation($operation->fresh()->load(['operator.user', 'machine'])),
        ]);
    }

    public function update(Request $request, $id)
    {
        $operation = ShiftOperation::findOrFail($id);

        $validated = $request->validate([
            'ending_hour_meter'   => 'nullable|numeric|min:0',
            'ending_odometer'     => 'nullable|numeric|min:0',
            'fuel_consumed'       => 'nullable|numeric|min:0',
            'ready_hours'         => 'nullable|numeric|min:0',
            'standby_hours'       => 'nullable|numeric|min:0',
            'breakdown_hours'     => 'nullable|numeric|min:0',
            'pm_hours'            => 'nullable|numeric|min:0',
            'delay_reason'        => 'nullable|string|max:1000',
            'production_quantity' => 'nullable|numeric|min:0',
            'production_unit'     => 'nullable|string|max:50',
            'tons'                => 'nullable|numeric|min:0',
            'trips'               => 'nullable|integer|min:0',
            'location'            => 'nullable|string|max:255',
            'department'          => 'nullable|string|max:255',
            'end_shift_notes'     => 'nullable|string|max:2000',
            'status'              => 'nullable|in:In Progress,Completed,Pending Approval,Approved',
        ]);

        $operation->update($validated);

        return response()->json([
            'message'   => 'Operation updated.',
            'operation' => $this->formatOperation($operation->fresh()->load(['operator.user', 'machine'])),
        ]);
    }

    public function destroy($id)
    {
        ShiftOperation::findOrFail($id)->delete();
        return response()->json(['message' => 'Operation deleted.']);
    }

    private function formatOperation(ShiftOperation $op): array
    {
        $opHours  = ($op->ending_hour_meter && $op->starting_hour_meter)
            ? round($op->ending_hour_meter - $op->starting_hour_meter, 2)
            : null;
        $hAvail   = round(($op->ready_hours ?? 0) + ($op->standby_hours ?? 0), 2);
        $hUnavail = round(($op->breakdown_hours ?? 0) + ($op->pm_hours ?? 0), 2);

        return [
            'id'                     => $op->id,
            'assignment_id'          => $op->assignment_id,
            'shift_start_time'       => $op->shift_start_time,
            'shift_end_time'         => $op->shift_end_time,
            'machine_id'             => $op->machine_id,
            'machine_asset_no'       => $op->machine->machine_id   ?? null,
            'machine_description'    => $op->machine->model ?? $op->machine->category ?? null,
            'machine'                => $op->machine->machine_id   ?? "Machine #{$op->machine_id}",
            'operator_id'            => $op->operator_id,
            'operator'               => $op->operator->user->name  ?? "Operator #{$op->operator_id}",
            'starting_hour_meter'    => $op->starting_hour_meter,
            'starting_odometer'      => $op->starting_odometer,
            'fuel_level_observed'    => $op->fuel_level_observed,
            'estimated_fuel_in_tank' => $op->estimated_fuel_in_tank,
            'engine_condition'       => $op->engine_condition,
            'tires_condition'        => $op->tires_condition,
            'lights_signals'         => $op->lights_signals,
            'brakes_responsive'      => $op->brakes_responsive,
            'fluid_levels'           => $op->fluid_levels,
            'safety_equipment'       => $op->safety_equipment,
            'mirrors_windows'        => $op->mirrors_windows,
            'seatbelt_functioning'   => $op->seatbelt_functioning,
            'checklist_notes'        => $op->checklist_notes,
            'operator_remarks'       => $op->operator_remarks,
            'ending_hour_meter'      => $op->ending_hour_meter,
            'ending_odometer'        => $op->ending_odometer,
            'fuel_consumed'          => $op->fuel_consumed,
            'operating_hours'        => $opHours,
            'ready_hours'            => $op->ready_hours,
            'standby_hours'          => $op->standby_hours,
            'breakdown_hours'        => $op->breakdown_hours,
            'pm_hours'               => $op->pm_hours,
            'hours_available'        => $hAvail,
            'hours_unavailable'      => $hUnavail,
            'delay_reason'           => $op->delay_reason,
            'production_quantity'    => $op->production_quantity,
            'production_unit'        => $op->production_unit,
            'tons'                   => $op->tons,
            'trips'                  => $op->trips,
            'location'               => $op->location,
            'department'             => $op->department,
            'end_shift_notes'        => $op->end_shift_notes,
            'status'                 => $op->status,
        ];
    }
}