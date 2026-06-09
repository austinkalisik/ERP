<?php

namespace App\Models\AIMS;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class PurchaseRequestItem extends Model
{
    use Auditable;
    
    protected $fillable = [
        'purchase_request_id',
        'item_id',
        'quantity',
    ];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}
