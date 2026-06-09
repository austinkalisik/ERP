<?php

namespace App\Models\AIMS;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class RequestOrder extends Model
{
    use Auditable;

    protected $fillable = [
        'purchase_request_id',
        'po_number',
        'supplier_id',
        'order_date',
        'status',
        'total_amount',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items()
    {
        return $this->hasMany(RequestOrderItem::class);
    }

    public function purchaseRequest()
    {
        return $this->belongsTo(PurchaseRequest::class);
    }
}
