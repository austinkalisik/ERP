<?php

namespace App\Models\AIMS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentAllocation extends Model
{
     use HasFactory;

    // Table name (optional if following Laravel conventions)
    protected $table = 'payment_allocations';

    // Mass assignable attributes
    protected $fillable = [
        'payment_id',
        'invoice_id',
        'amount_applied',
    ];

    // Casts for automatic type conversion
    protected $casts = [
        'amount_applied' => 'decimal:2',
    ];

    /**
     * Relationships
     */

    // Allocation belongs to a Payment
    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    // Allocation belongs to an Invoice
    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}
