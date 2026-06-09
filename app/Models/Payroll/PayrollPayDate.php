<?php

namespace App\Models\Payroll;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class PayrollPayDate extends Model
{
    use Auditable;

    protected $table = 'payroll_pay_dates';

    protected $fillable = [
        'pay_date',
        'cutoff_start_date',
        'cutoff_end_date',
    ];

    protected $casts = [
        'pay_date'          => 'date:Y-m-d',
        'cutoff_start_date' => 'date:Y-m-d',
        'cutoff_end_date'   => 'date:Y-m-d',
    ];
}