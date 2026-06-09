<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\HRMS\Employee;

class PayrollEmployeeController extends Controller
{
    public function index()
    {
       $employees = Employee::with([
        'employmentInformation',
        'department'
    ])
    ->whereHas('employmentInformation', function($query) {
        $query->where('employment_status', 'Active');
    })
    ->orderBy('last_name')
    ->get()
    ->map(function ($emp) {
        return [
            'id' => $emp->id,
            'biometric_id' => $emp->biometric_id,
            'first_name' => $emp->first_name,
            'last_name' => $emp->last_name,
            'fullname' => trim($emp->first_name . ' ' . $emp->last_name),
            'department' => optional($emp->department)->name,
        ];
    });

        return response()->json($employees);
    }
}
