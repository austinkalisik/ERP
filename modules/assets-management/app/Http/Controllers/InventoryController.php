<?php

namespace App\Http\Controllers;

use App\Models\AssetLog;
use App\Models\Item;
use App\Services\StockInventoryService;
use App\Services\SystemNotificationService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class InventoryController extends Controller
{
    protected StockInventoryService $stockInventoryService;

    protected SystemNotificationService $notificationService;

    public function __construct(
        StockInventoryService $stockInventoryService,
        SystemNotificationService $notificationService
    ) {
        $this->stockInventoryService = $stockInventoryService;
        $this->notificationService = $notificationService;
    }

    protected function getIntSetting(string $key, int $default): int
    {
        $value = DB::table('settings')->where('key', $key)->value('value');

        if (! is_numeric($value)) {
            return $default;
        }

        return (int) $value;
    }

    protected function lowStockQuery(int $defaultThreshold): Builder
    {
        return Item::query()
            ->where('quantity', '>', 0)
            ->where(function ($query) use ($defaultThreshold) {
                $query->where(function ($sub) {
                    $sub->whereNotNull('reorder_level')
                        ->whereColumn('quantity', '<=', 'reorder_level');
                })->orWhere(function ($sub) use ($defaultThreshold) {
                    $sub->whereNull('reorder_level')
                        ->where('quantity', '<=', $defaultThreshold);
                });
            });
    }

    public function index(Request $request): JsonResponse
    {
        $lowStockThreshold = $this->getIntSetting('low_stock_threshold', 5);
        $perPage = max(5, min((int) $request->integer('per_page', 10), 50));

        $query = Item::with(['category', 'supplier'])->orderBy('name');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('asset_tag', 'like', "%{$search}%")
                    ->orWhere('serial_number', 'like', "%{$search}%")
                    ->orWhereHas('category', fn ($sub) => $sub->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('supplier', fn ($sub) => $sub->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('stock')) {
            $stock = $request->string('stock')->toString();

            if ($stock === 'out') {
                $query->where('quantity', 0);
            } elseif ($stock === 'low') {
                $query->whereIn('id', $this->lowStockQuery($lowStockThreshold)->select('id'));
            } elseif ($stock === 'available') {
                $query->where('quantity', '>', 0)
                    ->whereNotIn('id', $this->lowStockQuery($lowStockThreshold)->select('id'));
            }
        }

        $items = $query->paginate($perPage)->withQueryString();

        return response()->json(array_merge(
            $items->toArray(),
            [
                'summary' => [
                    'totalItems' => Item::count(),
                    'lowStockCount' => $this->lowStockQuery($lowStockThreshold)->count(),
                    'outOfStockCount' => Item::where('quantity', 0)->count(),
                ],
            ]
        ));
    }

    public function stockIn(Request $request, Item $item): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
            'reference_no' => ['nullable', 'string', 'max:100'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $movement = $this->stockInventoryService->stockIn(
                $item,
                (int) $validated['quantity'],
                $validated['reference_no'] ?? null,
                $validated['supplier_id'] ?? null,
                $validated['notes'] ?? null
            );

            $updatedItem = $item->refresh()->load(['category', 'supplier']);

            AssetLog::log(
                $item->id,
                AssetLog::ACTION_STOCK_IN,
                "Stock in: +{$validated['quantity']}"
            );

            return response()->json([
                'message' => 'Stock added successfully',
                'movement' => $movement,
                'item' => $updatedItem,
            ]);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function stockOut(Request $request, Item $item): JsonResponse
    {
        $lowStockThreshold = $this->getIntSetting('low_stock_threshold', 5);

        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
            'reference_no' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $movement = $this->stockInventoryService->stockOut(
                $item,
                (int) $validated['quantity'],
                $validated['reference_no'] ?? null,
                $validated['notes'] ?? null
            );

            $updatedItem = $item->refresh()->load(['category', 'supplier']);

            AssetLog::log(
                $item->id,
                AssetLog::ACTION_STOCK_OUT,
                "Stock out: -{$validated['quantity']}"
            );

            if ((int) $updatedItem->quantity > 0 && $updatedItem->isLowStock($lowStockThreshold)) {
                $this->notifyAdmins(
                    'low_stock',
                    'Low Stock Alert',
                    "{$updatedItem->name} is running low (Qty: {$updatedItem->quantity})",
                    '/inventory',
                    'item',
                    $updatedItem->id
                );
            }

            if ((int) $updatedItem->quantity === 0) {
                $this->notifyAdmins(
                    'inventory_alert',
                    'Out of Stock Alert',
                    "{$updatedItem->name} is now out of stock.",
                    '/inventory',
                    'item',
                    $updatedItem->id
                );
            }

            return response()->json([
                'message' => 'Stock removed successfully',
                'movement' => $movement,
                'item' => $updatedItem,
            ]);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    protected function notifyAdmins(
        string $type,
        string $title,
        string $message,
        string $url,
        ?string $sourceType = null,
        ?int $sourceId = null
    ): void {
        $this->notificationService->notifyAdmins($type, $title, $message, $url, $sourceType, $sourceId);
    }
}
