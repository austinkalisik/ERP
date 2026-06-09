<?php

namespace App\Models\Payroll;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class NcslTable extends Model
{
    use Auditable;

    protected $table = 'payroll_ncsl_table';

    protected $fillable = [
        'compensation_from',
        'compensation_to',
        'deduction_amount',
        'year',
    ];

    protected $casts = [
        'compensation_from' => 'decimal:2',
        'compensation_to'   => 'decimal:2',
        'deduction_amount'  => 'decimal:2',
        'year'              => 'integer',
    ];
}