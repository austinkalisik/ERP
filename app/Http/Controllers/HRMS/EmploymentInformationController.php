<?php

namespace App\Http\Controllers\HRMS;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use App\Models\HRMS\EmploymentInformation;
use App\Models\HRMS\Employee;
use App\Models\HRMS\PersonalInformation;
use App\Models\HRMS\AccountInformation;
use App\Models\HRMS\Department;
use App\Models\User;
use App\Models\Permission;
use App\Notifications\HRMS\EmployeeAddedNotification;
use Illuminate\Support\Facades\Auth;

class EmploymentInformationController extends Controller
{
    protected function authorizePermission(string $permission): void
    {
        $user = Auth::user();
        if (!$user instanceof User || !$user->hasPermission($permission)) {
            abort(403, 'Unauthorized action.');
        }
    }

    private function createBiometricsData(string $firstName, string $lastName): string
    {
        $firstInitial  = strtoupper(substr($firstName, 0, 1));
        $lastInitial   = strtoupper(substr($lastName, 0, 1));
        $middleInitial = '';
        if (str_contains($firstName, ' ')) {
            $parts         = explode(' ', $firstName);
            $firstInitial  = strtoupper(substr($parts[0], 0, 1));
            $middleInitial = strtoupper(substr(end($parts), 0, 1));
        }
        $initials = preg_replace('/\s+/', '', $firstInitial . $middleInitial . $lastInitial);
        do {
            $random      = rand(10000, 99999);
            $biometricId = $initials . '-' . $random;
        } while (Employee::where('biometric_id', $biometricId)->exists());
        return $biometricId;
    }

