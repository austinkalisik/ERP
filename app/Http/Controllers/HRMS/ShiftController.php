<?php

namespace App\Http\Controllers\HRMS;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\HRMS\Shift;

class ShiftController extends Controller
{
    /**
     * List all shifts.
     */
    public function index()
    {
        return response()->json(Shift::all());
    }

    /**
     * Show a single shift.
     */
    public function show($id)
    {
        return response()->json(
            Shift::findOrFail($id)
        );
    }

    /**
     * Create a new shift.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'shift_name' => 'required|string|max:150',
            'start_time' => 'required|date_format:H:i',
            'end_time'   => 'required|date_format:H:i',
        ]);

        $shift = Shift::create($validated);

        return response()->json($shift, 201);
    }

    /**
     * Update an existing shift.
     */
    public function update(Request $request, $id)
    {
        $shift = Shift::findOrFail($id);

        $validated = $request->validate([
            'shift_name' => 'sometimes|string|max:150',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time'   => 'sometimes|date_format:H:i',
        ]);

        $shift->update($validated);

        return response()->json($shift);
    }

    /**
     * Delete a shift.
     */
    public function destroy($id)
    {
        Shift::findOrFail($id)->delete();

        return response()->json(['message' => 'Shift deleted successfully']);
    }
}
