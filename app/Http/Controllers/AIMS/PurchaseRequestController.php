<?php

namespace App\Http\Controllers\AIMS;

use App\Http\Controllers\Controller;
use App\Models\AIMS\PurchaseRequest;
use App\Models\AIMS\PurchaseRequestItem;
use App\Models\User;
use App\Notifications\AIMS\PurchaseRequestNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class PurchaseRequestController extends Controller
{
    public function latest()
    {
        $last = PurchaseRequest::latest('id')->first();
        return response()->json([
            'last_number' => $last ? intval(substr($last->pr_number, -4)) : 0
        ]);
    }

    public function index()
    {
        return PurchaseRequest::with(['items.item', 'requester', 'approver', 'requestOrders'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function show($id)
    {
        $pr = PurchaseRequest::with(['items.item', 'requester', 'approver', 'requestOrders'])->findOrFail($id);
        return response()->json(['data' => $pr]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'pr_number'        => 'required|string|unique:purchase_requests,pr_number',
            'request_date'     => 'required|date',
            'notes'            => 'nullable|string',
            'items'            => 'required|array|min:1',
            'items.*.item_id'  => 'required|exists:items,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        DB::transaction(function () use ($validated) {
            $pr = PurchaseRequest::create([
                'pr_number'    => $validated['pr_number'],
                'request_date' => $validated['request_date'],
                'notes'        => $validated['notes'] ?? null,
                'status'       => 'pending',
                'requested_by' => Auth::id(),
            ]);

            foreach ($validated['items'] as $item) {
                PurchaseRequestItem::create([
                    'purchase_request_id' => $pr->id,
                    'item_id'             => $item['item_id'],
                    'quantity'            => $item['quantity'],
                ]);
            }

            // ── Notify aims_manager and system_admin of new PR ────────────────
            User::whereIn('role', ['system_admin', 'aims_manager'])
                ->where('id', '!=', Auth::id())
                ->get()
                ->each(fn($u) => $u->notify(new PurchaseRequestNotification($pr, 'created')));
        });

        return response()->json(['message' => 'Purchase Request created successfully'], 201);
    }

    public function approve($id)
    {
        $pr = PurchaseRequest::with('requester')->findOrFail($id);

        if ($pr->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be approved'], 422);
        }

        $pr->update([
            'status'      => 'approved',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        // ── Notify the requester their PR was approved ────────────────────────
        $pr->requester?->notify(new PurchaseRequestNotification($pr, 'approved'));

        return response()->json(['message' => 'Purchase Request approved']);
    }

    public function reject($id)
    {
        $pr = PurchaseRequest::with('requester')->findOrFail($id);

        if ($pr->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be rejected'], 422);
        }

        $pr->update(['status' => 'rejected']);

        // ── Notify the requester their PR was rejected ────────────────────────
        $pr->requester?->notify(new PurchaseRequestNotification($pr, 'rejected'));

        return response()->json(['message' => 'Purchase Request rejected']);
    }
}