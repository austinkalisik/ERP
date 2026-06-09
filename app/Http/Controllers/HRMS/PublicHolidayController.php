<?php

namespace App\Http\Controllers\HRMS;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PublicHolidayController extends Controller
{
    // GET /api/hrms/public-holidays
    public function index()
    {
        $holidays = DB::table('public_holidays')->orderBy('date')->get();
        return response()->json($holidays);
    }

    // POST /api/hrms/public-holidays
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:100',
            'date'        => 'required|date',
            'type'        => 'required|in:Public Holiday,Optional Holiday',
            'description' => 'nullable|string',
            'recurring'   => 'boolean',
        ]);

        $id = DB::table('public_holidays')->insertGetId(array_merge($validated, [
            'created_at' => now(),
            'updated_at' => now(),
        ]));

        return response()->json(DB::table('public_holidays')->find($id), 201);
    }

    // PUT /api/hrms/public-holidays/{id}
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:100',
            'date'        => 'required|date',
            'type'        => 'required|in:Public Holiday,Optional Holiday',
            'description' => 'nullable|string',
            'recurring'   => 'boolean',
        ]);

        DB::table('public_holidays')->where('id', $id)->update(array_merge($validated, [
            'updated_at' => now(),
        ]));

        return response()->json(DB::table('public_holidays')->find($id));
    }

    // DELETE /api/hrms/public-holidays/{id}
    public function destroy($id)
    {
        DB::table('public_holidays')->where('id', $id)->delete();
        return response()->json(['message' => 'Holiday deleted']);
    }
}