    private function createEmployeeNumber(int $departmentId): string
    {
        $department = Department::findOrFail($departmentId);
        $prefix     = $department->prefix ?? strtoupper(substr($department->name, 0, 3));
        $lastEmployee = Employee::whereHas('employmentInformation', function ($query) use ($departmentId) {
            $query->where('department_id', $departmentId);
        })
        ->where('employee_number', 'LIKE', $prefix . '-%')
        ->orderByRaw('CAST(SUBSTRING(employee_number, ' . (strlen($prefix) + 2) . ') AS UNSIGNED) DESC')
        ->first();
        $nextNumber = $lastEmployee
            ? intval(substr($lastEmployee->employee_number, strlen($prefix) + 1)) + 1
            : 1;
        return $prefix . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    private function getRolePermissions(string $role): array
    {
        $map = [
            'employee'     => ['access_hrms', 'employee.view', 'leave.view', 'leave.create', 'ot.create', 'attendance.view', 'payslip.view'],
            'dept_head'    => ['access_hrms', 'employee.view', 'leave.view', 'leave.approve', 'ot.approve', 'attendance.view'],
            'hr'           => ['access_hrms', 'access_payroll', 'employee.view', 'employee.create', 'employee.update', 'employee.delete', 'leave.view', 'leave.manage', 'ot.manage', 'attendance.manage', 'payslip.view'],
            'system_admin' => [],
        ];
        return $map[$role] ?? [];
    }

    public function index()
    {
        $this->authorizePermission('employee.view');
        $records = EmploymentInformation::with(['employee', 'department', 'employmentClassification'])->get();
        return response()->json(
            $records->map(function ($record) {
                $employee = $record->employee;
                return [
                    'id'           => $employee->id,
                    'biometric_id' => $employee->biometric_id,
                    'fullname'     => trim($employee->first_name . ' ' . ($employee->middle_name ? $employee->middle_name . ' ' : '') . $employee->last_name),
                    'department'   => $record->department->name ?? 'N/A',
                    'position'     => $record->position ?? 'N/A',
                    'hireDate'     => $record->date_started ?? null,
                    'status'       => $record->employmentClassification->name ?? 'N/A',
                ];
            })
        );
    }

    public function store(Request $request)
    {
        $this->authorizePermission('employee.create');

        $validated = $request->validate([
            'first_name'                => 'required|string|max:150',
            'middle_name'               => 'nullable|string|max:150',
            'last_name'                 => 'required|string|max:150',
            'shift_id'                  => 'nullable|integer|exists:shifts,id',
            'department_id'             => 'required|integer|exists:departments,id',
            'position'                  => 'required|string|max:150',
            'department_head'           => 'nullable|string|max:150',
            'supervisor'                => 'nullable|string|max:150',
            'job_location'              => 'nullable|string|max:150',
            'employee_type'             => 'required|string|max:100',
            'employment_status'         => 'required|string|max:100',
            'employment_classification' => 'nullable|integer|exists:employment_classifications,id',
            'company_email'             => 'nullable|email|max:150',
            'rate'                      => 'nullable|numeric',
            'rate_type'                 => 'nullable|string|max:50',
            'date_started'              => 'nullable|date',
            'date_ended'                => 'nullable|date',
            'create_user_account'       => 'boolean',
            'user_email'                => 'required_if:create_user_account,true|email|unique:users,email',
            'user_password'             => 'required_if:create_user_account,true|min:8',
            'user_role'                 => 'required_if:create_user_account,true|in:employee,dept_head,hr,system_admin',
        ]);

        return DB::transaction(function () use ($request, $validated) {
            $employee = Employee::create([
                'first_name'      => $validated['first_name'],
                'middle_name'     => $validated['middle_name'] ?? null,
                'last_name'       => $validated['last_name'],
                'biometric_id'    => $this->createBiometricsData($validated['first_name'], $validated['last_name']),
                'employee_number' => $this->createEmployeeNumber($validated['department_id']),
                'shift_id'        => $validated['shift_id'] ?? null,
            ]);

            $record = EmploymentInformation::updateOrCreate(
                ['employee_id' => $employee->id],
                [
                    'department_id'             => $validated['department_id'],
                    'position'                  => $validated['position'],
                    'department_head'           => $validated['department_head'] ?? null,
                    'supervisor'                => $validated['supervisor'] ?? null,
                    'job_location'              => $validated['job_location'] ?? null,
                    'employee_type'             => $validated['employee_type'],
                    'employment_status'         => $validated['employment_status'],
                    'employment_classification' => $validated['employment_classification'] ?? null,
                    'company_email'             => $validated['company_email'] ?? null,
                    'rate'                      => $validated['rate'] ?? null,
                    'rate_type'                 => $validated['rate_type'] ?? null,
                    'date_started'              => $validated['date_started'] ?? null,
                    'date_ended'                => $validated['date_ended'] ?? null,
                ]
            );

            $userCreated = false;

            if ($request->create_user_account) {
                $currentUser = Auth::user();
                if (!$currentUser instanceof User || !$currentUser->hasPermission('user.create')) {
                    throw new \Exception('You do not have permission to create user accounts.');
                }
                $user = User::create([
                    'name'      => trim($validated['first_name'] . ' ' . ($validated['middle_name'] ? $validated['middle_name'] . ' ' : '') . $validated['last_name']),
                    'email'     => $validated['user_email'],
                    'password'  => Hash::make($validated['user_password']),
                    'role'      => $validated['user_role'],
                    'is_active' => true,
                ]);
                $employee->user_id = $user->id;
                $employee->save();
                $permissionIds = $validated['user_role'] === 'system_admin'
                    ? Permission::pluck('id')->toArray()
                    : Permission::whereIn('slug', $this->getRolePermissions($validated['user_role']))->pluck('id')->toArray();
                $user->permissions()->sync($permissionIds);
                $userCreated = true;
            }

            // ── Notify HR and system_admin that a new employee was added ─────
            $department = Department::find($validated['department_id']);
            $fullName   = trim($validated['first_name'] . ' ' . ($validated['middle_name'] ? $validated['middle_name'] . ' ' : '') . $validated['last_name']);

            User::whereIn('role', ['system_admin', 'hr'])
                ->where('id', '!=', Auth::id()) // don't notify the creator
                ->get()
                ->each(fn($u) => $u->notify(new EmployeeAddedNotification(
                    $fullName,
                    $employee->biometric_id,
                    $department->name ?? 'N/A'
                )));

            return response()->json([
                'message'      => 'Employment info saved successfully.',
                'employee_id'  => $employee->id,
                'employee'     => $employee,
                'employment'   => $record,
                'user_created' => $userCreated,
            ], 201);
        });
    }

    public function update(Request $request, $id)
    {
        $this->authorizePermission('employee.update');
        $record = EmploymentInformation::findOrFail($id);
        $validated = $request->validate([
            'department_id'             => 'nullable|integer|exists:departments,id',
            'position'                  => 'nullable|string|max:150',
            'department_head'           => 'nullable|string|max:150',
            'supervisor'                => 'nullable|string|max:150',
            'job_location'              => 'nullable|string|max:150',
            'employee_type'             => 'nullable|string|max:100',
            'employment_status'         => 'nullable|string|max:100',
            'employment_classification' => 'nullable|integer|exists:employment_classifications,id',
            'company_email'             => 'nullable|email|max:150',
            'rate'                      => 'nullable|numeric',
            'rate_type'                 => 'nullable|string|max:50',
            'date_started'              => 'nullable|date',
            'date_ended'                => 'nullable|date',
            'shift_id'                  => 'nullable|integer|exists:shifts,id',
        ]);
        $record->update($validated);
        if (array_key_exists('shift_id', $validated) && $record->employee) {
            $record->employee->update(['shift_id' => $validated['shift_id']]);
        }
        return response()->json($record->fresh()->load(['employee.shift', 'department']));
    }

    public function destroy($id)
    {
        $this->authorizePermission('employee.delete');
        EmploymentInformation::findOrFail($id)->delete();
        return response()->json(['message' => 'Record deleted successfully']);
    }

    public function getEmployeeDetails($biometric_id)
    {
        $user = Auth::user();
        if (!$user instanceof User) abort(401, 'Unauthenticated.');
        if (!$user->hasPermission('employee.view')) {
            if ($user->biometric_id !== $biometric_id) abort(403, 'You can only view your own profile.');
        }
        $employee = Employee::where('biometric_id', $biometric_id)
            ->with(['employmentInformation.department', 'employmentInformation.employmentClassification', 'personalInformation', 'accountInformation', 'deminimis'])
            ->firstOrFail();

        return response()->json([
            'id'              => $employee->id,
            'biometric_id'    => $employee->biometric_id,
            'employee_number' => $employee->employee_number,
            'employment_information' => [
                'department_id' => $employee->employmentInformation->department_id ?? null,
                'position'      => $employee->employmentInformation->position ?? null,
            ],
            'shift' => $employee->shift ? ['shift_id' => $employee->shift_id, 'shift_name' => $employee->shift->shift_name] : null,
            'fullname'    => trim($employee->first_name . ' ' . ($employee->middle_name ? $employee->middle_name . ' ' : '') . $employee->last_name),
            'first_name'  => $employee->first_name,
            'middle_name' => $employee->middle_name,
            'last_name'   => $employee->last_name,
            'department'                   => $employee->employmentInformation->department->name ?? 'N/A',
            'position'                     => $employee->employmentInformation->position ?? 'N/A',
            'department_head'              => $employee->employmentInformation->department_head ?? 'N/A',
            'supervisor'                   => $employee->employmentInformation->supervisor ?? 'N/A',
            'job_location'                 => $employee->employmentInformation->job_location ?? 'N/A',
            'employment_status'            => $employee->employmentInformation->employment_status ?? 'N/A',
            'employment_classification_id' => $employee->employmentInformation->employment_classification ?? null,
            'employment_classification'    => $employee->employmentInformation->employmentClassification->name ?? 'N/A',
            'employee_type'                => $employee->employmentInformation->employee_type ?? 'N/A',
            'company_email'                => $employee->employmentInformation->company_email ?? 'N/A',
            'rate'                         => $employee->employmentInformation->rate ?? '0.00',
            'rate_type'                    => $employee->employmentInformation->rate_type ?? 'N/A',
            'date_started'                 => $employee->employmentInformation->date_started ?? 'N/A',
            'date_ended'                   => $employee->employmentInformation->date_ended ?? 'N/A',
            'mobile_number'     => $employee->personalInformation->mobile_number ?? 'N/A',
            'birthdate'         => $employee->personalInformation->birthdate ?? null,
            'age'               => $employee->personalInformation->age ?? null,
            'birthplace'        => $employee->personalInformation->birthplace ?? null,
            'nationality'       => $employee->personalInformation->nationality ?? null,
            'civil_status'      => $employee->personalInformation->civil_status ?? null,
            'religion'          => $employee->personalInformation->religion ?? null,
            'gender'            => $employee->personalInformation->gender ?? null,
            'present_address'   => $employee->personalInformation->present_address ?? null,
            'home_address'      => $employee->personalInformation->home_address ?? null,
            'email_address'     => $employee->personalInformation->email_address ?? null,
            'dependents'        => $employee->personalInformation->dependents ?? null,
            'tax_type'          => $employee->personalInformation->tax_type ?? 'No Declaration',
            'lodged'            => $employee->personalInformation->lodged ?? null,
            'emergency_contact' => $employee->personalInformation->emergency_contact ?? null,
            'emergency_number'  => $employee->personalInformation->emergency_number ?? null,
            'personal_info' => $employee->personalInformation ? ['id' => $employee->personalInformation->id, 'tax_type' => $employee->personalInformation->tax_type ?? 'No Declaration'] : null,
            'account_information' => $employee->accountInformation ? [
                'nasfund'            => (bool) $employee->accountInformation->nasfund,
                'nasfund_number'     => $employee->accountInformation->nasfund_number,
                'tin_number'         => $employee->accountInformation->tin_number,
                'work_permit_number' => $employee->accountInformation->work_permit_number,
                'work_permit_expiry' => $employee->accountInformation->work_permit_expiry,
                'visa_number'        => $employee->accountInformation->visa_number,
                'visa_expiry'        => $employee->accountInformation->visa_expiry,
                'account_number'     => $employee->accountInformation->account_number,
                'account_name'       => $employee->accountInformation->account_name,
                'bank_name'          => $employee->accountInformation->bank_name,
                'bsb_code'           => $employee->accountInformation->bsb_code,
            ] : null,
            'nasfund_number'     => $employee->accountInformation->nasfund_number ?? null,
            'tin_number'         => $employee->accountInformation->tin_number ?? null,
            'work_permit_number' => $employee->accountInformation->work_permit_number ?? null,
            'work_permit_expiry' => $employee->accountInformation->work_permit_expiry ?? null,
            'visa_number'        => $employee->accountInformation->visa_number ?? null,
            'visa_expiry'        => $employee->accountInformation->visa_expiry ?? null,
            'account_number'     => $employee->accountInformation->account_number ?? null,
            'account_name'       => $employee->accountInformation->account_name ?? null,
            'bank_name'          => $employee->accountInformation->bank_name ?? null,
            'bsb_code'           => $employee->accountInformation->bsb_code ?? null,
            'clothing_allowance'       => $employee->deminimis->clothing_allowance ?? 0,
            'meal_allowance'           => $employee->deminimis->meal_allowance ?? 0,
            'rice_subsidy'             => $employee->deminimis->rice_subsidy ?? 0,
            'transportation_allowance' => $employee->deminimis->transportation_allowance ?? 0,
            'profile_picture' => $employee->profile_picture ? asset('storage/' . $employee->profile_picture) : null,
        ]);
    }

    public function updateProfile(Request $request, $biometric_id)
    {
        $user = Auth::user();
        if (!$user instanceof User) abort(401, 'Unauthenticated.');
        if (!$user->hasPermission('employee.update')) {
            if ($user->biometric_id !== $biometric_id) abort(403, 'You can only update your own profile.');
        }
        $request->validate([
            'first_name' => 'required|string', 'last_name' => 'required|string', 'middle_name' => 'nullable|string',
            'employee_type' => 'nullable|string', 'rate_type' => 'nullable|string',
            'department_id' => 'nullable|integer|exists:departments,id', 'position' => 'nullable|string',
            'employment_classification' => 'nullable|integer|exists:employment_classifications,id',
            'rate' => 'nullable|numeric', 'date_started' => 'nullable|date', 'date_ended' => 'nullable|date',
            'department_head' => 'nullable|string', 'supervisor' => 'nullable|string', 'job_location' => 'nullable|string',
            'company_email' => 'nullable|email', 'nasfund' => 'nullable|integer|in:0,1',
            'nasfund_number' => 'nullable|string', 'tin_number' => 'nullable|string',
            'account_number' => 'nullable|string', 'bank_name' => 'nullable|string', 'account_name' => 'nullable|string',
            'bsb_code' => 'nullable|string', 'work_permit_number' => 'nullable|string',
            'work_permit_expiry' => 'nullable|date', 'visa_number' => 'nullable|string', 'visa_expiry' => 'nullable|date',
            'profile_picture' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'shift_id' => 'nullable|integer|exists:shifts,id',
        ]);

        DB::beginTransaction();
        try {
            $employee = Employee::where('biometric_id', $biometric_id)->firstOrFail();
            $employee->update(['first_name' => $request->first_name, 'middle_name' => $request->middle_name, 'last_name' => $request->last_name, 'shift_id' => $request->shift_id]);
            $personal = PersonalInformation::where('employee_id', $employee->id)->firstOrFail();
            $personal->update(['first_name' => $request->first_name, 'middle_name' => $request->middle_name, 'last_name' => $request->last_name]);
            $employment = EmploymentInformation::where('employee_id', $employee->id)->firstOrFail();
            $employment->update(['employee_type' => $request->employee_type, 'rate_type' => $request->rate_type, 'rate' => $request->rate, 'department_id' => $request->department_id, 'position' => $request->position, 'employment_classification' => $request->employment_classification, 'department_head' => $request->department_head, 'supervisor' => $request->supervisor, 'job_location' => $request->job_location, 'company_email' => $request->company_email, 'date_started' => $request->date_started, 'date_ended' => $request->date_ended]);
            $account = AccountInformation::where('employee_id', $employee->id)->firstOrFail();
            $account->update(['nasfund' => (bool) $request->nasfund, 'nasfund_number' => $request->nasfund == 1 ? $request->nasfund_number : null, 'tin_number' => $request->tin_number, 'account_number' => $request->account_number, 'bank_name' => $request->bank_name, 'account_name' => $request->account_name, 'bsb_code' => $request->bsb_code, 'work_permit_number' => $request->work_permit_number, 'work_permit_expiry' => $request->work_permit_expiry, 'visa_number' => $request->visa_number, 'visa_expiry' => $request->visa_expiry]);
            if ($request->hasFile('profile_picture')) {
                if ($employee->profile_picture && Storage::exists('public/' . $employee->profile_picture)) {
                    Storage::delete('public/' . $employee->profile_picture);
                }
                $path = $request->file('profile_picture')->store('profile_pictures', 'public');
                $employee->profile_picture = $path;
                $employee->save();
            }
            DB::commit();
            return response()->json(['message' => 'Profile updated successfully.', 'profile_picture' => $employee->profile_picture]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}