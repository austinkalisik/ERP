<?php

namespace App\Http\Controllers\AIMS;

use App\Http\Controllers\Controller;
use App\Models\AIMS\Unit;
use Illuminate\Http\Request;

class UnitController extends Controller
{
    public function index()
    {
        return response()->json(Unit::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'         => 'required|string|max:100|unique:aims_units,name',
            'abbreviation' => 'required|string|max:20|unique:aims_units,abbreviation',
        ]);

        $unit = Unit::create($request->only('name', 'abbreviation'));
        return response()->json($unit, 201);
    }

    public function update(Request $request, $id)
    {
        $unit = Unit::findOrFail($id);

        $request->validate([
            'name'         => 'required|string|max:100|unique:aims_units,name,' . $id,
            'abbreviation' => 'required|string|max:20|unique:aims_units,abbreviation,' . $id,
        ]);

        $unit->update($request->only('name', 'abbreviation'));
        return response()->json($unit);
    }

    public function destroy($id)
    {
        Unit::findOrFail($id)->delete();
        return response()->json(['message' => 'Unit deleted successfully']);
    }
}