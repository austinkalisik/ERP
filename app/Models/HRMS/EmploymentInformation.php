<?php

namespace App\Models\HRMS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\HRMS\Employee;
use App\Models\HRMS\Department;
use App\Models\HRMS\EmploymentClassification;
use App\Traits\Auditable;

class EmploymentInformation extends Model
{
    use HasFactory, Auditable;

    protected $table = 'employment_information';

    protected $fillable = [
        'employee_id',
        'department_id',
        'position',
        'department_head',
        'supervisor',
        'job_location',
        'employee_type',
        'employment_status',
        'employment_classification', 
        'company_email',
        'rate',
        'rate_type',
        'date_started',
        'date_ended',
    ];

    protected $casts = [
        'date_started' => 'date',
        'date_ended'   => 'date',
        'rate'         => 'decimal:2',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'id');
    }

    public function employmentClassification()
    {
        return $this->belongsTo(
            EmploymentClassification::class,
            'employment_classification', 
        );
    }
}
