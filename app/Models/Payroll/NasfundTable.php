<?php

namespace App\Models\Payroll;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class NasfundTable extends Model
{
    use Auditable;

    protected $table = 'payroll_nasfund_table';

    protected $fillable = [
        'compensation_from',
        'compensation_to',
        'employee_rate',
        'employer_rate',
        'year',
    ];

    protected $casts = [
        'compensation_from' => 'decimal:2',
        'compensation_to'   => 'decimal:2',
        'employee_rate'     => 'decimal:6',
        'employer_rate'     => 'decimal:6',
        'year'              => 'integer',
    ];

    /**
     * Get employee rate as percentage for display (0.06 → 6.00)
     */
    public function getEmployeeRatePercentAttribute(): float
    {
        return round((float) $this->employee_rate * 100, 4);
    }

    /**
     * Get employer rate as percentage for display
     */
    public function getEmployerRatePercentAttribute(): float
    {
        return round((float) $this->employer_rate * 100, 4);
    }
}