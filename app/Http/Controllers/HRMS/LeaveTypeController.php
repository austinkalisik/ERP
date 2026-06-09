<?php

namespace App\Http\Controllers\HRMS;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\HRMS\LeaveType;

class LeaveTypeController extends Controller
{
    public function index()
    {
        return response()->json(LeaveType::orderBy('leave_type')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'leave_type' => 'required|string|max:100',
            'leave_code' => 'required|string|max:20|unique:leave_types,leave_code',
            'num_hours'  => 'required|numeric|min:0',
        ]);

        $leaveType = LeaveType::create($validated);

        return response()->json([
            'message' => 'Leave type created successfully',
            'data'    => $leaveType,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $leaveType = LeaveType::findOrFail($id);

        $validated = $request->validate([
            'leave_type' => 'required|string|max:100',
            'leave_code' => 'required|string|max:20|unique:leave_types,leave_code,' . $id,
            'num_hours'  => 'required|numeric|min:0',
        ]);

        $leaveType->update($validated);

        return response()->json([
            'message' => 'Leave type updated successfully',
            'data'    => $leaveType->fresh(),
        ]);
    }

    public function destroy($id)
    {
        LeaveType::findOrFail($id)->delete();
        return response()->json(['message' => 'Leave type deleted successfully']);
    }
}