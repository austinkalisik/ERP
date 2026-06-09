<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\StockMovement;
use App\Services\StockInventoryService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class StockMovementController extends Controller
{
    private const REPORT_TIMEZONE = 'Pacific/Port_Moresby';

    protected StockInventoryService $service;

    public function __construct(StockInventoryService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        $perPage = max(5, min((int) $request->integer('per_page', 15), 100));

        $query = StockMovement::with(['item', 'supplier', 'user'])->latest();

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('item_id')) {
            $query->where('item_id', $request->item_id);
        }

        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $this->startOfReportDay((string) $request->date_from));
        }

        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $this->endOfReportDay((string) $request->date_to));
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->search);

            $query->where(function ($q) use ($search) {
                $q->where('reference_no', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('item', function ($sub) use ($search) {
                        $sub->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%")
                            ->orWhere('asset_tag', 'like', "%{$search}%")
                            ->orWhere('serial_number', 'like', "%{$search}%");
                    });
            });
        }

        return response()->json($query->paginate($perPage)->withQueryString());
    }

    public function itemHistory(Request $request, Item $item)
    {
        $perPage = max(5, min((int) $request->integer('per_page', 15), 100));

        $query = $item->stockMovements()
            ->with(['user', 'supplier'])
            ->latest();

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        return response()->json($query->paginate($perPage)->withQueryString());
    }

    public function stockIn(Request $request, Item $item)
    {
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
            'reference_no' => ['nullable', 'string', 'max:100'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $movement = $this->service->stockIn(
                $item,
                $validated['quantity'],
                $validated['reference_no'] ?? null,
                $validated['supplier_id'] ?? null,
                $validated['notes'] ?? null
            );

            return response()->json([
                'message' => 'Stock in recorded successfully',
                'movement' => $movement,
                'item' => $item->fresh()->load(['category', 'supplier']),
            ], Response::HTTP_CREATED);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
    }

    public function stockOut(Request $request, Item $item)
    {
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
            'reference_no' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $movement = $this->service->stockOut(
                $item,
                $validated['quantity'],
                $validated['reference_no'] ?? null,
                $validated['notes'] ?? null
            );

            return response()->json([
                'message' => 'Stock out recorded successfully',
                'movement' => $movement,
                'item' => $item->fresh()->load(['category', 'supplier']),
            ], Response::HTTP_CREATED);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
    }

    public function adjustment(Request $request, Item $item)
    {
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'not_in:0'],
            'reference_no' => ['nullable', 'string', 'max:100'],
            'notes' => ['required', 'string', 'max:500'],
        ]);

        try {
            $movement = $this->service->stockAdjustment(
                $item,
                $validated['quantity'],
                $validated['reference_no'] ?? null,
                $validated['notes']
            );

            return response()->json([
                'message' => 'Stock adjustment recorded successfully',
                'movement' => $movement,
                'item' => $item->fresh()->load(['category', 'supplier']),
            ], Response::HTTP_CREATED);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
    }

    public function stockReturn(Request $request, Item $item)
    {
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
            'reference_no' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $movement = $this->service->stockReturn(
                $item,
                $validated['quantity'],
                $validated['reference_no'] ?? null,
                $validated['notes'] ?? null
            );

            return response()->json([
                'message' => 'Stock return recorded successfully',
                'movement' => $movement,
                'item' => $item->fresh()->load(['category', 'supplier']),
            ], Response::HTTP_CREATED);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
    }

    public function types()
    {
        return response()->json([
            'types' => StockMovement::TYPES,
        ]);
    }

    protected function startOfReportDay(string $date): CarbonImmutable
    {
        return CarbonImmutable::parse($date, self::REPORT_TIMEZONE)
            ->startOfDay()
            ->utc();
    }

    protected function endOfReportDay(string $date): CarbonImmutable
    {
        return CarbonImmutable::parse($date, self::REPORT_TIMEZONE)
            ->endOfDay()
            ->utc();
    }
}
