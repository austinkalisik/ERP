<?php

namespace App\Models\AIMS;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\Auditable;

class SalesOrderItem extends Model
{
    use Auditable;
    
    protected $fillable = [
        'sales_order_id',
        'item_id',
        'quantity',
        'unit_price',
        'subtotal',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public $timestamps = false;

    /**
     * Get the sales order that owns the item.
     */
    public function salesOrder(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class);
    }

    /**
     * Get the inventory item.
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}