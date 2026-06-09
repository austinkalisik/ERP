<?php

namespace App\Http\Controllers\MOMS;

use App\Http\Controllers\Controller;
use App\Models\MOMS\AssignmentTimeEntry;
use App\Models\MOMS\Assignment;
use App\Models\MOMS\ShiftOperation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class TimeEntryController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = AssignmentTimeEntry::with([
            // operation path (new — from TimeEntries page via StartShift)
            'operation',
            'operation.machine',
            'operation.operator',
            'operation.operator.user',
            // assignment path (old — from AssignmentView inline entries)
            'assignment',
            'assignment.machine',
            'assignment.operator',
            'assignment.operator.user',
        ])->orderBy('start_time', 'desc');

        // Operators only see their own entries
        if ($user->role === 'moms_operator') {
            $query->where(function ($q) use ($user) {
                $q->whereHas('operation.operator', fn($q2) => $q2->where('user_id', $user->id))
                  ->orWhereHas('assignment.operator', fn($q2) => $q2->where('user_id', $user->id));
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('start_time', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('start_time', '<=', $request->date_to);
        }
        if ($request->filled('time_category')) {
            $query->where('time_category', $request->time_category);
        }
        if ($request->filled('machine_id')) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('operation.machine', fn($q2) => $q2->where('machine_id', $request->machine_id))
                  ->orWhereHas('assignment.machine', fn($q2) => $q2->where('machine_id', $request->machine_id));
            });
        }

        return response()->json(
            $query->get()->map(fn($e) => $this->formatEntry($e))
        );
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            // operation_id — from TimeEntries page (StartShift flow)
            'operation_id'  => 'required_without:assignment_id|nullable|exists:shift_operations,id',
            // assignment_id — from AssignmentView inline entries (old flow)
            'assignment_id' => 'required_without:operation_id|nullable|exists:assignments,id',
            'time_category' => 'required|string',
            'activity'      => 'nullable|string',
            'start_time'    => 'required|date',
            'end_time'      => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        // Normalize datetime-local format → Y-m-d H:i:s
        $startTime = Carbon::parse($request->start_time)->format('Y-m-d H:i:s');
        $endTime   = $request->end_time
            ? Carbon::parse($request->end_time)->format('Y-m-d H:i:s')
            : null;

        // Operators can only add to their own operations/assignments
        if ($user->role === 'moms_operator') {
            if ($request->filled('operation_id')) {
                $op = ShiftOperation::whereHas('operator', fn($q) =>
                    $q->where('user_id', $user->id)
                )->find($request->operation_id);
                if (!$op) {
                    return response()->json(['message' => 'Unauthorized — not your shift.'], 403);
                }
            }
            if ($request->filled('assignment_id')) {
                $as = Assignment::whereHas('operator', fn($q) =>
                    $q->where('user_id', $user->id)
                )->find($request->assignment_id);
                if (!$as) {
                    return response()->json(['message' => 'Unauthorized — not your assignment.'], 403);
                }
            }
        }

        $entry = AssignmentTimeEntry::create([
            'operation_id'  => $request->operation_id  ?: null,
            'assignment_id' => $request->assignment_id ?: null,
            'time_category' => $request->time_category,
            'activity'      => $request->activity,
            'start_time'    => $startTime,
            'end_time'      => $endTime,
        ]);

        $entry->load([
            'operation.machine', 'operation.operator.user',
            'assignment.machine', 'assignment.operator.user',
        ]);

        return response()->json([
            'message' => 'Time entry added successfully.',
            'data'    => $this->formatEntry($entry),
        ], 201);
    }

    public function destroy($id)
    {
        AssignmentTimeEntry::findOrFail($id)->delete();
        return response()->json(['message' => 'Time entry deleted.']);
    }

    private function formatEntry(AssignmentTimeEntry $e): array
    {
        // Prefer operation (new flow), fall back to assignment (old flow)
        $machine  = $e->operation?->machine  ?? $e->assignment?->machine;
        $operator = $e->operation?->operator?->user
                 ?? $e->assignment?->operator?->user;
        $jobSite  = $e->operation?->location ?? $e->assignment?->job_site;

        return [
            'id'             => $e->id,
            'operation_id'   => $e->operation_id,
            'assignment_id'  => $e->assignment_id,
            'machine_id'     => $machine?->machine_id  ?? null,
            'operator_name'  => $operator?->name       ?? null,
            'job_site'       => $jobSite               ?? null,
            'time_category'  => $e->time_category,
            'activity'       => $e->activity,
            'start_time'     => $e->start_time,
            'end_time'       => $e->end_time,
            'duration_hours' => $e->duration_hours,
        ];
    }
}