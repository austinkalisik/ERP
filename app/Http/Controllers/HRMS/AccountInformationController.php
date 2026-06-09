<?php

namespace App\Http\Controllers\HRMS;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\HRMS\AccountInformation;
use App\Models\HRMS\Employee;

class AccountInformationController extends Controller
{
    /**
     * List all records.
     */
    public function index()
    {
        return response()->json(
            AccountInformation::with('employee')->get()
        );
    }

    /**
     * Show single record.
     */
    public function show($id)
    {
        return response()->json(
            AccountInformation::with('employee')->findOrFail($id)
        );
    }

    /**
     * Store (1 record per employee).
     * Employee MUST already exist from Employment tab.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id'         => 'required|integer|exists:employees,id',

            'nasfund'             => 'nullable|boolean',         
            'nasfund_number'      => 'nullable|string|max:100',
            'tin_number'          => 'nullable|string|max:100',

            'work_permit_number'  => 'nullable|string|max:100',
            'work_permit_expiry'  => 'nullable|date',

            'visa_number'         => 'nullable|string|max:100',
            'visa_expiry'         => 'nullable|date',

            'bsb_code'            => 'nullable|string|max:50',
            'bank_name'           => 'nullable|string|max:150',
            'account_number'      => 'nullable|string|max:150',
            'account_name'        => 'nullable|string|max:150',
        ]);

        return DB::transaction(function () use ($validated) {

            // --------------------------------------
            // 1. Get the employee (already validated it exists)
            // --------------------------------------
            $employee = Employee::findOrFail($validated['employee_id']);

            // --------------------------------------
            // 2. Create or Update account info
            // --------------------------------------
            $record = AccountInformation::updateOrCreate(
                ['employee_id' => $employee->id],
                [
                    'nasfund'             => $validated['nasfund'] ?? 0,  // ✅ ADDED THIS
                    'nasfund_number'      => $validated['nasfund_number'] ?? null,
                    'tin_number'          => $validated['tin_number'] ?? null,

                    'work_permit_number'  => $validated['work_permit_number'] ?? null,
                    'work_permit_expiry'  => $validated['work_permit_expiry'] ?? null,

                    'visa_number'         => $validated['visa_number'] ?? null,
                    'visa_expiry'         => $validated['visa_expiry'] ?? null,

                    'bsb_code'            => $validated['bsb_code'] ?? null,
                    'bank_name'           => $validated['bank_name'] ?? null,
                    'account_number'      => $validated['account_number'] ?? null,
                    'account_name'        => $validated['account_name'] ?? null,
                ]
            );

            // --------------------------------------
            // 3. Standard response
            // --------------------------------------
            $response = $record->toArray();
            $response['employee_id']  = $employee->id;
            $response['biometric_id'] = $employee->biometric_id;

            return response()->json($response, 201);
        });
    }

    /**
     * Update record.
     */
    public function update(Request $request, $id)
    {
        $record = AccountInformation::findOrFail($id);

        $validated = $request->validate([
            'nasfund'             => 'nullable|boolean',         // ✅ ADDED THIS
            'nasfund_number'      => 'nullable|string|max:100',
            'tin_number'          => 'nullable|string|max:100',

            'work_permit_number'  => 'nullable|string|max:100',
            'work_permit_expiry'  => 'nullable|date',

            'visa_number'         => 'nullable|string|max:100',
            'visa_expiry'         => 'nullable|date',

            'bsb_code'            => 'nullable|string|max:50',
            'bank_name'           => 'nullable|string|max:150',
            'account_number'      => 'nullable|string|max:150',
            'account_name'        => 'nullable|string|max:150',
        ]);

        $record->update($validated);

        return response()->json(
            $record->fresh()->load('employee')
        );
    }

    /**
     * Delete record.
     */
    public function destroy($id)
    {
        AccountInformation::findOrFail($id)->delete();
        return response()->json(['message' => 'Record deleted successfully']);
    }
}