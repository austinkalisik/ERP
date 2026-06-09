<?php

namespace App\Http\Controllers\HRMS;

use App\Http\Controllers\Controller;
use App\Models\HRMS\OvertimeType;
use Illuminate\Http\Request;

class OvertimeTypeController extends Controller
{
    // GET /api/hrms/overtime-types
    public function index()
    {
        return response()->json(OvertimeType::orderBy('id')->get());
    }

    // POST /api/hrms/overtime-types
    public function store(Request $request)
    {
        $validated = $request->validate([
            'overtime_type' => 'required|string|max:100',
            'overtime_code' => 'required|string|max:20|unique:overtime_types,overtime_code',
            'multiplier'    => 'required|numeric|min:0',
        ]);

        $ot = OvertimeType::create($validated);

        return response()->json($ot, 201);
    }

    // PUT /api/hrms/overtime-types/{id}
    public function update(Request $request, $id)
    {
        $ot = OvertimeType::findOrFail($id);

        $validated = $request->validate([
            'overtime_type' => 'required|string|max:100',
            'overtime_code' => 'required|string|max:20|unique:overtime_types,overtime_code,' . $id,
            'multiplier'    => 'required|numeric|min:0',
        ]);

        $ot->update($validated);

        return response()->json($ot);
    }

    // DELETE /api/hrms/overtime-types/{id}
    public function destroy($id)
    {
        $ot = OvertimeType::findOrFail($id);
        $ot->delete();

        return response()->json(['message' => 'Overtime type deleted']);
    }
}