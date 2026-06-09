<?php

namespace App\Http\Controllers\HRMS;

use App\Http\Controllers\Controller;
use App\Models\HRMS\Application;
use App\Models\HRMS\Employee;
use App\Models\HRMS\LeaveType;
use App\Models\HRMS\LeaveCreditDetail;
use App\Models\User;
use App\Notifications\HRMS\ApplicationStatusNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ApplicationController extends Controller
{
    public function getAllApplications()
    {
        $user = Auth::user();
        if (!$user instanceof User) abort(401, 'Unauthenticated.');
        if (!$user->hasPermission('leave.approve') && !$user->hasPermission('leave.manage') &&
            !$user->hasPermission('ot.approve')    && !$user->hasPermission('ot.manage')) {
            abort(403, 'Unauthorized.');
        }

        $applications = Application::with(['employee' => function ($query) {
            $query->select('id', 'biometric_id', 'first_name', 'middle_name', 'last_name');
        }])
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(fn($app) => $this->formatApplication($app, true));

        return response()->json($applications, 200);
    }

    public function index($biometric_id)
    {
        $employee = Employee::where('biometric_id', $biometric_id)->first();
        if (!$employee) return response()->json(['message' => 'Employee not found'], 404);

        $applications = Application::where('biometric_id', $biometric_id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($app) => $this->formatApplication($app, false));

        return response()->json($applications, 200);
    }

    public function store(Request $request, $biometric_id)
    {
        $employee = Employee::where('biometric_id', $biometric_id)->first();
        if (!$employee) return response()->json(['message' => 'Employee not found'], 404);

        $validator = Validator::make($request->all(), [
            'application_type' => 'required|string',
            'leave_type'       => 'nullable|required_if:application_type,Leave|string',
            'leave_duration'   => 'nullable|string',
            'half_day_period'  => 'nullable|string',
            'overtime_type'    => 'nullable|string',
            'date_from'        => 'required|date',
            'date_to'          => 'required|date|after_or_equal:date_from',
            'time_from'        => 'nullable|date_format:H:i',
            'time_to'          => 'nullable|date_format:H:i',
            'status'           => 'nullable|string',
            'purpose'          => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        return DB::transaction(function () use ($request, $biometric_id, $employee) {
            $creator      = Auth::user();
            $creatorRole  = $creator instanceof User ? $creator->role : 'employee';
            $isPrivileged = in_array($creatorRole, ['system_admin', 'hr']);
            $initialStatus = $isPrivileged ? 'Posted' : ($request->status ?? 'Draft');

            $data = [
                'biometric_id'     => $biometric_id,
                'application_type' => $request->application_type,
                'date_from'        => $request->date_from,
                'date_to'          => $request->date_to,
                'status'           => $initialStatus,
                'purpose'          => $request->purpose,
                'time_from'        => $request->time_from,
                'time_to'          => $request->time_to,
                'created_by_role'  => $creatorRole,
            ];

            if ($request->application_type === 'Leave') {
                $data['leave_type']      = $request->leave_type;
                $data['leave_duration']  = $request->leave_duration ?? 'Full Day';
                $data['half_day_period'] = $request->half_day_period;
            }
            if ($request->application_type === 'Overtime') {
                $data['overtime_type'] = $request->overtime_type;
            }

            $application = Application::create($data);

            if ($isPrivileged && strtolower($application->application_type) === 'leave') {
                $this->processDeduction($application, $employee);
            }

            $application->refresh();

            // ── Notify employee of their application status ───────────────────
            $employeeUser = $employee->user ?? null;
            if ($employeeUser && $initialStatus !== 'Draft') {
                $employeeUser->notify(new ApplicationStatusNotification(
                    $application, 'New', $initialStatus
                ));
            }

            return response()->json([
                'message' => 'Application created successfully',
                'data'    => $this->formatApplication($application, false),
            ], 201);
        });
    }

    public function show($id)
    {
        $app = Application::findOrFail($id);
        return response()->json($this->formatApplication($app, false), 200);
    }

    public function update(Request $request, $id)
    {
        return DB::transaction(function () use ($request, $id) {
            $application = Application::findOrFail($id);
            $oldStatus   = $application->status;

            $application->update($request->all());
            $newStatus = $application->status;

            // ── Notify employee whenever status changes ────────────────────────
            if ($oldStatus !== $newStatus) {
                $employee = Employee::where('biometric_id', $application->biometric_id)->first();
                $employeeUser = $employee?->user ?? null;
                if ($employeeUser) {
                    $employeeUser->notify(new ApplicationStatusNotification(
                        $application, $oldStatus, $newStatus
                    ));
                }

                // Also notify HR/admin when application reaches Pending HR
                if ($newStatus === 'Pending HR') {
                    User::whereIn('role', ['system_admin', 'hr'])
                        ->get()
                        ->each(fn($u) => $u->notify(new ApplicationStatusNotification(
                            $application, $oldStatus, $newStatus
                        )));
                }
            }

            if (strtolower($application->application_type) !== 'leave') {
                return response()->json(['message' => 'Updated'], 200);
            }

            $employee = Employee::where('biometric_id', $application->biometric_id)->firstOrFail();

            if ($oldStatus !== 'Posted' && $newStatus === 'Posted') {
                $this->processDeduction($application, $employee);
            }

            if (in_array($oldStatus, ['Approved by HR', 'Posted']) &&
                in_array($newStatus, ['Rejected', 'Cancelled'])) {
                $this->processRestore($application, $employee);
            }

            $application->refresh();

            return response()->json([
                'message' => 'Application updated successfully',
                'data'    => $this->formatApplication($application, false),
            ], 200);
        });
    }

    public function destroy($id)
    {
        Application::findOrFail($id)->delete();
        return response()->json(['message' => 'Application deleted successfully'], 200);
    }

    // ── Private helpers (unchanged) ───────────────────────────────────────────

    private function getCreditRecord(string $leaveTypeName, Employee $employee): ?LeaveCreditDetail
    {
        $leaveType = LeaveType::whereRaw('LOWER(leave_type) = ?', [strtolower(trim($leaveTypeName))])->first();
        if (!$leaveType) return null;
        return LeaveCreditDetail::where('employee_id', $employee->id)
            ->where('leave_type_id', $leaveType->id)->first();
    }

    private function calculateDays(Application $application): float
    {
        if ($application->leave_duration === 'Half Day') return 0.5;
        return (float) Carbon::parse($application->date_from)
            ->diffInDays(Carbon::parse($application->date_to)) + 1;
    }

    private function processDeduction(Application $application, Employee $employee): void
    {
        $credit = $this->getCreditRecord($application->leave_type ?? '', $employee);
        if (!$credit) return;
        $days = $this->calculateDays($application);
        if ($credit->remaining_days < $days) abort(422, 'Insufficient ' . $application->leave_type . ' credits');
        $credit->used_days      += $days;
        $credit->remaining_days -= $days;
        $credit->save();
    }

    private function processRestore(Application $application, Employee $employee): void
    {
        $credit = $this->getCreditRecord($application->leave_type ?? '', $employee);
        if (!$credit) return;
        $days = $this->calculateDays($application);
        $credit->used_days      = max(0, $credit->used_days - $days);
        $credit->remaining_days += $days;
        $credit->save();
    }

    private function formatApplication(Application $app, bool $includeEmployee): array
    {
        $data = [
            'id'               => $app->id,
            'biometric_id'     => $app->biometric_id,
            'application_type' => $app->application_type,
            'leave_type'       => $app->leave_type,
            'leave_duration'   => $app->leave_duration,
            'half_day_period'  => $app->half_day_period,
            'overtime_type'    => $app->overtime_type,
            'date_from'        => $app->date_from ? $app->date_from->format('Y-m-d') : null,
            'date_to'          => $app->date_to   ? $app->date_to->format('Y-m-d')   : null,
            'time_from'        => $app->time_from,
            'time_to'          => $app->time_to,
            'purpose'          => $app->purpose,
            'status'           => $app->status,
            'created_by_role'  => $app->created_by_role ?? 'employee',
            'created_at'       => $app->created_at,
            'updated_at'       => $app->updated_at,
        ];

        if ($includeEmployee) {
            $data['employee_biometric_id'] = $app->biometric_id;
            $data['employee_name'] = $app->employee
                ? trim($app->employee->first_name . ' ' .
                    ($app->employee->middle_name ? $app->employee->middle_name . ' ' : '') .
                    $app->employee->last_name)
                : 'Unknown';
        }

        return $data;
    }
}