<?php

namespace App\Http\Controllers\HRMS;

use App\Http\Controllers\Controller;
use App\Models\HRMS\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    /**
     * GET /api/hrms/departments
     * List all departments
     */
    public function index()
    {
        return response()->json([
            'data' => Department::orderBy('name')->get()
        ]);
    }

    /**
     * POST /api/hrms/departments
     * Create a new department
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'prefix' => 'nullable|string|max:255',
            'department_head_id' => 'nullable|exists:employees,id',
        ]);

        $department = Department::create($validated);

        return response()->json([
            'message' => 'Department created successfully',
            'data' => $department
        ], 201);
    }

    /**
     * GET /api/hrms/departments/{id}
     */
    public function show($id)
    {
        return response()->json([
            'data' => Department::findOrFail($id)
        ]);
    }

    /**
     * PUT /api/hrms/departments/{id}
     */
    public function update(Request $request, $id)
    {
        $department = Department::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'prefix' => 'nullable|string|max:255',
            'department_head_id' => 'nullable|exists:employees,id',
        ]);

        $department->update($validated);

        return response()->json([
            'message' => 'Department updated successfully',
            'data' => $department
        ]);
    }

    /**
     * DELETE /api/hrms/departments/{id}
     */
    public function destroy($id)
    {
        $department = Department::findOrFail($id);
        $department->delete();

        return response()->json([
            'message' => 'Department deleted successfully'
        ]);
    }
}
