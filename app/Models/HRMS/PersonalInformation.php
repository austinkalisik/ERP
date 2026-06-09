<?php

namespace App\Models\HRMS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;
use App\Models\HRMS\Employee;

class PersonalInformation extends Model
{
    use HasFactory;
    use Auditable;

    protected $table = 'personal_information';

    protected $fillable = [
        'employee_id',
        'birthdate',
        'age',
        'birthplace',
        'nationality',
        'civil_status',
        'religion',
        'gender',
        'present_address',
        'home_address',
        'email_address',
        'mobile_number',
        'dependents',
        'tax_type',         
        'lodged',
        'emergency_contact',
        'emergency_number',
    ];

    protected $casts = [
        'birthdate'  => 'date',
        'age'        => 'integer',
        'dependents' => 'integer',
        'lodged'     => 'string',
    ];

    public const TAX_TYPES = [
        'W/ Declaration',
        'No Declaration',
        'Non-Resident',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}