<?php

namespace App\Models\AIMS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subledger extends Model
{
     use HasFactory;

    protected $fillable = [
      'subledger_number',
        'transactionable_id',
        'transactionable_type',
        'entry_date',
        'subtotal_amount',
        'tax_amount',
        'discount_amount',
        'total_amount',
        'status',
        'supplier_id',
        'remarks',
    ];



    public function transactionable()
    {
        return $this->morphTo();
    }

    /**
     * Get the items for the subledger.
     */
    public function items()
    {
        return $this->hasMany(SubledgerItem::class);
    }


}
