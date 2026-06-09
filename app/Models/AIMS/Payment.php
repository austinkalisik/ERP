<?php


namespace App\Models\AIMS;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    // Table name (optional if following Laravel conventions)
    protected $table = 'payments';

    // Mass assignable attributes
    protected $fillable = [
        'payment_number',
        'supplier_id',
        'payment_date',
        'amount',
        'payment_method',
        'remarks',
    ];

    // Casts for automatic type conversion
    protected $casts = [
        'payment_date' => 'date',
        'amount' => 'decimal:2',
    ];

    /**
     * Relationships
     */

    // Payment belongs to a Supplier
    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    // Payment has many allocations
    public function allocations()
    {
        return $this->hasMany(PaymentAllocation::class);
    }
}
