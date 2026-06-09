<?php

namespace App\Http\Controllers;

use App\Models\AssetLog;
use App\Models\Item;
use App\Models\StockMovement;
use App\Services\StockInventoryService;
use App\Services\SystemNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ItemController extends Controller
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

    public function index(Request $request)
    {
        $perPage = max(5, min((int) $request->integer('per_page', 10), 50));
        $defaultReorderLevel = $this->getIntSetting('low_stock_threshold', 5);

        $query = $this->financialItemQuery()->latest();

        if ($request->filled('search')) {
            $search = trim((string) $request->search);

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('asset_tag', 'like', "%{$search}%")
                    ->orWhere('serial_number', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhereHas('category', function ($sub) use ($search) {
                        $sub->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('supplier', function ($sub) use ($search) {
                        $sub->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('stock')) {
            if ($request->stock === 'out') {
                $query->where('quantity', 0);
            } elseif ($request->stock === 'low') {
                $query->whereIn('id', $this->lowStockQuery($defaultReorderLevel)->select('id'));
            } elseif ($request->stock === 'available') {
                $query->where('quantity', '>', 0)
                    ->whereNotIn('id', $this->lowStockQuery($defaultReorderLevel)->select('id'));
            }
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        return response()->json($query->paginate($perPage)->withQueryString());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['nullable', 'string', 'max:255'],
            'brand' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category_id' => ['required', 'exists:categories,id'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'asset_tag' => ['nullable', 'string', 'max:255'],
            'serial_number' => ['nullable', 'string', 'max:255'],
            'quantity' => ['required', 'integer', 'min:1'],
            'unit_of_measurement' => ['nullable', 'string', 'max:50'],
            'reorder_level' => ['nullable', 'integer', 'min:0'],
            'unit_cost' => ['nullable', 'numeric', 'min:0'],
            'is_depreciable' => ['nullable', 'boolean'],
            'depreciation_method' => ['nullable', 'in:none,straight_line'],
            'useful_life_years' => ['nullable', 'integer', 'min:1', 'max:50'],
            'salvage_value' => ['nullable', 'numeric', 'min:0'],
            'depreciation_start_date' => ['nullable', 'date'],
            'status' => ['required', 'in:available,maintenance,lost,retired'],
            'location' => ['nullable', 'string', 'max:255'],
            'purchase_date' => ['nullable', 'date'],
        ]);

        $payload = $this->normalizePayload($validated, true);
        $initialQuantity = (int) $payload['quantity'];

        if ($payload['serial_number'] && $initialQuantity !== 1) {
            throw ValidationException::withMessages([
                'quantity' => 'Serialized assets with a serial number are tracked one-by-one, so initial quantity must be 1.',
            ]);
        }

        $result = DB::transaction(function () use ($payload, $initialQuantity) {
            if ($payload['asset_tag'] && Item::query()->lockForUpdate()->where('asset_tag', $payload['asset_tag'])->exists()) {
                throw ValidationException::withMessages([
                    'asset_tag' => 'Asset tag already exists.',
                ]);
            }

            if ($payload['serial_number'] && Item::query()->lockForUpdate()->where('serial_number', $payload['serial_number'])->exists()) {
                throw ValidationException::withMessages([
                    'serial_number' => 'Serial number already exists.',
                ]);
            }

            $existing = $this->findExistingStockItem($payload);

            if ($existing) {
                if (blank($existing->sku) && filled($payload['sku'])) {
                    $skuConflict = Item::query()
                        ->lockForUpdate()
                        ->where('sku', $payload['sku'])
                        ->where('id', '!=', $existing->id)
                        ->exists();

                    if ($skuConflict) {
                        throw ValidationException::withMessages([
                            'sku' => 'SKU already exists.',
                        ]);
                    }

                    $existing->sku = $payload['sku'];
                }

                if (blank($existing->description) && filled($payload['description'])) {
                    $existing->description = $payload['description'];
                }

                if (blank($existing->location) && filled($payload['location'])) {
                    $existing->location = $payload['location'];
                }

                if ((is_null($existing->unit_cost) || $existing->unit_cost === '') && $payload['unit_cost'] !== null) {
                    $existing->unit_cost = $payload['unit_cost'];
                }

                if ((is_null($existing->reorder_level) || (int) $existing->reorder_level === 0) && isset($payload['reorder_level'])) {
                    $existing->reorder_level = $payload['reorder_level'];
                }

                $existing->save();

                $this->stockInventoryService->stockIn(
                    $existing,
                    $initialQuantity,
                    'ITEM-MERGE-'.$existing->id,
                    $payload['supplier_id'],
                    'Stock received while saving a matching asset item.'
                );

                $existing->refresh()->load(['category', 'supplier']);

                AssetLog::log(
                    $existing->id,
                    AssetLog::ACTION_UPDATED,
                    $existing->name.' quantity increased by '.$initialQuantity.' by '.(Auth::user()?->name ?? 'System')
                );

                $this->notifyAdmins(
                    'asset_updated',
                    'Asset Quantity Updated',
                    "Existing asset '{$existing->name}' found. Quantity increased by {$initialQuantity}.",
                    '/items',
                    'item',
                    $existing->id
                );

                return [
                    'status' => 200,
                    'body' => [
                        'message' => 'Existing asset found. Quantity increased successfully.',
                        'item' => $existing,
                    ],
                ];
            }

            if ($payload['sku'] && Item::query()->lockForUpdate()->where('sku', $payload['sku'])->exists()) {
                throw ValidationException::withMessages([
                    'sku' => 'SKU already exists.',
                ]);
            }

            $itemData = $payload;
            $itemData['quantity'] = 0;

            $item = Item::create($itemData);

            $this->stockInventoryService->stockIn(
                $item,
                $initialQuantity,
                'ITEM-OPEN-'.$item->id,
                $payload['supplier_id'],
                'Initial stock received during asset creation.'
            );

            $item->refresh()->load(['category', 'supplier']);

            AssetLog::log(
                $item->id,
                AssetLog::ACTION_CREATED,
                $item->name.' created by '.(Auth::user()?->name ?? 'System')
            );

            $this->notifyAdmins(
                'asset_created',
                'Asset Created',
                "Asset '{$item->name}' was created successfully.",
                '/items',
                'item',
                $item->id
            );

            $reorderLevel = $item->reorder_level ?? 5;

            if ((int) $item->quantity <= $reorderLevel) {
                $this->notifyAdmins(
                    'low_stock',
                    'Low Stock Alert',
                    "Asset '{$item->name}' is low in stock with quantity {$item->quantity}.",
                    '/inventory',
                    'item',
                    $item->id
                );
            }

            return [
                'status' => 201,
                'body' => $item,
            ];
        });

        return response()->json($result['body'], $result['status']);
    }

    public function show(Item $item)
    {
        $item->load([
            'category',
            'supplier',
            'assignments.assignedDepartment',
        ]);
        $item->loadSum('activeAssignments as active_assigned_quantity', 'quantity');

        return response()->json($item);
    }

    public function depreciationReport(Request $request)
    {
        $query = $this->financialItemQuery()
            ->where('is_depreciable', true)
            ->orderBy('name');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->search);

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('asset_tag', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhereHas('category', function ($sub) use ($search) {
                        $sub->where('name', 'like', "%{$search}%");
                    });
            });
        }

        return response()->json([
            'data' => $query->get(),
        ]);
    }

    public function update(Request $request, Item $item)
    {
        $oldStatus = $item->status;

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['nullable', 'string', 'max:255', 'unique:items,sku,'.$item->id],
            'brand' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category_id' => ['required', 'exists:categories,id'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'asset_tag' => ['nullable', 'string', 'max:255', 'unique:items,asset_tag,'.$item->id],
            'serial_number' => ['nullable', 'string', 'max:255', 'unique:items,serial_number,'.$item->id],
            'quantity' => ['nullable', 'integer', 'min:0'],
            'unit_of_measurement' => ['nullable', 'string', 'max:50'],
            'reorder_level' => ['nullable', 'integer', 'min:0'],
            'unit_cost' => ['nullable', 'numeric', 'min:0'],
            'is_depreciable' => ['nullable', 'boolean'],
            'depreciation_method' => ['nullable', 'in:none,straight_line'],
            'useful_life_years' => ['nullable', 'integer', 'min:1', 'max:50'],
            'salvage_value' => ['nullable', 'numeric', 'min:0'],
            'depreciation_start_date' => ['nullable', 'date'],
            'status' => ['required', 'in:available,maintenance,lost,retired'],
            'location' => ['nullable', 'string', 'max:255'],
            'purchase_date' => ['nullable', 'date'],
        ]);

        $payload = $this->normalizePayload($validated, false);
        $desiredQuantity = array_key_exists('quantity', $validated)
            ? (int) $validated['quantity']
            : (int) $item->quantity;
        $quantityChange = $desiredQuantity - (int) $item->quantity;

        if ($payload['serial_number'] && $desiredQuantity !== 1) {
            throw ValidationException::withMessages([
                'serial_number' => 'Serial Number is only allowed when the quantity is 1.',
            ]);
        }

        if ($quantityChange < 0 && abs($quantityChange) > (int) $item->quantity) {
            throw ValidationException::withMessages([
                'quantity' => "Quantity cannot be reduced below zero. Current quantity is {$item->quantity}.",
            ]);
        }

        DB::transaction(function () use ($item, $payload, $quantityChange) {
            $item->update($payload);

            if ($quantityChange !== 0) {
                $this->stockInventoryService->stockAdjustment(
                    $item,
                    $quantityChange,
                    'EDIT-'.$item->id,
                    'Quantity updated from inventory edit form.'
                );
            }
        });

        if (method_exists($item, 'syncAutomatedStatus')) {
            $item->refresh();
            $item->syncAutomatedStatus();
        }

        $item->refresh()->load(['category', 'supplier']);
        $item->loadSum('activeAssignments as active_assigned_quantity', 'quantity');

        AssetLog::log(
            $item->id,
            AssetLog::ACTION_UPDATED,
            'Asset details updated by '.(Auth::user()?->name ?? 'System')
        );

        $this->notifyAdmins(
            'asset_updated',
            'Asset Updated',
            "Asset '{$item->name}' was updated.",
            '/items',
            'item',
            $item->id
        );

        if ($item->status === Item::STATUS_MAINTENANCE && $oldStatus !== Item::STATUS_MAINTENANCE) {
            $this->notifyAdmins(
                'maintenance_due',
                'Maintenance Alert',
                "Asset '{$item->name}' has been moved to maintenance.",
                '/items',
                'item',
                $item->id
            );
        }

        return response()->json($item);
    }

    public function retire(Request $request, Item $item)
    {
        $validated = $request->validate([
            'disposal_value' => ['nullable', 'numeric', 'min:0'],
            'disposal_reason' => ['required', 'string', 'max:1000'],
            'retired_at' => ['nullable', 'date'],
        ]);

        if ($item->activeAssignments()->exists()) {
            return response()->json([
                'message' => 'Return all active assignments before retiring or disposing this asset.',
            ], 422);
        }

        if ($item->isRetired()) {
            return response()->json([
                'message' => 'This asset is already retired.',
            ], 422);
        }

        $quantityToRetire = max(0, (int) $item->quantity);
        $reason = trim((string) $validated['disposal_reason']);

        DB::transaction(function () use ($item, $validated, $quantityToRetire, $reason) {
            if ($quantityToRetire > 0) {
                $this->stockInventoryService->stockAdjustment(
                    $item,
                    -$quantityToRetire,
                    'RETIRE-'.$item->id,
                    'Asset retired/disposed: '.$reason
                );
            }

            $item->refresh();
            $item->update([
                'status' => Item::STATUS_RETIRED,
                'retired_at' => $validated['retired_at'] ?? now(),
                'disposal_value' => array_key_exists('disposal_value', $validated) && $validated['disposal_value'] !== null
                    ? (float) $validated['disposal_value']
                    : null,
                'disposal_reason' => $reason,
            ]);
        });

        AssetLog::log(
            $item->id,
            AssetLog::ACTION_RETIRED,
            "Asset retired/disposed. Quantity retired: {$quantityToRetire}. Reason: {$reason}"
        );

        $this->notifyAdmins(
            'asset_retired',
            'Asset Retired',
            "Asset '{$item->name}' was retired/disposed.",
            '/inventory',
            'item',
            $item->id
        );

        $item = $item->fresh(['category', 'supplier']);
        $item->loadSum('activeAssignments as active_assigned_quantity', 'quantity');

        return response()->json([
            'message' => 'Asset retired/disposed successfully.',
            'item' => $item,
        ]);
    }

    public function destroy(Item $item)
    {
        if ($item->activeAssignments()->exists()) {
            return response()->json(['message' => 'Cannot delete an item that is currently issued out. Mark active assignments as returned first.'], 422);
        }

        if ($item->assignments()->exists() || $this->hasProtectedDeleteHistory($item)) {
            return response()->json(['message' => 'Cannot delete this item because it has assignment, stock movement, or audit history. Retire it instead to preserve records.'], 422);
        }

        $itemName = $item->name;
        $itemId = $item->id;

        DB::transaction(function () use ($item) {
            $item->loadMissing(['stockMovements', 'assetLogs']);

            $item->stockMovements()->delete();
            $item->assetLogs()->delete();
            $item->delete();
        });

        $this->notifyAdmins(
            'asset_deleted',
            'Asset Deleted',
            "Asset '{$itemName}' was deleted.",
            '/items',
            'item',
            $itemId
        );

        return response()->json(['message' => 'Item deleted successfully']);
    }

    protected function hasProtectedDeleteHistory(Item $item): bool
    {
        $item->loadMissing(['stockMovements', 'assetLogs']);

        $hasProtectedStockMovements = $item->stockMovements->contains(function (StockMovement $movement) use ($item) {
            return ! $this->isInitialStockMovement($item, $movement);
        });

        if ($hasProtectedStockMovements) {
            return true;
        }

        return $item->assetLogs->contains(function (AssetLog $log) {
            return ! in_array($log->action, [AssetLog::ACTION_CREATED, AssetLog::ACTION_UPDATED], true);
        });
    }

    protected function isInitialStockMovement(Item $item, StockMovement $movement): bool
    {
        return $movement->type === StockMovement::TYPE_IN
            && $movement->reference_no === 'ITEM-OPEN-'.$item->id;
    }

    protected function findExistingStockItem(array $payload): ?Item
    {
        if ($payload['asset_tag'] || $payload['serial_number'] || ! empty($payload['is_depreciable'])) {
            return null;
        }

        $name = mb_strtolower(trim((string) $payload['name']));
        $brand = $payload['brand'] ? mb_strtolower(trim((string) $payload['brand'])) : null;

        return Item::query()
            ->lockForUpdate()
            ->whereNull('asset_tag')
            ->whereNull('serial_number')
            ->where('status', Item::STATUS_AVAILABLE)
            ->where('category_id', $payload['category_id'])
            ->whereRaw('LOWER(TRIM(name)) = ?', [$name])
            ->when(
                $brand !== null,
                fn ($query) => $query->whereRaw('LOWER(TRIM(brand)) = ?', [$brand]),
                fn ($query) => $query->where(function ($sub) {
                    $sub->whereNull('brand')->orWhereRaw("TRIM(brand) = ''");
                })
            )
            ->first();
    }

    protected function getIntSetting(string $key, int $default): int
    {
        $value = DB::table('settings')->where('key', $key)->value('value');

        if (! is_numeric($value)) {
            return $default;
        }

        return (int) $value;
    }

    protected function lowStockQuery(int $defaultReorderLevel)
    {
        return Item::query()
            ->where('quantity', '>', 0)
            ->where(function ($query) use ($defaultReorderLevel) {
                $query->where(function ($sub) {
                    $sub->whereNotNull('reorder_level')
                        ->whereColumn('quantity', '<=', 'reorder_level');
                })->orWhere(function ($sub) use ($defaultReorderLevel) {
                    $sub->whereNull('reorder_level')
                        ->where('quantity', '<=', $defaultReorderLevel);
                });
            });
    }

    protected function normalizePayload(array $validated, bool $includeQuantity = true): array
    {
        $payload = [
            'name' => trim((string) $validated['name']),
            'sku' => $this->normalizeNullable($validated['sku'] ?? null),
            'brand' => $this->normalizeNullable($validated['brand'] ?? null),
            'description' => $this->normalizeNullable($validated['description'] ?? null),
            'category_id' => $validated['category_id'],
            'supplier_id' => $validated['supplier_id'],
            'asset_tag' => $this->normalizeNullable($validated['asset_tag'] ?? null),
            'serial_number' => $this->normalizeNullable($validated['serial_number'] ?? null),
            'unit_of_measurement' => trim((string) ($validated['unit_of_measurement'] ?? 'unit')) ?: 'unit',
            'unit_cost' => array_key_exists('unit_cost', $validated) && $validated['unit_cost'] !== null
                ? (float) $validated['unit_cost']
                : null,
            'is_depreciable' => (bool) ($validated['is_depreciable'] ?? false),
            'depreciation_method' => $this->normalizeNullable($validated['depreciation_method'] ?? null),
            'useful_life_years' => array_key_exists('useful_life_years', $validated) && $validated['useful_life_years'] !== null
                ? (int) $validated['useful_life_years']
                : null,
            'salvage_value' => array_key_exists('salvage_value', $validated) && $validated['salvage_value'] !== null
                ? (float) $validated['salvage_value']
                : null,
            'depreciation_start_date' => $validated['depreciation_start_date'] ?? null,
            'status' => $validated['status'],
            'location' => $this->normalizeNullable($validated['location'] ?? null),
            'purchase_date' => $validated['purchase_date'] ?? null,
        ];

        if (array_key_exists('reorder_level', $validated)) {
            $payload['reorder_level'] = $validated['reorder_level'] !== null
                ? (int) $validated['reorder_level']
                : null;
        } elseif ($includeQuantity) {
            $payload['reorder_level'] = 5;
        }

        if ($includeQuantity) {
            $payload['quantity'] = (int) ($validated['quantity'] ?? 0);
        }

        $payload = $this->normalizeDepreciationPayload($payload);

        return $payload;
    }

    protected function financialItemQuery()
    {
        return Item::with(['category', 'supplier'])
            ->withSum('activeAssignments as active_assigned_quantity', 'quantity');
    }

    protected function normalizeDepreciationPayload(array $payload): array
    {
        if (! $payload['is_depreciable']) {
            $payload['depreciation_method'] = Item::DEPRECIATION_METHOD_NONE;
            $payload['useful_life_years'] = null;
            $payload['salvage_value'] = null;
            $payload['depreciation_start_date'] = null;

            return $payload;
        }

        $payload['depreciation_method'] = self::normalizeDepreciationMethod($payload['depreciation_method'] ?? null);
        $payload['depreciation_start_date'] = $payload['depreciation_start_date'] ?? $payload['purchase_date'] ?? null;
        $payload['salvage_value'] = $payload['salvage_value'] ?? 0.0;

        if ($payload['depreciation_method'] !== Item::DEPRECIATION_METHOD_STRAIGHT_LINE) {
            throw ValidationException::withMessages([
                'depreciation_method' => 'Straight-line depreciation is currently the supported method.',
            ]);
        }

        if ($payload['unit_cost'] === null || (float) $payload['unit_cost'] <= 0) {
            throw ValidationException::withMessages([
                'unit_cost' => 'Unit Cost is required when depreciation is enabled.',
            ]);
        }

        if (empty($payload['useful_life_years']) || (int) $payload['useful_life_years'] <= 0) {
            throw ValidationException::withMessages([
                'useful_life_years' => 'Useful Life (Years) is required when depreciation is enabled.',
            ]);
        }

        if (empty($payload['depreciation_start_date'])) {
            throw ValidationException::withMessages([
                'depreciation_start_date' => 'Depreciation Start Date is required when depreciation is enabled.',
            ]);
        }

        if ((float) ($payload['salvage_value'] ?? 0) > (float) $payload['unit_cost']) {
            throw ValidationException::withMessages([
                'salvage_value' => 'Salvage Value cannot be greater than Unit Cost.',
            ]);
        }

        return $payload;
    }

    protected static function normalizeDepreciationMethod(?string $method): string
    {
        return $method ?: Item::DEPRECIATION_METHOD_STRAIGHT_LINE;
    }

    protected function normalizeNullable(?string $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
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
