<?php

namespace App\Models\AIMS;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\Auditable;

class Item extends Model
{
    use HasFactory;
    use Auditable;

    protected $fillable = [
        /* Classification */
        'item_type',
        'status',
        'location',

        /* Basic Information */
        'name',
        'sku',
        'barcode',
        'category',
        'brand',
        'unit',

        /* Supplier & Procurement */
        'supplier_id',
        'lead_time',
        'preferred_purchase_qty',

        /* Pricing */
        'cost_price',
        'selling_price',
        'valuation_method',

        /* Stock Control */
        'current_stock',
        'minimum_stock',
        'maximum_stock',
        'reorder_quantity',

        /* Additional */
        'notes',
    ];

    protected $casts = [
        'supplier_id' => 'integer',
        'lead_time' => 'integer',
        'preferred_purchase_qty' => 'integer',

        'cost_price' => 'decimal:2',
        'selling_price' => 'decimal:2',

        'current_stock' => 'integer',
        'minimum_stock' => 'integer',
        'maximum_stock' => 'integer',
        'reorder_quantity' => 'integer',
    ];

    /* ============================
       Relationships
    ============================ */

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    /* ============================
       Helpers & Accessors
    ============================ */

    public function getStockStatusAttribute(): string
    {
        if ($this->current_stock === 0) {
            return 'Out of Stock';
        }

        if ($this->current_stock <= $this->minimum_stock) {
            return 'Low Stock';
        }

        if ($this->maximum_stock > 0 && $this->current_stock > $this->maximum_stock) {
            return 'Overstock';
        }

        return 'In Stock';
    }

    public function getProfitMarginAttribute(): float
    {
        if ($this->selling_price <= 0) {
            return 0;
        }

        return round(
            (($this->selling_price - $this->cost_price) / $this->selling_price) * 100,
            2
        );
    }

    public function getInventoryValueAttribute(): float
    {
        return round($this->current_stock * $this->cost_price, 2);
    }

    /* ============================
       Scopes
    ============================ */

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeLowStock($query)
    {
        return $query->whereColumn('current_stock', '<=', 'minimum_stock')
                     ->where('current_stock', '>', 0);
    }

    public function scopeOutOfStock($query)
    {
        return $query->where('current_stock', 0);
    }

    public function scopeInStock($query)
    {
        return $query->whereColumn('current_stock', '>', 'minimum_stock');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'Active');
    }

    /* ============================
       Business Logic
    ============================ */

    public function needsReorder(): bool
    {
        return $this->current_stock <= $this->minimum_stock;
    }

    public function getReorderQuantity(): int
    {
        if ($this->reorder_quantity > 0) {
            return $this->reorder_quantity;
        }

        if ($this->maximum_stock > 0) {
            return max(0, $this->maximum_stock - $this->current_stock);
        }

        return $this->minimum_stock * 2;
    }
}
