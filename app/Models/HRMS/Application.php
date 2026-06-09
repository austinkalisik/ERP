<?php

namespace App\Models\HRMS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Application extends Model
{
    use HasFactory;
    use Auditable;

    protected $table = 'applications';

    protected $fillable = [
        'biometric_id',
        'application_type',
        'leave_type',
        'leave_duration',
        'half_day_period',
        'overtime_type',
        'status',
        'date_from',
        'date_to',
        'time_from',
        'time_to',
        'purpose',
    ];

    /**
     * CRITICAL FIX: Cast as 'date' NOT 'date:Y-m-d'
     * This prevents timezone conversion
     */
    protected $casts = [
        'date_from' => 'date',
        'date_to' => 'date',
    ];

    // Relationship with Employee
    public function employee()
    {
        return $this->belongsTo(Employee::class, 'biometric_id', 'biometric_id');
    }
}