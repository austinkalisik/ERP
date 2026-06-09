<?php

namespace App\Http\Controllers\HRMS;

use App\Http\Controllers\Controller;
use App\Models\HRMS\Deminimis;
use App\Models\HRMS\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;


class DeminimisController extends Controller
{
    public function index()
    {
        return response()->json(
            Deminimis::with('employee')->get()
        );
    }

    public function show($id)
    {
        return response()->json(
            Deminimis::with('employee')->findOrFail($id)
        );
    }

    /**
     * Store multiple deminimis allowances for an employee
     * NOW: Only adds new allowances WITHOUT deleting existing ones
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'allowances' => 'required|array',
            'allowances.*.type' => 'required|string',
            'allowances.*.amount' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated) {
            $employee = Employee::findOrFail($validated['employee_id']);

            // ✅ REMOVED: Delete existing deminimis
            // Now we just ADD new allowances

            // Create new deminimis records
            $created = [];
            foreach ($validated['allowances'] as $allowance) {
                $deminimis = Deminimis::create([
                    'employee_id' => $employee->id,
                    'type' => $allowance['type'],
                    'amount' => $allowance['amount'],
                ]);
                $created[] = $deminimis;
            }

            return response()->json([
                'message' => 'Deminimis saved successfully',
                'data' => $created
            ], 201);
        });
    }

    /**
     * Update a specific deminimis record
     */
    public function update(Request $request, $id)
    {
        $deminimis = Deminimis::findOrFail($id);

        $validated = $request->validate([
            'type' => 'sometimes|required|string',
            'amount' => 'sometimes|required|numeric|min:0',
        ]);

        $deminimis->update($validated);

        return response()->json([
            'message' => 'Deminimis updated successfully',
            'data' => $deminimis
        ]);
    }

    /**
     * Delete a specific deminimis record
     */
    public function destroy($id)
    {
        Deminimis::findOrFail($id)->delete();

        return response()->json([
            'message' => 'Deminimis deleted successfully'
        ]);
    }

    /**
     * Get all deminimis for a specific employee
     */
    public function getByEmployee($employeeId)
{
    Log::info('Fetching deminimis for employee', [
        'employee_id' => $employeeId
    ]);

    $allowances = Deminimis::where('employee_id', $employeeId)
        ->orderBy('created_at', 'desc')
        ->get();

    Log::info('Found allowances', [
        'count' => $allowances->count()
    ]);

    return response()->json($allowances);
}

}