<?php

namespace App\Http\Controllers\MOMS;

use App\Http\Controllers\Controller;
use App\Models\MOMS\Assignment;
use App\Models\MOMS\AssignmentTimeEntry;
use App\Models\MOMS\Operator;
use App\Notifications\MOMS\AssignmentNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AssignmentController extends Controller
{
    private function getMyOperator(): ?Operator
    {
        if (Auth::user()->role === 'moms_operator') {
            return Operator::where('user_id', Auth::id())->first();
        }
        return null;
    }

    private function formatAssignment(Assignment $assignment): Assignment
    {
        $assignment->machine_id_display = $assignment->machine?->machine_id ?? 'N/A';
        $assignment->operator_name      = $assignment->operator?->user?->name ?? 'Unknown';
        $assignment->assigned_by_name   = $assignment->assignedBy?->name ?? 'System';
        $assignment->time_entries_count = $assignment->timeEntries->count();
        $assignment->total_entry_hours  = $assignment->totalTimeEntryHours();

        if ($assignment->end_time) {
            $assignment->duration_hours = $assignment->calculateDuration();
        }

        return $assignment;
    }

    // ── Index ──────────────────────────────────────────────────────────────
    public function index()
    {
        $myOperator = $this->getMyOperator();

        $query = Assignment::with([
            // Only select the columns we actually display in the table
            'machine:id,machine_id',
            'operator:id,user_id',
            'operator.user:id,name',
            'assignedBy:id,name',
            'timeEntries:id,assignment_id,duration_hours',
        ])
        ->select([
            'id', 'machine_id', 'operator_id', 'assigned_by',
            'job_site', 'shift_type', 'status',
            'start_time', 'end_time', 'duration_hours',
            'reading_start', 'reading_end', 'task_description',
        ])
        ->orderBy('start_time', 'desc');

        if ($myOperator) {
            $query->where('operator_id', $myOperator->id);
        }

        $assignments = $query->get()->map(fn ($a) => $this->formatAssignment($a));

        return response()->json($assignments);
    }

    // ── Store ──────────────────────────────────────────────────────────────
    public function store(Request $request)
    {
        $validated = $request->validate([
            'machine_id'       => 'required|exists:machines,id',
            'operator_id'      => 'required|exists:operators,id',
            'job_site'         => 'nullable|string|max:255',
            'reading_start'    => 'nullable|numeric|min:0',
            'reading_end'      => 'nullable|numeric|min:0|gte:reading_start',
            'status'           => 'required|in:Pending,Active,Completed,Cancelled',
            'shift_type'       => 'required|in:Day,Night,Full Day',
            'start_time'       => 'required|date',
            'end_time'         => 'nullable|date|after_or_equal:start_time',
            'task_description' => 'nullable|string',

            'time_entries'                 => 'nullable|array',
            'time_entries.*.time_category' => 'nullable|string|max:100',
            'time_entries.*.activity'      => 'nullable|string|max:255',
            'time_entries.*.start_time'    => 'required_with:time_entries|date',
            'time_entries.*.end_time'      => 'nullable|date|after_or_equal:time_entries.*.start_time',
        ]);

        $validated['assigned_by'] = Auth::id();

        foreach (['end_time', 'reading_start', 'reading_end'] as $field) {
            if (isset($validated[$field]) && $validated[$field] === '') {
                $validated[$field] = null;
            }
        }

        if (!empty($validated['end_time'])) {
            $start = new \DateTime($validated['start_time']);
            $end   = new \DateTime($validated['end_time']);
            $diff  = $start->diff($end);
            $validated['duration_hours'] = ($diff->days * 24) + $diff->h + round($diff->i / 60, 2);
        }

        $timeEntries = $validated['time_entries'] ?? [];
        unset($validated['time_entries']);

        /** @var Assignment $assignment */
        $assignment = null;

        DB::transaction(function () use (&$assignment, $validated, $timeEntries) {
            $assignment = Assignment::create($validated);

            foreach ($timeEntries as $entry) {
                $assignment->timeEntries()->create([
                    'time_category' => $entry['time_category'] ?? null,
                    'activity'      => $entry['activity']      ?? null,
                    'start_time'    => $entry['start_time'],
                    'end_time'      => !empty($entry['end_time']) ? $entry['end_time'] : null,
                ]);
            }
        });

        /** @var Assignment $assignment */
        $assignment->load(['machine', 'operator.user', 'assignedBy', 'timeEntries']);
        $this->formatAssignment($assignment);

        $operatorUser = $assignment->operator?->user;
        if ($operatorUser && $operatorUser->id !== Auth::id()) {
            $operatorUser->notify(new AssignmentNotification($assignment));
        }

        return response()->json([
            'message' => 'Assignment created successfully',
            'data'    => $assignment,
        ], 201);
    }

    // ── Show ───────────────────────────────────────────────────────────────
    public function show($id)
    {
        $query = Assignment::with(['machine', 'operator.user', 'assignedBy', 'timeEntries']);

        $myOperator = $this->getMyOperator();
        if ($myOperator) {
            $query->where('operator_id', $myOperator->id);
        }

        $assignment = $query->findOrFail($id);
        $this->formatAssignment($assignment);

        return response()->json($assignment);
    }

    // ── Update ─────────────────────────────────────────────────────────────
    public function update(Request $request, $id)
    {
        $assignment = Assignment::findOrFail($id);

        $validated = $request->validate([
            'machine_id'       => 'sometimes|exists:machines,id',
            'operator_id'      => 'sometimes|exists:operators,id',
            'job_site'         => 'nullable|string|max:255',
            'reading_start'    => 'nullable|numeric|min:0',
            'reading_end'      => 'nullable|numeric|min:0|gte:reading_start',
            'status'           => 'sometimes|in:Pending,Active,Completed,Cancelled',
            'shift_type'       => 'sometimes|in:Day,Night,Full Day',
            'start_time'       => 'sometimes|date',
            'end_time'         => 'nullable|date|after_or_equal:start_time',
            'task_description' => 'nullable|string',

            'time_entries'                 => 'nullable|array',
            'time_entries.*.time_category' => 'nullable|string|max:100',
            'time_entries.*.activity'      => 'nullable|string|max:255',
            'time_entries.*.start_time'    => 'required_with:time_entries|date',
            'time_entries.*.end_time'      => 'nullable|date|after_or_equal:time_entries.*.start_time',
        ]);

        foreach (['end_time', 'reading_start', 'reading_end'] as $field) {
            if (isset($validated[$field]) && $validated[$field] === '') {
                $validated[$field] = null;
            }
        }

        if (isset($validated['start_time']) || isset($validated['end_time'])) {
            $start = new \DateTime($validated['start_time'] ?? $assignment->start_time);
            $end   = !empty($validated['end_time']) ? new \DateTime($validated['end_time']) : null;
            if ($end) {
                $diff = $start->diff($end);
                $validated['duration_hours'] = ($diff->days * 24) + $diff->h + round($diff->i / 60, 2);
            }
        }

        $timeEntries = $validated['time_entries'] ?? null;
        unset($validated['time_entries']);

        DB::transaction(function () use ($assignment, $validated, $timeEntries) {
            $assignment->update($validated);

            if ($timeEntries !== null) {
                $assignment->timeEntries()->delete();
                foreach ($timeEntries as $entry) {
                    $assignment->timeEntries()->create([
                        'time_category' => $entry['time_category'] ?? null,
                        'activity'      => $entry['activity']      ?? null,
                        'start_time'    => $entry['start_time'],
                        'end_time'      => !empty($entry['end_time']) ? $entry['end_time'] : null,
                    ]);
                }
            }
        });

        $assignment->load(['machine', 'operator.user', 'assignedBy', 'timeEntries']);
        $this->formatAssignment($assignment);

        return response()->json([
            'message' => 'Assignment updated successfully',
            'data'    => $assignment,
        ]);
    }

    // ── Destroy ────────────────────────────────────────────────────────────
    public function destroy($id)
    {
        $assignment = Assignment::findOrFail($id);
        $assignment->delete();

        return response()->json(['message' => 'Assignment deleted successfully']);
    }

    // ── Complete ───────────────────────────────────────────────────────────
    public function complete($id)
    {
        $assignment = Assignment::findOrFail($id);

        $assignment->update([
            'status'   => 'Completed',
            'end_time' => now(),
        ]);

        $assignment->duration_hours = $assignment->calculateDuration();
        $assignment->save();

        return response()->json([
            'message' => 'Assignment completed successfully',
            'data'    => $assignment,
        ]);
    }
}