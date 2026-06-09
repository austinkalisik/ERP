<?php

namespace App\Http\Controllers\HRMS;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\HRMS\Attendance;
use App\Models\HRMS\Employee;
use App\Models\HRMS\Shift;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    // ══════════════════════════════════════════════════════════════════════════
    // GET — all attendance for an employee by biometric_id
    // ══════════════════════════════════════════════════════════════════════════

    public function index($biometric_id)
    {
        $employee = Employee::where('biometric_id', $biometric_id)->firstOrFail();

        return Attendance::with('shift')
            ->where('employee_id', $employee->id)
            ->orderBy('date', 'desc')
            ->get()
            ->map(fn($a) => $this->formatAttendance($a));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STORE — add/update attendance
    // ══════════════════════════════════════════════════════════════════════════

    public function store(Request $request, $biometric_id)
    {
        $request->merge([
            'am_time_in'  => $request->am_time_in  ?: null,
            'am_time_out' => $request->am_time_out ?: null,
            'pm_time_in'  => $request->pm_time_in  ?: null,
            'pm_time_out' => $request->pm_time_out ?: null,
        ]);

        $employee = Employee::with('shift')
            ->where('biometric_id', $biometric_id)
            ->firstOrFail();

        $validated = $request->validate([
            'date'        => 'required|date',
            'shift_id'    => 'nullable|exists:shifts,id',
            'am_time_in'  => 'nullable|date_format:H:i',
            'am_time_out' => 'nullable|date_format:H:i',
            'pm_time_in'  => 'nullable|date_format:H:i',
            'pm_time_out' => 'nullable|date_format:H:i',
            'status'      => 'nullable|in:Present,Late,Absent,On Leave,Holiday,Public Holiday',
        ]);

        // ── Resolve shift ────────────────────────────────────────────────────
        $shiftId = $validated['shift_id'] ?? $employee->shift_id ?? null;
        $shift   = $shiftId ? Shift::find($shiftId) : $employee->shift;

        // ── Auto-calculate status from punch times ────────────────────────────
        // Rule: AM In + PM Out must both be present to count as Present/Late.
        // Missing AM Out or PM In is forgiven (employee forgot to punch).
        // If only AM In OR only PM Out → Absent (incomplete record).
        if (!empty($validated['status']) && !in_array($validated['status'], ['Present', 'Late'])) {
            $status = $validated['status'];
        } else {
            $amIn   = $validated['am_time_in']  ?? null;
            $pmOut  = $validated['pm_time_out'] ?? null;

            // Need at least AM In + PM Out to confirm a full day
            if ($amIn && $pmOut) {
                $status = 'Present';

                if ($shift) {
                    $shiftStart = Carbon::createFromTimeString($shift->start_time);
                    $timeIn     = Carbon::createFromTimeString($amIn);

                    if ($shiftStart->hour >= 12 && $timeIn->hour < 12) {
                        $timeIn->addDay();
                    }

                    $status = $timeIn->gt($shiftStart->copy()->addMinutes(15)) ? 'Late' : 'Present';
                }
            } else {
                // Incomplete punch — treat as Absent
                $status = 'Absent';
            }
        }

        $attendance = Attendance::updateOrCreate(
            [
                'employee_id' => $employee->id,
                'date'        => $validated['date'],
            ],
            [
                'shift_id'    => $shiftId,
                'shift_type'  => $shift?->shift_name,
                'am_time_in'  => $this->normalizeTime($validated['am_time_in']  ?? null),
                'am_time_out' => $this->normalizeTime($validated['am_time_out'] ?? null),
                'pm_time_in'  => $this->normalizeTime($validated['pm_time_in']  ?? null),
                'pm_time_out' => $this->normalizeTime($validated['pm_time_out'] ?? null),
                'status'      => $status,
            ]
        );

        return response()->json([
            'message'    => 'Attendance saved',
            'status'     => $status,
            'attendance' => $this->formatAttendance($attendance->load('shift')),
        ], 201);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MARK ABSENT
    // ══════════════════════════════════════════════════════════════════════════

    public function markAbsent(Request $request, $biometric_id)
    {
        $employee = Employee::where('biometric_id', $biometric_id)->firstOrFail();

        $validated = $request->validate([
            'date'     => 'required|date',
            'shift_id' => 'nullable|exists:shifts,id',
        ]);

        $shiftId = $validated['shift_id'] ?? $employee->shift_id ?? null;
        $shift   = $shiftId ? Shift::find($shiftId) : null;

        Attendance::updateOrCreate(
            [
                'employee_id' => $employee->id,
                'date'        => $validated['date'],
            ],
            [
                'shift_id'    => $shiftId,
                'shift_type'  => $shift?->shift_name,
                'am_time_in'  => null,
                'am_time_out' => null,
                'pm_time_in'  => null,
                'pm_time_out' => null,
                'status'      => 'Absent',
            ]
        );

        return response()->json(['message' => 'Employee marked absent'], 201);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MARK PUBLIC HOLIDAY — paid full day, no punch times needed
    // ══════════════════════════════════════════════════════════════════════════

    public function markHoliday(Request $request, $biometric_id)
    {
        $employee = Employee::where('biometric_id', $biometric_id)->firstOrFail();

        $validated = $request->validate([
            'date'     => 'required|date',
            'shift_id' => 'nullable|exists:shifts,id',
        ]);

        $shiftId = $validated['shift_id'] ?? $employee->shift_id ?? null;
        $shift   = $shiftId ? Shift::find($shiftId) : null;

        Attendance::updateOrCreate(
            [
                'employee_id' => $employee->id,
                'date'        => $validated['date'],
            ],
            [
                'shift_id'    => $shiftId,
                'shift_type'  => $shift?->shift_name,
                'am_time_in'  => null,
                'am_time_out' => null,
                'pm_time_in'  => null,
                'pm_time_out' => null,
                'status'      => 'Public Holiday',
            ]
        );

        return response()->json(['message' => 'Employee marked as Public Holiday — full day paid'], 201);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // UPDATE — manual admin override
    // ══════════════════════════════════════════════════════════════════════════

    public function update(Request $request, $id)
    {
        $request->merge([
            'am_time_in'  => $request->am_time_in  ?: null,
            'am_time_out' => $request->am_time_out ?: null,
            'pm_time_in'  => $request->pm_time_in  ?: null,
            'pm_time_out' => $request->pm_time_out ?: null,
        ]);

        $attendance = Attendance::with('employee.shift')->findOrFail($id);

        $validated = $request->validate([
            'shift_id'    => 'nullable|exists:shifts,id',
            'am_time_in'  => 'nullable|date_format:H:i',
            'am_time_out' => 'nullable|date_format:H:i',
            'pm_time_in'  => 'nullable|date_format:H:i',
            'pm_time_out' => 'nullable|date_format:H:i',
            'status'      => 'nullable|in:Present,Late,Absent,On Leave,Holiday,Public Holiday',
        ]);

        $shiftId = $validated['shift_id']
            ?? $attendance->shift_id
            ?? $attendance->employee?->shift_id
            ?? null;
        $shift = $shiftId ? Shift::find($shiftId) : $attendance->employee?->shift;

        if (!empty($validated['status']) && !in_array($validated['status'], ['Present', 'Late'])) {
            $status = $validated['status'];
        } else {
            $amIn  = $validated['am_time_in']  ?? null;
            $pmOut = $validated['pm_time_out'] ?? null;

            if ($amIn && $pmOut) {
                $status = 'Present';

                if ($shift) {
                    $shiftStart = Carbon::createFromTimeString($shift->start_time);
                    $timeIn     = Carbon::createFromTimeString($amIn);

                    if ($shiftStart->hour >= 12 && $timeIn->hour < 12) {
                        $timeIn->addDay();
                    }

                    $status = $timeIn->gt($shiftStart->copy()->addMinutes(15)) ? 'Late' : 'Present';
                }
            } else {
                $status = 'Absent';
            }
        }

        $attendance->update([
            'shift_id'    => $shiftId,
            'shift_type'  => $shift?->shift_name,
            'am_time_in'  => $this->normalizeTime($validated['am_time_in']  ?? null),
            'am_time_out' => $this->normalizeTime($validated['am_time_out'] ?? null),
            'pm_time_in'  => $this->normalizeTime($validated['pm_time_in']  ?? null),
            'pm_time_out' => $this->normalizeTime($validated['pm_time_out'] ?? null),
            'status'      => $status,
        ]);

        return response()->json([
            'message'    => 'Attendance updated',
            'status'     => $status,
            'attendance' => $this->formatAttendance($attendance->fresh()->load('shift')),
        ]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ══════════════════════════════════════════════════════════════════════════

    private function normalizeTime($time): ?string
    {
        if (!$time) return null;
        return substr_count($time, ':') === 1 ? $time . ':00' : $time;
    }

    private function formatAttendance(Attendance $a): array
    {
        // Public Holiday = 12hrs paid (same as Present), no punch times needed
        $paidStatuses = ['present', 'late', 'public holiday'];
        $hours        = in_array(strtolower($a->status ?? ''), $paidStatuses) ? 12 : 0;

        return [
            'id'          => $a->id,
            'employee_id' => $a->employee_id,
            'date'        => $a->date instanceof \Carbon\Carbon
                             ? $a->date->format('Y-m-d') : $a->date,
            'shift_id'    => $a->shift_id,
            'shift_type'  => $a->shift_type,
            'shift_name'  => $a->shift?->shift_name,
            'am_time_in'  => $a->am_time_in,
            'am_time_out' => $a->am_time_out,
            'pm_time_in'  => $a->pm_time_in,
            'pm_time_out' => $a->pm_time_out,
            'total_hours' => $hours,
            'status'      => $a->status,
        ];
    }
}