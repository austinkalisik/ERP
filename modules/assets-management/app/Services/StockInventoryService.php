<?php

namespace App\Services;

use App\Models\Item;
use App\Models\StockMovement;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class StockInventoryService
{
    public function stockIn(
        Item $item,
        int $quantity,
        ?string $reference_no = null,
        ?int $supplier_id = null,
        ?string $notes = null
    ): StockMovement {
        if ($quantity <= 0) {
            throw new InvalidArgumentException('Stock in quantity must be greater than 0.');
        }

        return DB::transaction(function () use ($item, $quantity, $reference_no, $supplier_id, $notes) {
            $lockedItem = Item::query()->lockForUpdate()->findOrFail($item->id);

            $movement = StockMovement::create([
                'item_id' => $lockedItem->id,
                'type' => StockMovement::TYPE_IN,
                'quantity' => $quantity,
                'reference_no' => $this->normalizeString($reference_no),
                'supplier_id' => $supplier_id ?: $lockedItem->supplier_id,
                'notes' => $this->normalizeString($notes),
                'user_id' => Auth::id(),
            ]);

            $lockedItem->increment('quantity', $quantity);
            $lockedItem->refresh();
            $this->syncItemStatus($lockedItem);

            return $movement->fresh()->load(['item.category', 'item.supplier', 'supplier', 'user']);
        });
    }

    public function stockOut(
        Item $item,
        int $quantity,
        ?string $reference_no = null,
        ?string $notes = null
    ): StockMovement {
        if ($quantity <= 0) {
            throw new InvalidArgumentException('Stock out quantity must be greater than 0.');
        }

        return DB::transaction(function () use ($item, $quantity, $reference_no, $notes) {
            $lockedItem = Item::query()->lockForUpdate()->findOrFail($item->id);

            if ((int) $lockedItem->quantity < $quantity) {
                throw new InvalidArgumentException(
                    "Insufficient stock. Available: {$lockedItem->quantity}, Requested: {$quantity}."
                );
            }

            $movement = StockMovement::create([
                'item_id' => $lockedItem->id,
                'type' => StockMovement::TYPE_OUT,
                'quantity' => $quantity,
                'reference_no' => $this->normalizeString($reference_no),
                'notes' => $this->normalizeString($notes),
                'user_id' => Auth::id(),
            ]);

            $lockedItem->decrement('quantity', $quantity);
            $lockedItem->refresh();
            $this->syncItemStatus($lockedItem);

            return $movement->fresh()->load(['item.category', 'item.supplier', 'user']);
        });
    }

    public function stockAdjustment(
        Item $item,
        int $quantity,
        ?string $reference_no = null,
        ?string $notes = null
    ): StockMovement {
        if ($quantity === 0) {
            throw new InvalidArgumentException('Adjustment quantity cannot be 0.');
        }

        if (blank($notes)) {
            throw new InvalidArgumentException('Notes/reason is required for stock adjustments.');
        }

        return DB::transaction(function () use ($item, $quantity, $reference_no, $notes) {
            $lockedItem = Item::query()->lockForUpdate()->findOrFail($item->id);

            if ($quantity < 0 && abs($quantity) > (int) $lockedItem->quantity) {
                throw new InvalidArgumentException(
                    "Adjustment exceeds available stock. Available: {$lockedItem->quantity}, Requested reduction: ".abs($quantity).'.'
                );
            }

            $movement = StockMovement::create([
                'item_id' => $lockedItem->id,
                'type' => StockMovement::TYPE_ADJUSTMENT,
                'quantity' => $quantity,
                'reference_no' => $this->normalizeString($reference_no),
                'notes' => trim((string) $notes),
                'user_id' => Auth::id(),
            ]);

            $newQuantity = (int) $lockedItem->quantity + $quantity;

            if ($newQuantity < 0) {
                $newQuantity = 0;
            }

            $lockedItem->update([
                'quantity' => $newQuantity,
            ]);

            $lockedItem->refresh();
            $this->syncItemStatus($lockedItem);

            return $movement->fresh()->load(['item.category', 'item.supplier', 'user']);
        });
    }

    public function stockReturn(
        Item $item,
        int $quantity,
        ?string $reference_no = null,
        ?string $notes = null
    ): StockMovement {
        if ($quantity <= 0) {
            throw new InvalidArgumentException('Return quantity must be greater than 0.');
        }

        return DB::transaction(function () use ($item, $quantity, $reference_no, $notes) {
            $lockedItem = Item::query()->lockForUpdate()->findOrFail($item->id);

            $movement = StockMovement::create([
                'item_id' => $lockedItem->id,
                'type' => StockMovement::TYPE_RETURN,
                'quantity' => $quantity,
                'reference_no' => $this->normalizeString($reference_no),
                'notes' => $this->normalizeString($notes),
                'user_id' => Auth::id(),
            ]);

            $lockedItem->increment('quantity', $quantity);
            $lockedItem->refresh();
            $this->syncItemStatus($lockedItem);

            return $movement->fresh()->load(['item.category', 'item.supplier', 'user']);
        });
    }

    public function getMovementHistory(Item $item, int $limit = 50)
    {
        return $item->stockMovements()
            ->with(['user', 'supplier'])
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    public function getLowStockItems()
    {
        return Item::query()
            ->where('quantity', '>', 0)
            ->where(function ($query) {
                $query->whereColumn('quantity', '<=', 'reorder_level')
                    ->orWhere(function ($sub) {
                        $sub->whereNull('reorder_level')
                            ->where('quantity', '<=', 5);
                    });
            })
            ->with(['category', 'supplier']);
    }

    public function getOutOfStockItems()
    {
        return Item::query()
            ->where('quantity', 0)
            ->with(['category', 'supplier']);
    }

    public function getInventorySummary(): array
    {
        return [
            'total_items' => Item::count(),
            'total_quantity' => (int) Item::sum('quantity'),
            'low_stock_count' => $this->getLowStockItems()->count(),
            'out_of_stock_count' => $this->getOutOfStockItems()->count(),
            'total_value' => (float) (Item::query()
                ->leftJoinSub(
                    DB::table('assignments')
                        ->selectRaw('item_id, COALESCE(SUM(quantity), 0) as active_quantity')
                        ->whereNull('returned_at')
                        ->groupBy('item_id'),
                    'active_assignments',
                    'items.id',
                    '=',
                    'active_assignments.item_id'
                )
                ->selectRaw('COALESCE(SUM((items.quantity + COALESCE(active_assignments.active_quantity, 0)) * items.unit_cost), 0) as total')
                ->value('total') ?? 0),
        ];
    }

    protected function syncItemStatus(Item $item): void
    {
        if (method_exists($item, 'syncAutomatedStatus')) {
            $item->syncAutomatedStatus();
            $item->refresh();
        }
    }

    protected function normalizeString(?string $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
