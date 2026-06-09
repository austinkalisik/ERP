<?php

namespace App\Models\HRMS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\User;
use App\Models\HRMS\Shift;
use App\Models\HRMS\EmploymentInformation;
use App\Models\HRMS\PersonalInformation;
use App\Models\HRMS\AccountInformation;
use App\Models\HRMS\LeaveCredits;
use App\Models\HRMS\Deminimis;
use App\Models\HRMS\Department;
use App\Models\HRMS\Application;
use App\Traits\Auditable;
class Employee extends Model
{
    use HasFactory;
    use Auditable;

    protected $table = 'employees';

    protected $fillable = [
        // 🔗 User link (optional)
        'user_id',

        // Biometrics
        'biometric_id',
        'employee_number',

        // Full name
        'first_name',
        'middle_name',
        'last_name',

        // Shift
        'shift_id',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'biometric_id' => 'string',
        'employee_number' => 'string',
        'shift_id' => 'integer',
    ];

    protected $hidden = [
        'created_at',
        'updated_at',
    ];

    // =======================================================================
    // Core Relationships
    // =======================================================================

    /**
     * Employee may have a system user account
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function employmentInformation()
    {
        return $this->hasOne(EmploymentInformation::class, 'employee_id', 'id');
    }

    public function personalInformation()
    {
        return $this->hasOne(PersonalInformation::class, 'employee_id', 'id');
    }

    public function accountInformation()
    {
        return $this->hasOne(AccountInformation::class, 'employee_id', 'id');
    }

    public function leaveCredits()
    {
        return $this->hasOne(LeaveCredits::class, 'employee_id', 'id');
    }

    public function deminimis()
    {
        return $this->hasOne(Deminimis::class, 'employee_id', 'id');
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class, 'shift_id', 'id');
    }

    // =======================================================================
    // Department & Approval Flow
    // =======================================================================

    /**
     * Employee belongs to a department via employment_information
     */
    public function department()
    {
        return $this->hasOneThrough(
            Department::class,
            EmploymentInformation::class,
            'employee_id',      // FK on employment_information
            'id',               // PK on departments
            'id',               // PK on employees
            'department_id'     // FK on employment_information
        );
    }

    /**
     * If employee is a department head
     */
    public function headedDepartment()
    {
        return $this->hasOne(Department::class, 'department_head_id', 'id');
    }

    // =======================================================================
    // Applications (Leave, Overtime, etc.)
    // =======================================================================

    /**
     * Employee has many applications (linked via biometric_id)
     */
    public function applications()
    {
        return $this->hasMany(Application::class, 'biometric_id', 'biometric_id');
    }
}
