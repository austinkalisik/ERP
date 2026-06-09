<?php

namespace App\Models\AIMS;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class Invoice extends Model
{
    
    protected $fillable = [
         'invoice_number',
        'po_number',
        'request_order_id',
        'invoice_date',
        'payment_term_id',
        'due_date',
        'supplier_id',
        'subtotal_amount',
        'tax_amount',
        'discount_amount',
        'total_amount',
        'status',
        'remarks',
        'approved_at',
        'approved_by',
        'cancelled_at',
        'cancelled_by',
        'attachment',

        
    ];

    /**
     * Get the supplier that owns the invoice.
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

       public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function requestorder()
    {
        return $this->belongsTo(RequestOrder::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }


    public function paymentAllocations()
    {
        return $this->hasMany(PaymentAllocation::class);
    }

      public function paymentTerm()
    {
        return $this->belongsTo(PaymentTerm::class);
    }

    
}
