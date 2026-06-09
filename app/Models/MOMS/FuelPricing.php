<?php

namespace App\Models\MOMS;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Traits\Auditable;

class FuelPricing extends Model
{
    use Auditable;

    protected $table = 'fuel_pricing';

    protected $fillable = [
        'cost_per_litre',
        'effective_date',
        'updated_by',
        'notes',
    ];

    protected $casts = [
        'cost_per_litre' => 'decimal:2',
        'effective_date' => 'date:Y-m-d',
    ];

    /**
     * Relationship to User who updated the pricing
     */
    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
    
    /**
     * Get current fuel price
     */
    public static function getCurrentPrice()
    {
        return self::where('effective_date', '<=', now())
            ->orderBy('effective_date', 'desc')
            ->first();
    }
}