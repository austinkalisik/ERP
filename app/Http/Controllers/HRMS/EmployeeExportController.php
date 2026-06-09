<?php

namespace App\Http\Controllers\HRMS;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmployeeExportController extends Controller
{
    /**
     * Build base query joining employees -> employment_information -> departments
     */
    protected function buildQuery($search = null, $department = null, $status = null)
    {
        return DB::table('employees')
            ->leftJoin('employment_information', 'employees.id', '=', 'employment_information.employee_id')
            ->leftJoin('departments', 'employment_information.department_id', '=', 'departments.id')
            ->select(
                'employees.biometric_id',

                DB::raw("CONCAT(
                    employees.first_name, ' ',
                    COALESCE(CONCAT(employees.middle_name, ' '), ''),
                    employees.last_name
                ) AS fullname"),

                'departments.name as department',
                'employment_information.position',
                DB::raw("COALESCE(employment_information.date_started, '') AS hireDate"),
                DB::raw("COALESCE(employment_information.employment_classification, '') AS employment_classification")
            )
            ->when($search, function ($q) use ($search) {
                $q->where(function ($query) use ($search) {
                    $query->where('employees.first_name', 'LIKE', "%{$search}%")
                        ->orWhere('employees.last_name', 'LIKE', "%{$search}%")
                        ->orWhere('employees.biometric_id', 'LIKE', "%{$search}%");
                });
            })
            ->when($department && $department !== 'All', function ($q) use ($department) {
                $q->where('employment_information.department_id', $department);
            })
            ->when($status && $status !== 'All', function ($q) use ($status) {
                $q->where('employment_information.employment_classification', $status);
            })
            ->orderBy('employees.first_name', 'asc');
    }

    /**
     * Export Employees as CSV
     */
    public function exportCSV(Request $request)
    {
        $employees = $this->buildQuery(
            $request->query('search'),
            $request->query('department'),
            $request->query('status')
        )->get();

        $response = new StreamedResponse(function () use ($employees) {
            $out = fopen('php://output', 'w');

            fputcsv($out, [
                'Biometric ID',
                'Full Name',
                'Department',
                'Position',
                'Hire Date',
                'Employment Status'
            ]);

            foreach ($employees as $emp) {
                fputcsv($out, [
                    $emp->biometric_id,
                    $emp->fullname,
                    $emp->department,
                    $emp->position,
                    $emp->hireDate,
                    $emp->employment_classification
                ]);
            }

            fclose($out);
        });

        $filename = 'employees_' . date('Ymd_His') . '.csv';

        $response->headers->set('Content-Type', 'text/csv; charset=UTF-8');
        $response->headers->set('Content-Disposition', 'attachment; filename="' . $filename . '"');

        return $response;
    }

    /**
     * Export Employees as PDF
     */
    public function exportPDF(Request $request)
    {
        $employees = $this->buildQuery(
            $request->query('search'),
            $request->query('department'),
            $request->query('status')
        )->get();

        $pdf = Pdf::loadView('exports.employees', [
            'employees' => $employees
        ])->setPaper('a4', 'landscape');

        return $pdf->download('employees_' . date('Ymd_His') . '.pdf');
    }

    /**
     * Export Employee CV (single employee)
     */
    public function exportEmployeeCV($biometric_id)
    {
        // MAIN EMPLOYEE DATA (NO DEMINIMIS JOIN)
        $employee = DB::table('employees')
            ->leftJoin('employment_information', 'employees.id', '=', 'employment_information.employee_id')
            ->leftJoin('departments', 'employment_information.department_id', '=', 'departments.id')
            ->leftJoin('personal_information', 'employees.id', '=', 'personal_information.employee_id')
            ->leftJoin('account_information', 'employees.id', '=', 'account_information.employee_id')
            ->leftJoin('leave_credits', 'employees.id', '=', 'leave_credits.employee_id')
            ->where('employees.biometric_id', $biometric_id)
            ->select(
                'employees.id',
                'employees.biometric_id',
                'employees.profile_picture',

                DB::raw("CONCAT(
                    employees.first_name, ' ',
                    COALESCE(CONCAT(employees.middle_name, ' '), ''),
                    employees.last_name
                ) AS fullname"),

                // Personal Info
                'personal_information.birthdate',
                'personal_information.age',
                'personal_information.birthplace',
                'personal_information.gender',
                'personal_information.civil_status',
                'personal_information.religion',
                'personal_information.nationality',
                'personal_information.present_address',
                'personal_information.home_address',
                'personal_information.mobile_number',
                'personal_information.email_address',
                'personal_information.dependents',
                'personal_information.lodged',
                'personal_information.emergency_contact',
                'personal_information.emergency_number',

                // Employment Info
                'departments.name as department',
                'employment_information.position',
                'employment_information.department_head',
                'employment_information.supervisor',
                'employment_information.job_location',
                'employment_information.company_email',
                'employment_information.employment_status',
                'employment_information.employment_classification',
                'employment_information.employee_type',
                'employment_information.rate',
                'employment_information.rate_type',
                'employment_information.date_started',
                'employment_information.date_ended',

                // Account Info
                'account_information.nasfund_number',
                'account_information.tin_number',
                'account_information.work_permit_number',
                'account_information.work_permit_expiry',
                'account_information.visa_number',
                'account_information.visa_expiry',
                'account_information.bank_name',
                'account_information.account_number',
                'account_information.account_name',
                'account_information.bsb_code',

                // Leave Credits
                'leave_credits.vacation_year',
                'leave_credits.vacation_credits',
                'leave_credits.sick_year',
                'leave_credits.sick_credits',
                'leave_credits.emergency_year',
                'leave_credits.emergency_credits'
            )
            ->first();

        if (!$employee) {
            return response()->json(['error' => 'Employee not found'], 404);
        }

        // ✅ FETCH DEMINIMIS SEPARATELY (NEW STRUCTURE)
        $allowances = DB::table('deminimis')
            ->where('employee_id', $employee->id)
            ->select('type', 'amount')
            ->get();

        $pdf = Pdf::loadView('exports.employee_cv', [
            'employee'   => $employee,
            'allowances' => $allowances
        ])->setPaper('a4', 'portrait');

        return $pdf->download(
            str_replace(' ', '_', $employee->fullname) . '_CV_' . date('Ymd') . '.pdf'
        );
    }
}
