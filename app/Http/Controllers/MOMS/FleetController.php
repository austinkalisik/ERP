<?php

namespace App\Http\Controllers\MOMS;

use App\Http\Controllers\Controller;
use App\Models\MOMS\Fleet;
use Illuminate\Http\Request;

class FleetController extends Controller
{
    public function index(Request $request)
    {
        $query = Fleet::query();

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('fleet_number', 'like', "%{$s}%")
                  ->orWhere('asset_number', 'like', "%{$s}%")
                  ->orWhere('registration_number', 'like', "%{$s}%")
                  ->orWhere('make_brand', 'like', "%{$s}%")
                  ->orWhere('model', 'like', "%{$s}%");
            });
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function show($id)
    {
        return response()->json(Fleet::findOrFail($id));
    }

    public function store(Request $request)
    {
        $validated = $this->validateFleet($request);
        $fleet = Fleet::create($validated);

        return response()->json([
            'message' => 'Fleet created successfully',
            'data'    => $fleet,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $fleet = Fleet::findOrFail($id);
        $validated = $this->validateFleet($request);
        $fleet->update($validated);

        return response()->json([
            'message' => 'Fleet updated successfully',
            'data'    => $fleet->fresh(),
        ]);
    }

    public function destroy($id)
    {
        Fleet::findOrFail($id)->delete();

        return response()->json(['message' => 'Fleet deleted successfully']);
    }

    private function validateFleet(Request $request): array
    {
        return $request->validate([
            'fleet_type'          => 'required|in:Excavator,Dozer,Dump Truck,Loader,Grader,Crane,Forklift,Other',
            'make_brand'          => 'required|string|max:255',
            'model'               => 'required|string|max:255',
            'registration_number' => 'nullable|string|max:100',
            'year_of_manufacture' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'vin'                 => 'nullable|string|max:100',
            'color'               => 'nullable|string|max:100',
            'purchase_price'      => 'nullable|numeric|min:0',
            'date_of_acquisition' => 'nullable|date',
            'description'         => 'nullable|string',
            'status'              => 'nullable|in:Active,Inactive,Under Maintenance,Retired',
            'stickers'            => 'nullable|string|max:255',
        ]);
    }
}