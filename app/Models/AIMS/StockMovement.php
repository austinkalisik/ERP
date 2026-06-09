<?php

namespace App\Models\AIMS;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\Auditable;

class StockMovement extends Model
{
    use HasFactory;
    use Auditable;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'item_id',
        'type',
        'quantity',
        'reference',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'item_id' => 'integer',
        'quantity' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relationship: Stock movement belongs to an item
     */
    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    /**
     * Accessor: Get formatted date/time
     */
    public function getFormattedDatetimeAttribute(): string
    {
        return $this->created_at->format('M d, Y h:i A');
    }

    /**
     * Accessor: Get movement direction label
     */
    public function getDirectionAttribute(): string
    {
        return $this->type === 'IN' ? 'Stock In' : 'Stock Out';
    }

    /**
     * Scope: Filter by movement type
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope: Filter by item
     */
    public function scopeForItem($query, int $itemId)
    {
        return $query->where('item_id', $itemId);
    }

    /**
     * Scope: Recent movements (last 30 days)
     */
    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Scope: Stock in movements only
     */
    public function scopeStockIn($query)
    {
        return $query->where('type', 'IN');
    }

    /**
     * Scope: Stock out movements only
     */
    public function scopeStockOut($query)
    {
        return $query->where('type', 'OUT');
    }

    /**
     * Boot method to handle events
     */
    protected static function boot()
    {
        parent::boot();

        // Automatically update item stock when movement is created
        static::created(function ($movement) {
            $item = $movement->item;
            
            if ($item) {
                $newStock = $movement->type === 'IN'
                    ? $item->current_stock + $movement->quantity
                    : $item->current_stock - $movement->quantity;

                $item->update([
                    'current_stock' => max(0, $newStock)
                ]);
            }
        });
    }
}