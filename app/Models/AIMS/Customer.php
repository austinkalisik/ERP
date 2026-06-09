<?php

namespace App\Models\AIMS;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\Auditable;

class Customer extends Model
{
    use Auditable;
    
    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
    ];

    /**
     * Get the sales orders for the customer.
     */
    public function salesOrders(): HasMany
    {
        return $this->hasMany(SalesOrder::class);
    }
}