<?php

namespace App\Http\Controllers\HRMS;

use App\Http\Controllers\Controller;
use App\Models\HRMS\Employee;
use App\Models\HRMS\EmploymentInformation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class HRMSDashboardController extends Controller
{
    public function getStats()
    {
        // FIXED: Was 4 separate queries. Now 2 queries using conditional aggregation.

        // Query 1 — employee counts in one hit
        $employeeCounts = Employee::selectRaw("
            COUNT(*) as total,
            SUM(created_at >= ?) as new_hires
        ", [Carbon::now()->subDays(30)])->first();

        // Query 2 — active/inactive from employment_information
        $statusCounts = EmploymentInformation::selectRaw("
            SUM(employment_status = 'Active') as active,
            SUM(employment_status != 'Active') as inactive
        ")->first();

        return response()->json([
            'totalEmployees' => (int) ($employeeCounts->total     ?? 0),
            'newHires'       => (int) ($employeeCounts->new_hires ?? 0),
            'activeInactive' => [
                'active'   => (int) ($statusCounts->active   ?? 0),
                'inactive' => (int) ($statusCounts->inactive ?? 0),
            ],
        ]);
    }

    public function getRecentEmployees()
    {
        $employees = Employee::with([
                'employmentInformation.department',
                'employmentInformation.employmentClassification',
            ])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn($employee) => [
                'id'         => $employee->biometric_id,
                'name'       => trim(
                    $employee->first_name . ' ' .
                    ($employee->middle_name ? $employee->middle_name . ' ' : '') .
                    $employee->last_name
                ),
                'department' => optional($employee->employmentInformation->department)->name ?? 'N/A',
                'position'   => $employee->employmentInformation->position ?? 'N/A',
                'status'     => optional($employee->employmentInformation->employmentClassification)->name ?? 'N/A',
            ]);

        return response()->json($employees);
    }

    public function getDepartmentDistribution()
    {
        $distribution = DB::table('employment_information')
            ->leftJoin('departments', 'employment_information.department_id', '=', 'departments.id')
            ->select('departments.name as department', DB::raw('count(*) as employees'))
            ->whereNotNull('employment_information.department_id')
            ->groupBy('departments.id', 'departments.name')
            ->orderBy('employees', 'desc')
            ->get();

        return response()->json($distribution);
    }

    public function getEmployees(Request $request)
    {
        $user = Auth::user();

        if (!$user instanceof User) {
            abort(401, 'Unauthenticated.');
        }

        // Employees can only view themselves
        if ($user->role === 'employee') {
            $employee = Employee::with(['employmentInformation.department'])
                ->where('user_id', $user->id)
                ->first();

            if (!$employee) {
                $employee = Employee::with(['employmentInformation.department'])
                    ->where('biometric_id', $user->biometric_id)
                    ->first();
            }

            if (!$employee) {
                return response()->json([], 200);
            }

            return response()->json([[
                'id'              => $employee->id,
                'biometric_id'    => $employee->biometric_id,
                'employee_number' => $employee->employee_number,
                'fullname'        => trim(
                    $employee->first_name . ' ' .
                    ($employee->middle_name ? $employee->middle_name . ' ' : '') .
                    $employee->last_name
                ),
                'department' => $employee->employmentInformation->department->name ?? 'N/A',
                'position'   => $employee->employmentInformation->position ?? 'N/A',
                'status'     => optional($employee->employmentInformation->employmentClassification)->name ?? 'N/A',
                'hireDate'   => $employee->employmentInformation->date_started ?? null,
            ]], 200);
        }

        // HR, dept_head, system_admin — paginated
        // FIXED: Added paginate(50) — returning all employees on every request
        // is a full table scan that gets slower as headcount grows.
        $query = DB::table('employees')
            ->leftJoin('employment_information',   'employees.id', '=', 'employment_information.employee_id')
            ->leftJoin('departments',              'employment_information.department_id', '=', 'departments.id')
            ->leftJoin('employment_classifications','employment_information.employment_classification', '=', 'employment_classifications.id')
            ->select(
                'employees.id',
                'employees.biometric_id',
                'employees.employee_number',
                DB::raw("CONCAT_WS(' ', employees.first_name, employees.middle_name, employees.last_name) AS fullname"),
                'departments.name as department',
                'employment_information.position',
                'employment_classifications.name as status',
                DB::raw('employment_information.date_started as hireDate')
            );

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('employees.first_name',      'like', "%{$search}%")
                  ->orWhere('employees.last_name',     'like', "%{$search}%")
                  ->orWhere('employees.biometric_id',  'like', "%{$search}%")
                  ->orWhere('employees.employee_number','like', "%{$search}%");
            });
        }

        if ($request->filled('department') && $request->department !== 'All') {
            $query->where('departments.name', $request->department);
        }

        if ($request->filled('status') && $request->status !== 'All') {
            $query->where('employment_information.employment_classification', $request->status);
        }

        $employees = $query->orderBy('employees.id', 'DESC')->paginate(50);

        return response()->json([
            'data' => $employees->items(),
            'meta' => [
                'total'        => $employees->total(),
                'current_page' => $employees->currentPage(),
                'last_page'    => $employees->lastPage(),
                'per_page'     => $employees->perPage(),
            ],
        ]);
    }
}