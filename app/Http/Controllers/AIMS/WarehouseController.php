<?php

namespace App\Http\Controllers\AIMS;

use App\Http\Controllers\Controller;
use App\Models\AIMS\Warehouse;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    public function index()
    {
        return response()->json(Warehouse::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'        => 'required|string|max:100|unique:aims_warehouses,name',
            'location'    => 'nullable|string|max:255',
            'description' => 'nullable|string|max:255',
        ]);

        $warehouse = Warehouse::create($request->only('name', 'location', 'description'));
        return response()->json($warehouse, 201);
    }

    public function update(Request $request, $id)
    {
        $warehouse = Warehouse::findOrFail($id);

        $request->validate([
            'name'        => 'required|string|max:100|unique:aims_warehouses,name,' . $id,
            'location'    => 'nullable|string|max:255',
            'description' => 'nullable|string|max:255',
        ]);

        $warehouse->update($request->only('name', 'location', 'description'));
        return response()->json($warehouse);
    }

    public function destroy($id)
    {
        Warehouse::findOrFail($id)->delete();
        return response()->json(['message' => 'Warehouse deleted successfully']);
    }
}