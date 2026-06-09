<?php

namespace App\Http\Controllers\MOMS;

use App\Http\Controllers\Controller;
use App\Models\MOMS\InventoryPart;
use Illuminate\Http\Request;

class InventoryPartController extends Controller
{
    public function index(Request $request)
    {
        $query = InventoryPart::query();

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('part_number', 'like', "%{$s}%")
                  ->orWhere('name', 'like', "%{$s}%")
                  ->orWhere('category', 'like', "%{$s}%")
                  ->orWhere('supplier', 'like', "%{$s}%");
            });
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function show($id)
    {
        return response()->json(InventoryPart::findOrFail($id));
    }

    public function store(Request $request)
    {
        $validated = $this->validatePart($request);
        $validated = $this->autoSetStatus($validated);

        $part = InventoryPart::create($validated);

        return response()->json([
            'message' => 'Part created successfully',
            'data'    => $part,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $part      = InventoryPart::findOrFail($id);
        $validated = $this->validatePart($request);
        $validated = $this->autoSetStatus($validated);

        $part->update($validated);

        return response()->json([
            'message' => 'Part updated successfully',
            'data'    => $part->fresh(),
        ]);
    }

    public function destroy($id)
    {
        InventoryPart::findOrFail($id)->delete();

        return response()->json(['message' => 'Part deleted successfully']);
    }

    // Auto-derive status from quantity vs reorder_level
    // unless user explicitly passed a status
    private function autoSetStatus(array $data): array
    {
        $qty     = (int) ($data['quantity']      ?? 0);
        $reorder = (int) ($data['reorder_level'] ?? 5);

        // Only auto-set if status wasn't explicitly provided or is a stock-based status
        $stockStatuses = ['In Stock', 'Low Stock', 'Out of Stock'];
        if (!isset($data['status']) || in_array($data['status'], $stockStatuses)) {
            if ($qty === 0) {
                $data['status'] = 'Out of Stock';
            } elseif ($qty <= $reorder) {
                $data['status'] = 'Low Stock';
            } else {
                $data['status'] = 'In Stock';
            }
        }

        return $data;
    }

    private function validatePart(Request $request): array
    {
        return $request->validate([
            'part_number'   => 'required|string|max:100',
            'name'          => 'required|string|max:255',
            'description'   => 'nullable|string',
            'category'      => 'nullable|in:Engine Parts,Hydraulic Parts,Electrical Parts,Body Parts,Filters,Oils & Lubricants,Tires & Tracks,Other',
            'quantity'      => 'required|integer|min:0',
            'reorder_level' => 'required|integer|min:0',
            'unit_cost'     => 'required|numeric|min:0',
            'supplier'      => 'nullable|string|max:255',
            'status'        => 'nullable|in:In Stock,Low Stock,Out of Stock,On Order',
        ]);
    }
}