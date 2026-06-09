<?php

namespace App\Http\Controllers\AIMS;

use App\Http\Controllers\Controller;
use App\Models\AIMS\RequestOrder;
use App\Models\AIMS\RequestOrderItem;
use App\Models\AIMS\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RequestOrderController extends Controller
{
    /* ===============================
       LIST REQUEST ORDERS
    =============================== */
    public function index()
    {
        return response()->json([
            'data' => RequestOrder::with('supplier')
                ->orderBy('created_at', 'desc')
                ->get()
        ]);
    }

    /* ===============================
       CREATE REQUEST ORDER
    =============================== */
    public function store(Request $request)
{
    Log::info('RO store hit', $request->all()); 
    $request->validate([
        'po_number'    => 'required|string|unique:request_orders,po_number',
        'supplier_id'  => 'required|exists:suppliers,id',
        'order_date'   => 'required|date',
        'purchase_request_id' => 'nullable|exists:purchase_requests,id',
        'items'        => 'required|array|min:1',
        'items.*.item_id'    => 'required|exists:items,id',
        'items.*.quantity'   => 'required|integer|min:1',
        'items.*.unit_price' => 'required|numeric|min:0',
    ]);

    // PREVENT DUPLICATE PO FOR SAME PR
    if ($request->purchase_request_id) {

        $existing = RequestOrder::where(
            'purchase_request_id',
            $request->purchase_request_id
        )->exists();

        if ($existing) {
            return response()->json([
                'message' => 'PO already generated for this Purchase Request'
            ], 422);
        }
    }

    DB::transaction(function () use ($request) {

        $totalAmount = collect($request->items)->sum(
            fn ($row) => $row['quantity'] * $row['unit_price']
        );

        $order = RequestOrder::create([
            'purchase_request_id' => $request->purchase_request_id,
            'po_number'     => $request->po_number,
            'supplier_id'   => $request->supplier_id,
            'order_date'    => $request->order_date,
            'total_amount'  => $totalAmount,
            'status'        => 'pending',
        ]);

        foreach ($request->items as $row) {
            RequestOrderItem::create([
                'request_order_id' => $order->id,
                'item_id'          => $row['item_id'],
                'quantity'         => $row['quantity'],
                'unit_cost'        => $row['unit_price'],
                'subtotal'         => $row['quantity'] * $row['unit_price'],
            ]);
        }

        // Mark PR as converted
        if ($request->purchase_request_id) {
            $order->purchaseRequest->update([
                'status' => 'converted'
            ]);
        }
    });

    return response()->json([
        'message' => 'Request order created successfully'
    ]);
}


    /* ===============================
       APPROVE ORDER
       (NO STOCK MOVEMENT)
    =============================== */
    public function approve($id)
    {
        $order = RequestOrder::findOrFail($id);

        if ($order->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending orders can be approved'
            ], 400);
        }

        $order->update([
            'status' => 'approved',
        ]);

        return response()->json([
            'message' => 'Request order approved'
        ]);
    }

    /* ===============================
       RECEIVE GOODS
       (STOCK-IN HAPPENS HERE)
    =============================== */
    public function receive($id)
    {
        DB::transaction(function () use ($id) {

            $order = RequestOrder::with('items')
                ->lockForUpdate()
                ->findOrFail($id);

            if ($order->status !== 'approved') {
                abort(422, 'Order must be approved before receiving');
            }

            foreach ($order->items as $row) {
                StockMovement::create([
                    'item_id'   => $row->item_id,
                    'type'      => 'IN',
                    'quantity'  => $row->quantity,
                    'reference' => $order->po_number,
                    'notes'     => 'Goods received from supplier',
                ]);
            }

            $order->update([
                'status' => 'received'
            ]);
        });

        return response()->json([
            'message' => 'Goods received successfully'
        ]);
    }

    /* ===============================
       SHOW ORDER
    =============================== */
    public function show($id)
    {
        $order = RequestOrder::with([
            'supplier',
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
        $order = RequestOrder::findOrFail($id);

        if ($order->status !== 'pending') {
            return response()->json([
                'message' => 'Cannot edit non-pending order'
            ], 400);
        }

        $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'order_date'  => 'required|date',
        ]);

        $order->update($request->only([
            'supplier_id',
            'order_date'
        ]));

        return response()->json(['message' => 'Order updated']);
    }

    /* ===============================
       CANCEL ORDER
    =============================== */
    public function cancel($id)
    {
        $order = RequestOrder::findOrFail($id);

        if ($order->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending orders can be cancelled'
            ], 400);
        }

        $order->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Order cancelled']);
    }

     /* ===============================
       VERIFY ORDER
    =============================== */
    public function verify($po_number)
    {
    $po = RequestOrder::with(['items.item', 'supplier.items'])
        ->where('po_number', $po_number)
        ->first();

          if (!$po) {
            return response()->json([
                'message' => 'PO not found.'
            ], 404);
        }

          if ($po->status !== 'approved') {
                return response()->json([
                    'message' => 'Only approved request orders can be accepted'
                ], 400);
            }


        if ($po->status === 'invoiced') {
            return response()->json([
                'message' => 'PO already invoiced.'
            ], 400);
        }

      // Calculate remaining quantity per PO item
        $items = $po->items->map(function($item) {
            // Sum of already invoiced quantity
            $invoicedQty = DB::table('invoice_items')
                ->where('request_order_item_id', $item->id)
                ->sum('quantity');

            return [
                'id' => $item->id,
                'item_id' => $item->item_id,
                'name' => $item->item->name,
                'po_quantity' => $item->quantity,
                'unit_price' => $item->unit_cost,
                'invoiced_quantity' => $invoicedQty,
                'remaining_qty' => max($item->quantity - $invoicedQty, 0),
            ];
        });


       

            return response()->json([
            'id' => $po->id,
            'po_number' => $po->po_number,
            'supplier_id' => $po->supplier_id,
            'supplier' => $po->supplier,
            'order_date' => $po->order_date,
            'total_amount' => $po->total_amount,
            'items' => $items,
        ]);
    }
}
