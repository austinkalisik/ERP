<?php

namespace App\Models\Payroll;

use Illuminate\Database\Eloquent\Model;
use App\Models\HRMS\Employee;
use App\Traits\Auditable;

class CashAdvance extends Model
{
    use Auditable;

    protected $fillable = [
        'employee_id',
        'amount',
        'interest_rate',
        'total_amount',
        'installment_amount',
        'total_deducted',
        'remaining_balance',
        'start_date',
        'end_date',
        'purpose',
        'status',
        'notes',
    ];

    protected $casts = [
        'amount'             => 'decimal:2',
        'interest_rate'      => 'decimal:2',
        'total_amount'       => 'decimal:2',
        'installment_amount' => 'decimal:2',
        'total_deducted'     => 'decimal:2',
        'remaining_balance'  => 'decimal:2',
        'start_date'         => 'date:Y-m-d',
        'end_date'           => 'date:Y-m-d',
    ];

    const MAX_AMOUNT = 4000;

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    // Deduct an installment — called by PayrollController each payroll run
    public function applyDeduction(float $amount): void
    {
        $deduct = min($amount, $this->remaining_balance);

        $this->total_deducted    += $deduct;
        $this->remaining_balance -= $deduct;

        if ($this->remaining_balance <= 0) {
            $this->remaining_balance = 0;
            $this->status            = 'Fully Paid';
        }

        $this->save();
    }
}