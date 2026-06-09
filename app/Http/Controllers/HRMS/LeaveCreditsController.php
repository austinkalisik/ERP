<?php

namespace App\Http\Controllers\HRMS;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\HRMS\LeaveCreditDetail;
use App\Models\HRMS\LeaveType;
use App\Models\HRMS\Employee;
use Illuminate\Support\Facades\DB;

class LeaveCreditsController extends Controller
{
    // ══════════════════════════════════════════════════════════════════════════
    // GET ALL — for admin overview
    // ══════════════════════════════════════════════════════════════════════════
    public function index()
    {
        $credits = LeaveCreditDetail::with(['employee', 'leaveType'])
            ->get()
            ->groupBy('employee_id')
            ->map(function ($rows) {
                $employee = $rows->first()->employee;
                return [
                    'employee_id'   => $employee->id,
                    'biometric_id'  => $employee->biometric_id,
                    'employee_name' => trim($employee->first_name . ' ' . $employee->last_name),
                    'credits'       => $rows->map(fn($r) => $this->formatCredit($r))->values(),
                ];
            })
            ->values();

        return response()->json($credits);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET BY EMPLOYEE
    // ══════════════════════════════════════════════════════════════════════════
    public function showByEmployee($biometric_id)
    {
        $employee = Employee::where('biometric_id', $biometric_id)->firstOrFail();

        $credits = LeaveCreditDetail::with('leaveType')
            ->where('employee_id', $employee->id)
            ->get()
            ->map(fn($r) => $this->formatCredit($r));

        return response()->json($credits);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STORE — called during Add Employee flow
    // Accepts array of { leave_type_id, total_days, year }
    // ══════════════════════════════════════════════════════════════════════════
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id'          => 'required|integer|exists:employees,id',
            'credits'              => 'required|array',
            'credits.*.leave_type_id' => 'required|integer|exists:leave_types,id',
            'credits.*.total_days'    => 'required|numeric|min:0',
            'credits.*.year'          => 'nullable|integer',
        ]);

        return DB::transaction(function () use ($validated) {
            $saved = [];

            foreach ($validated['credits'] as $credit) {
                $record = LeaveCreditDetail::updateOrCreate(
                    [
                        'employee_id'   => $validated['employee_id'],
                        'leave_type_id' => $credit['leave_type_id'],
                        'year'          => $credit['year'] ?? now()->year,
                    ],
                    [
                        'total_days'     => $credit['total_days'],
                        'used_days'      => 0,
                        'remaining_days' => $credit['total_days'],
                    ]
                );
                $saved[] = $this->formatCredit($record->load('leaveType'));
            }

            return response()->json([
                'message' => 'Leave credits saved successfully',
                'data'    => $saved,
            ], 201);
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // UPDATE BY EMPLOYEE — used by admin to edit credits
    // ══════════════════════════════════════════════════════════════════════════
    public function updateByEmployee(Request $request, $biometric_id)
    {
        $employee = Employee::where('biometric_id', $biometric_id)->firstOrFail();

        $validated = $request->validate([
            'credits'                 => 'required|array',
            'credits.*.id'            => 'nullable|integer|exists:leave_credit_details,id',
            'credits.*.leave_type_id' => 'required|integer|exists:leave_types,id',
            'credits.*.total_days'    => 'required|numeric|min:0',
            'credits.*.used_days'     => 'nullable|numeric|min:0',
            'credits.*.year'          => 'nullable|integer',
        ]);

        return DB::transaction(function () use ($validated, $employee) {
            $saved = [];

            foreach ($validated['credits'] as $credit) {
                $usedDays      = $credit['used_days'] ?? 0;
                $remainingDays = max(0, $credit['total_days'] - $usedDays);

                $record = LeaveCreditDetail::updateOrCreate(
                    [
                        'employee_id'   => $employee->id,
                        'leave_type_id' => $credit['leave_type_id'],
                        'year'          => $credit['year'] ?? now()->year,
                    ],
                    [
                        'total_days'     => $credit['total_days'],
                        'used_days'      => $usedDays,
                        'remaining_days' => $remainingDays,
                    ]
                );

                $saved[] = $this->formatCredit($record->load('leaveType'));
            }

            return response()->json([
                'message' => 'Leave credits updated successfully',
                'data'    => $saved,
            ]);
        });
    }

    // ══════════════════════════════════════════════════════════════════════════
    // HELPER
    // ══════════════════════════════════════════════════════════════════════════
    private function formatCredit(LeaveCreditDetail $r): array
    {
        return [
            'id'             => $r->id,
            'employee_id'    => $r->employee_id,
            'leave_type_id'  => $r->leave_type_id,
            'leave_type'     => $r->leaveType?->leave_type,
            'leave_code'     => $r->leaveType?->leave_code,
            'year'           => $r->year,
            'total_days'     => $r->total_days,
            'used_days'      => $r->used_days,
            'remaining_days' => $r->remaining_days,
        ];
    }
}