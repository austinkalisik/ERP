<?php

namespace App\Models\Payroll;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Payslip extends Model
{
    use Auditable;
    
    protected $fillable = [
        'employee_id',
        'payroll_id',
        'period',
        'net_pay',
        'pdf_path',
        'generated_at',
    ];

    protected $casts = [
        'generated_at' => 'datetime',
    ];

    public function payroll()
    {
        return $this->belongsTo(Payroll::class);
    }

    public function employee()
{
    return $this->belongsTo(\App\Models\HRMS\Employee::class);
}

}
