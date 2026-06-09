<?php

namespace App\Models\MOMS;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Traits\Auditable;

class FuelTransaction extends Model
{
    use Auditable;

    protected $fillable = [
        'machine_id',
        'fuel_type',
        'volume',
        'unit_price',
        'total_cost',
        'transaction_date',
        'logged_by',
        'notes',
        'engine_hours',
    ];

    protected $casts = [
        'volume' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'transaction_date' => 'date:Y-m-d',
    ];

    /**
     * Relationship to Machine
     */
    public function machine()
    {
        return $this->belongsTo(Machine::class);
    }

    /**
     * Relationship to User who logged the transaction
     */
    public function loggedBy()
    {
        return $this->belongsTo(User::class, 'logged_by');
    }
}