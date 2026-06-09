<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Item extends Model
{
    public const DEPRECIATION_METHOD_NONE = 'none';

    public const DEPRECIATION_METHOD_STRAIGHT_LINE = 'straight_line';

    public const STATUS_AVAILABLE = 'available';

    public const STATUS_MAINTENANCE = 'maintenance';

    public const STATUS_LOST = 'lost';

    public const STATUS_RETIRED = 'retired';

    protected $fillable = [
        'name',
        'sku',
        'brand',
        'description',
        'category_id',
        'supplier_id',
        'asset_tag',
        'serial_number',
        'quantity',
        'unit_of_measurement',
        'reorder_level',
        'unit_cost',
        'is_depreciable',
        'depreciation_method',
        'useful_life_years',
        'salvage_value',
        'depreciation_start_date',
        'status',
        'retired_at',
        'disposal_value',
        'disposal_reason',
        'location',
        'purchase_date',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'quantity' => 'integer',
        'reorder_level' => 'integer',
        'unit_cost' => 'decimal:2',
        'is_depreciable' => 'boolean',
        'useful_life_years' => 'integer',
        'salvage_value' => 'decimal:2',
        'depreciation_start_date' => 'date',
        'retired_at' => 'datetime',
        'disposal_value' => 'decimal:2',
    ];

    protected $appends = [
        'is_low_stock',
        'is_assignable',
        'depreciation_enabled',
        'active_assigned_quantity',
        'managed_quantity',
        'annual_depreciation',
        'monthly_depreciation',
        'accumulated_depreciation_per_unit',
        'current_book_value_per_unit',
        'accumulated_depreciation_total',
        'current_book_value_total',
        'depreciation_end_date',
        'is_fully_depreciated',
        'date_added',
        'date_added_at',
    ];

    protected $hidden = [
        'created_at',
        'updated_at',
    ];

    public function getIsLowStockAttribute(): bool
    {
        return $this->isLowStock();
    }

    public function getIsAssignableAttribute(): bool
    {
        return $this->isAssignable();
    }

    public function getDepreciationEnabledAttribute(): bool
    {
        return $this->depreciationEnabled();
    }

    public function getAnnualDepreciationAttribute(): ?float
    {
        if (! $this->depreciationEnabled()) {
            return null;
        }

        return round($this->depreciableBasePerUnit() / (int) $this->useful_life_years, 2);
    }

    public function getActiveAssignedQuantityAttribute(): int
    {
        return (int) ($this->attributes['active_assigned_quantity'] ?? 0);
    }

    public function getManagedQuantityAttribute(): int
    {
        return max(0, (int) $this->quantity) + max(0, (int) $this->active_assigned_quantity);
    }

    public function getMonthlyDepreciationAttribute(): ?float
    {
        $annual = $this->annual_depreciation;

        return $annual !== null ? round($annual / 12, 2) : null;
    }

    public function getAccumulatedDepreciationPerUnitAttribute(): ?float
    {
        if (! $this->depreciationEnabled()) {
            return null;
        }

        $monthly = $this->monthly_depreciation;

        if ($monthly === null) {
            return null;
        }

        return round(min($this->depreciableBasePerUnit(), $monthly * $this->depreciationElapsedMonths()), 2);
    }

    public function getCurrentBookValuePerUnitAttribute(): ?float
    {
        if (! $this->depreciationEnabled()) {
            return null;
        }

        $current = (float) $this->unit_cost - (float) $this->accumulated_depreciation_per_unit;

        return round(max((float) ($this->salvage_value ?? 0), $current), 2);
    }

    public function getAccumulatedDepreciationTotalAttribute(): ?float
    {
        if ($this->accumulated_depreciation_per_unit === null) {
            return null;
        }

        return round((float) $this->accumulated_depreciation_per_unit * $this->managed_quantity, 2);
    }

    public function getCurrentBookValueTotalAttribute(): ?float
    {
        if ($this->current_book_value_per_unit === null) {
            return null;
        }

        return round((float) $this->current_book_value_per_unit * $this->managed_quantity, 2);
    }

    public function getDepreciationEndDateAttribute(): ?string
    {
        if (! $this->depreciationEnabled()) {
            return null;
        }

        return $this->depreciation_start_date
            ? $this->depreciation_start_date->copy()->addYears((int) $this->useful_life_years)->toDateString()
            : null;
    }

    public function getIsFullyDepreciatedAttribute(): bool
    {
        return $this->depreciationEnabled()
            && $this->current_book_value_per_unit !== null
            && (float) $this->current_book_value_per_unit <= (float) ($this->salvage_value ?? 0);
    }

    public function getDateAddedAttribute(): ?string
    {
        return $this->created_at?->toDateString();
    }

    public function getDateAddedAtAttribute(): ?string
    {
        return $this->created_at?->toIso8601String();
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function activeAssignments(): HasMany
    {
        return $this->hasMany(Assignment::class)->whereNull('returned_at');
    }

    public function activeAssignment(): HasOne
    {
        return $this->hasOne(Assignment::class)
            ->whereNull('returned_at')
            ->latestOfMany('assigned_at');
    }

    public function assetLogs(): HasMany
    {
        return $this->hasMany(AssetLog::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function isAvailable(): bool
    {
        return $this->status === self::STATUS_AVAILABLE;
    }

    public function isMaintenance(): bool
    {
        return $this->status === self::STATUS_MAINTENANCE;
    }

    public function isRetired(): bool
    {
        return $this->status === self::STATUS_RETIRED;
    }

    public function isLost(): bool
    {
        return $this->status === self::STATUS_LOST;
    }

    public function hasActiveAssignment(): bool
    {
        return $this->activeAssignments()->exists();
    }

    public function isLowStock(?int $threshold = null): bool
    {
        $threshold = $threshold ?? $this->reorder_level ?? 5;

        return (int) $this->quantity <= $threshold;
    }

    public function isAssignable(): bool
    {
        return $this->status === self::STATUS_AVAILABLE && (int) $this->quantity > 0;
    }

    public function depreciationEnabled(): bool
    {
        return (bool) $this->is_depreciable
            && $this->depreciation_method === self::DEPRECIATION_METHOD_STRAIGHT_LINE
            && $this->unit_cost !== null
            && (int) $this->useful_life_years > 0
            && $this->depreciation_start_date !== null;
    }

    public function getCalculatedQuantity(): int
    {
        return (int) $this->stockMovements()
            ->get()
            ->sum(fn (StockMovement $movement) => $movement->signed_quantity);
    }

    public function syncAutomatedStatus(): void
    {
        if ((int) $this->quantity < 0) {
            $this->quantity = 0;
        }

        if (in_array($this->status, [self::STATUS_MAINTENANCE, self::STATUS_RETIRED, self::STATUS_LOST], true)) {
            $this->save();

            return;
        }

        $this->status = self::STATUS_AVAILABLE;
        $this->save();
    }

    protected function depreciableBasePerUnit(): float
    {
        return max(0, (float) $this->unit_cost - (float) ($this->salvage_value ?? 0));
    }

    protected function depreciationElapsedMonths(): int
    {
        if (! $this->depreciation_start_date) {
            return 0;
        }

        $months = $this->depreciation_start_date->diffInMonths(now(), false);

        if ($months <= 0) {
            return 0;
        }

        return min($months, max(0, (int) $this->useful_life_years * 12));
    }
}
