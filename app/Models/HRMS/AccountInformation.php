<?php

namespace App\Models\HRMS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

use App\Models\HRMS\Employee;

class AccountInformation extends Model
{
    use HasFactory;
    use Auditable;

    protected $table = 'account_information';

    protected $fillable = [
        'employee_id',
        'nasfund',
        'nasfund_number',
        'tin_number',
        'work_permit_number',
        'work_permit_expiry',
        'visa_number',
        'visa_expiry',
        'bsb_code',
        'bank_name',
        'account_number',
        'account_name',
    ];

    protected $casts = [
        'nasfund' => 'boolean',
        'work_permit_expiry' => 'date',
        'visa_expiry' => 'date',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}