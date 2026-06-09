<?php

namespace App\Models\HRMS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\HRMS\Employee;
use App\Traits\Auditable;

class LeaveCredits extends Model
{
    use HasFactory;
    use Auditable;

    protected $table = 'leave_credits';

    protected $fillable = [
        'employee_id',

        // Annual Leave
        'annual_year',
        'annual_total',
        'annual_credits',

        // R&R (Rest & Recreation) — default 14 days
        'rnr_year',
        'rnr_total',
        'rnr_credits',

        // Sick Leave
        'sick_year',
        'sick_total',
        'sick_credits',

        // Special Leave
        'special_year',
        'special_total',
        'special_credits',
    ];

    protected $casts = [
        'annual_year'   => 'integer',
        'annual_total'  => 'decimal:2',
        'annual_credits' => 'decimal:2',

        'rnr_year'    => 'integer',
        'rnr_total'   => 'decimal:2',
        'rnr_credits' => 'decimal:2',

        'sick_year'    => 'integer',
        'sick_total'   => 'decimal:2',
        'sick_credits' => 'decimal:2',

        'special_year'    => 'integer',
        'special_total'   => 'decimal:2',
        'special_credits' => 'decimal:2',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}