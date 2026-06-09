<?php

namespace App\Http\Controllers\AIMS;

use App\Http\Controllers\Controller;
use App\Models\AIMS\SalesOrder;
use App\Models\AIMS\SalesOrderItem;
use App\Models\AIMS\StockMovement;
use App\Models\AIMS\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesOrderController extends Controller
{
    /* ===============================
       LIST SALES ORDERS
    =============================== */
    public function index()
    {
        return response()->json([
            'data' => SalesOrder::with('customer')
                ->orderBy('created_at', 'desc')
                ->get()
        ]);
    }

    /* ===============================
       CREATE SALES ORDER
    =============================== */
    public function store(Request $request)
    {
        $request->validate([
            'so_number'   => 'required|string|unique:sales_orders,so_number',
            'customer_id' => 'required|exists:customers,id',
            'order_date'  => 'required|date',
            'items'       => 'required|array|min:1',
            'items.*.item_id'    => 'required|exists:items,id',
            'items.*.quantity'   => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($request) {

            $totalAmount = collect($request->items)->sum(
                fn ($row) => $row['quantity'] * $row['unit_price']
            );

            $order = SalesOrder::create([
                'so_number'    => $request->so_number,
                'customer_id'  => $request->customer_id,
                'order_date'   => $request->order_date,
                'total_amount' => $totalAmount,
            ]);

            foreach ($request->items as $row) {
                SalesOrderItem::create([
                    'sales_order_id' => $order->id,
                    'item_id'        => $row['item_id'],
                    'quantity'       => $row['quantity'],
                    'unit_price'     => $row['unit_price'],
                    'subtotal'       => $row['quantity'] * $row['unit_price'],
                ]);
            }
        });

        return response()->json(['message' => 'Sales order created']);
    }

    /* ===============================
       FULFILL ORDER (AUTO STOCK-OUT)
    =============================== */
    public function fulfill($id)
    {
        $order = SalesOrder::with('items.item')
            ->lockForUpdate()
            ->findOrFail($id);

        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Already processed'], 400);
        }

        // ✅ CHECK STOCK AVAILABILITY FIRST
        foreach ($order->items as $row) {
            $item = Item::lockForUpdate()->find($row->item_id);
            
            if ($item->current_stock < $row->quantity) {
                return response()->json([
                    'message' => "Insufficient stock for {$item->name}. Available: {$item->current_stock}, Required: {$row->quantity}"
                ], 422);
            }
        }

        DB::transaction(function () use ($order) {
            foreach ($order->items as $row) {
                StockMovement::create([
                    'item_id'   => $row->item_id,
                    'type'      => 'OUT',
                    'quantity'  => $row->quantity,
                    'reference' => $order->so_number,
                    'notes'     => 'Sales Order Fulfilled',
                ]);
            }

            $order->update(['status' => 'fulfilled']);
        });

        return response()->json(['message' => 'Sales order fulfilled']);
    }

    /* ===============================
       SHOW ORDER
    =============================== */
    public function show($id)
    {
        $order = SalesOrder::with([
            'customer',
            'items.item'
        ])->findOrFail($id);

        return response()->json([
            'data' => $order
        ]);
    }

    /* ===============================
       UPDATE ORDER (PENDING ONLY)
    =============================== */
    public function update(Request $request, $id)
    {
        $order = SalesOrder::findOrFail($id);

        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Cannot edit fulfilled order'], 400);
        }

        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'order_date'  => 'required|date',
        ]);

        $order->update($request->only([
            'customer_id',
            'order_date'
        ]));

        return response()->json(['message' => 'Sales order updated']);
    }

    /* ===============================
       CANCEL ORDER
    =============================== */
    public function cancel($id)
    {
        $order = SalesOrder::findOrFail($id);

        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Already processed'], 400);
        }

        $order->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Sales order cancelled']);
    }
}