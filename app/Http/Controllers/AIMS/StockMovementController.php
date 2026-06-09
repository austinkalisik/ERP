<?php

namespace App\Http\Controllers\AIMS;

use App\Http\Controllers\Controller;
use App\Models\AIMS\StockMovement;
use App\Models\AIMS\Item;
use App\Models\User;
use App\Notifications\AIMS\LowStockNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StockMovementController extends Controller
{
    public function index()
    {
        try {
            $movements = StockMovement::with('item:id,name')
                ->orderByDesc('created_at')
                ->get()
                ->map(fn($movement) => [
                    'id'        => $movement->id,
                    'item_id'   => $movement->item_id,
                    'item_name' => $movement->item->name ?? 'Unknown Item',
                    'type'      => $movement->type,
                    'quantity'  => $movement->quantity,
                    'reference' => $movement->reference,
                    'notes'     => $movement->notes,
                    'datetime'  => $movement->formatted_datetime,
                ]);
            return response()->json(['data' => $movements]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch stock movements', ['error' => $e->getMessage()]);
            return response()->json(['data' => [], 'message' => 'Failed to load stock movements'], 500);
        }
    }

    public function show(int $id)
    {
        try {
            $movement = StockMovement::with('item:id,name')->findOrFail($id);
            return response()->json(['data' => [
                'id'        => $movement->id,
                'item_id'   => $movement->item_id,
                'item_name' => $movement->item->name ?? 'Unknown Item',
                'type'      => $movement->type,
                'quantity'  => $movement->quantity,
                'reference' => $movement->reference,
                'notes'     => $movement->notes,
                'datetime'  => $movement->formatted_datetime,
            ]]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Stock movement not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to load stock movement details'], 500);
        }
    }

    public function stockIn(Request $request)
    {
        $data = $request->validate([
            'item_id'   => 'required|exists:items,id',
            'quantity'  => 'required|integer|min:1',
            'reference' => 'nullable|string|max:255',
            'notes'     => 'nullable|string',
        ]);

        DB::transaction(function () use ($data) {
            StockMovement::create([
                'item_id'   => $data['item_id'],
                'type'      => 'IN',
                'quantity'  => $data['quantity'],
                'reference' => $data['reference'] ?? 'Manual Stock In',
                'notes'     => $data['notes'] ?? null,
            ]);
        });

        return response()->json(['message' => 'Stock added successfully']);
    }

    public function stockOut(Request $request)
    {
        $data = $request->validate([
            'item_id'   => 'required|exists:items,id',
            'quantity'  => 'required|integer|min:1',
            'reference' => 'nullable|string|max:255',
            'notes'     => 'nullable|string',
        ]);

        $item = Item::lockForUpdate()->findOrFail($data['item_id']);

        if ($item->current_stock < $data['quantity']) {
            return response()->json(['message' => 'Insufficient stock'], 422);
        }

        DB::transaction(function () use ($data, $item) {
            StockMovement::create([
                'item_id'   => $item->id,
                'type'      => 'OUT',
                'quantity'  => $data['quantity'],
                'reference' => $data['reference'] ?? 'Manual Stock Out',
                'notes'     => $data['notes'] ?? null,
            ]);

            // ── Check low stock AFTER deduction and notify if below minimum ──
            $item->refresh(); // get updated current_stock from DB trigger/observer
            if ($item->current_stock <= $item->minimum_stock) {
                User::whereIn('role', ['system_admin', 'aims_manager'])
                    ->get()
                    ->each(fn($u) => $u->notify(new LowStockNotification($item)));
            }
        });

        return response()->json(['message' => 'Stock deducted successfully']);
    }
}