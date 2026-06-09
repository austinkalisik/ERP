<?php

namespace App\Models\AIMS;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\Auditable;

class SalesOrder extends Model
{
    use Auditable;
    
    protected $fillable = [
        'so_number',
        'customer_id',
        'order_date',
        'total_amount',
        'status',
    ];

    protected $attributes = [
        'status' => 'pending',
    ];

    protected $casts = [
        'order_date' => 'date',
        'total_amount' => 'decimal:2',
    ];

    /**
     * Get the customer that owns the sales order.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the items for the sales order.
     */
    public function items(): HasMany
    {
        return $this->hasMany(SalesOrderItem::class);
    }
}