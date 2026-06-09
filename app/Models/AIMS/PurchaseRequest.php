<?php

namespace App\Models\AIMS;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\AIMS\PurchaseRequestItem;
use App\Traits\Auditable;

class PurchaseRequest extends Model
{
    use Auditable;

    protected $fillable = [
        'pr_number',
        'request_date',
        'notes',
        'status',
        'requested_by',
        'approved_by',
        'approved_at',
    ];

    public function items()
    {
        return $this->hasMany(PurchaseRequestItem::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
    public function requestOrders()
{
    return $this->hasMany(RequestOrder::class);
}
}
