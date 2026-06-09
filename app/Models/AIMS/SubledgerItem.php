<?php

namespace App\Models\AIMS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubledgerItem extends Model
{
     use HasFactory;

    protected $fillable = [
        'subledger_id',
        'transaction_itemable_id',
        'transaction_itemable_type',
        'description',
        'quantity',
        'unit_amount',
        'discount',
        'tax',
        'subtotal',
        'gl_account_id'
    ];

    public function transactionItemable()
    {
        return $this->morphTo();
    }

    /**
     * Get the subledger that owns this item.
     */
    public function subledger()
    {
        return $this->belongsTo(Subledger::class);
    }

       public function glAccount()
    {
        return $this->belongsTo(GlAccount::class);
    }


}
