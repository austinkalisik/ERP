<?php

namespace App\Models\AIMS;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;
class RequestOrderItem extends Model
{
    use Auditable;
    
    protected $fillable = [
        'request_order_id',
        'item_id',
        'quantity',
        'unit_cost',
        'subtotal',
    ];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}
