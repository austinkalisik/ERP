<?php

namespace App\Models\Payroll;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class TaxTable extends Model
{
    use Auditable;

    protected $table = 'payroll_tax_table';

    protected $fillable = [
        'compensation_from',
        'compensation_to',
        'tax_type',
        'no_of_dependents',
        'amount',
        'year_applied',
    ];

    protected $casts = [
        'compensation_from' => 'decimal:2',
        'compensation_to'   => 'decimal:2',
        'no_of_dependents'  => 'integer',
        'amount'            => 'decimal:2',
        'year_applied'      => 'integer',
    ];

    public const TAX_TYPES = [
        'W/ Declaration',
        'No Declaration',
        'Non-Resident',
    ];
}