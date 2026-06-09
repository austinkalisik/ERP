<?php

namespace App\Http\Controllers\AIMS;

use App\Http\Controllers\Controller;
use App\Models\AIMS\StocktakeSession;
use App\Models\AIMS\StocktakeLine;
use App\Models\AIMS\Item;
use App\Models\User;
use App\Notifications\AIMS\StocktakeCompletedNotification;
use App\Notifications\AIMS\StocktakeApprovedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StocktakeController extends Controller
{
    // ── GET /api/aims/stocktake ──────────────────────────────────────────────
    public function index(Request $request)
    {
        $query = StocktakeSession::with(['creator', 'approver'])
            ->orderByDesc('count_date');

        if ($request->filled('status'))   $query->where('status',   $request->status);
        if ($request->filled('type'))     $query->where('type',     $request->type);
        if ($request->filled('location')) $query->where('location', $request->location);

        $sessions = $query->paginate(20);

        $sessions->getCollection()->transform(function ($s) {
            $s->variance_summary = $s->varianceSummary();
            return $s;
        });

        return response()->json($sessions);
    }

    // ── POST /api/aims/stocktake ─────────────────────────────────────────────
    public function store(Request $request)
    {
        $data = $request->validate([
            'type'       => 'required|in:full,cyclic',
            'location'   => 'nullable|string|max:255',
            'category'   => 'nullable|string|max:255',
            'count_date' => 'required|date',
            'notes'      => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $session = StocktakeSession::create([
                ...$data,
                'reference'  => StocktakeSession::generateReference(),
                'status'     => 'in_progress',
                'created_by' => Auth::id(),
            ]);

            $itemQuery = Item::query();
            if (!empty($data['location'])) $itemQuery->where('location', $data['location']);
            if (!empty($data['category'])) $itemQuery->where('category', $data['category']);

            $items = $itemQuery->get();

            $lines = $items->map(fn($item) => [
                'stocktake_session_id' => $session->id,
                'item_id'              => $item->id,
                'system_qty'           => $item->current_stock ?? 0,
                'counted_qty'          => null,
                'status'               => 'pending',
                'created_at'           => now(),
                'updated_at'           => now(),
            ]);

            StocktakeLine::insert($lines->toArray());

            DB::commit();
            return response()->json([
                'message' => 'Stocktake session created with ' . $lines->count() . ' items.',
                'data'    => $session->load('lines.item'),
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create session: ' . $e->getMessage()], 500);
        }
    }

    // ── GET /api/aims/stocktake/{id} ─────────────────────────────────────────
    public function show($id)
    {
        $session = StocktakeSession::with([
            'creator',
            'approver',
            'lines.item',
            'lines.counter',
        ])->findOrFail($id);

        $session->variance_summary = $session->varianceSummary();

        return response()->json($session);
    }

    // ── POST /api/aims/stocktake/{id}/count ──────────────────────────────────
    public function submitCounts(Request $request, $id)
    {
        $session = StocktakeSession::findOrFail($id);

        if (!in_array($session->status, ['in_progress', 'draft'])) {
            return response()->json(['message' => 'Session is not open for counting.'], 422);
        }

        $request->validate([
            'lines'                   => 'required|array|min:1',
            'lines.*.line_id'         => 'required|exists:stocktake_lines,id',
            'lines.*.counted_qty'     => 'required|numeric|min:0',
            'lines.*.variance_reason' => 'nullable|string|max:500',
        ]);

        foreach ($request->lines as $entry) {
            StocktakeLine::where('id', $entry['line_id'])
                ->where('stocktake_session_id', $id)
                ->update([
                    'counted_qty'     => $entry['counted_qty'],
                    'variance_reason' => $entry['variance_reason'] ?? null,
                    'status'          => 'counted',
                    'counted_by'      => Auth::id(),
                    'counted_at'      => now(),
                ]);
        }

        return response()->json(['message' => 'Counts saved.']);
    }

    // ── POST /api/aims/stocktake/{id}/complete ───────────────────────────────
    public function complete($id)
    {
        $session   = StocktakeSession::findOrFail($id);
        $uncounted = $session->lines()->whereNull('counted_qty')->count();

        if ($uncounted > 0) {
            return response()->json([
                'message' => "{$uncounted} item(s) still uncounted. Count all items before completing.",
            ], 422);
        }

        $session->update(['status' => 'completed']);

        // ── Notify managers that a stocktake is ready for review ─────────────
        User::whereIn('role', ['system_admin', 'aims_manager'])
            ->get()
            ->each(fn($u) => $u->notify(new StocktakeCompletedNotification($session)));

        return response()->json(['message' => 'Session marked as completed.']);
    }

    // ── POST /api/aims/stocktake/{id}/approve ────────────────────────────────
    public function approve($id)
    {
        $session = StocktakeSession::with('lines.item')->findOrFail($id);

        if ($session->status !== 'completed') {
            return response()->json(['message' => 'Session must be completed before approval.'], 422);
        }

        DB::beginTransaction();
        try {
            foreach ($session->lines as $line) {
                $variance = (float) $line->counted_qty - (float) $line->system_qty;
                if ($variance != 0 && $line->item) {
                    $line->item->increment('current_stock', $variance);
                }
                $line->update(['status' => 'adjusted']);
            }

            $session->update([
                'status'      => 'completed',
                'approved_by' => Auth::id(),
                'approved_at' => now(),
            ]);

            DB::commit();

            // ── Notify managers that inventory has been adjusted ──────────────
            User::whereIn('role', ['system_admin', 'aims_manager'])
                ->get()
                ->each(fn($u) => $u->notify(new StocktakeApprovedNotification($session)));

            return response()->json(['message' => 'Stocktake approved and inventory adjusted.']);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Approval failed: ' . $e->getMessage()], 500);
        }
    }

    // ── GET /api/aims/stocktake/{id}/variance-report ─────────────────────────
    public function varianceReport($id)
    {
        $session = StocktakeSession::with([
            'creator',
            'approver',
            'lines' => fn($q) => $q->with(['item', 'counter'])
                ->whereNotNull('counted_qty')
                ->orderByRaw('ABS(counted_qty - system_qty) DESC'),
        ])->findOrFail($id);

        $lines = $session->lines->map(fn($line) => [
            'id'              => $line->id,
            'item_code'       => $line->item->sku      ?? '—',
            'item_name'       => $line->item->name     ?? '—',
            'category'        => $line->item->category ?? '—',
            'unit'            => $line->item->unit     ?? '—',
            'system_qty'      => $line->system_qty,
            'counted_qty'     => $line->counted_qty,
            'variance'        => $line->variance,
            'variance_pct'    => $line->system_qty > 0
                ? round(($line->variance / $line->system_qty) * 100, 2)
                : null,
            'variance_reason' => $line->variance_reason,
            'status'          => $line->status,
            'counted_by'      => $line->counter->name ?? '—',
            'counted_at'      => $line->counted_at?->format('d/m/Y H:i'),
        ]);

        $summary = $session->varianceSummary();

        return response()->json([
            'session' => [
                'id'          => $session->id,
                'reference'   => $session->reference,
                'type'        => $session->type,
                'count_date'  => $session->count_date->format('d/m/Y'),
                'status'      => $session->status,
                'location'    => $session->location,
                'category'    => $session->category,
                'created_by'  => $session->creator->name  ?? '—',
                'approved_by' => $session->approver->name ?? null,
                'approved_at' => $session->approved_at?->format('d/m/Y H:i'),
            ],
            'summary' => $summary,
            'lines'   => $lines,
        ]);
    }

    // ── DELETE /api/aims/stocktake/{id} ──────────────────────────────────────
    public function destroy($id)
    {
        $session = StocktakeSession::findOrFail($id);
        if ($session->status === 'completed' && $session->approved_at) {
            return response()->json(['message' => 'Cannot delete an approved stocktake.'], 422);
        }
        $session->delete();
        return response()->json(['message' => 'Stocktake session deleted.']);
    }
}