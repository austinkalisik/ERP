<?php

namespace App\Models\HRMS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\HRMS\Employee;
use App\Models\HRMS\EmploymentInformation;
use App\Traits\Auditable;

class Department extends Model
{
    use HasFactory;
    use Auditable;

    protected $table = 'departments';

    protected $fillable = [
        'name',
        'prefix',
        'department_head_id',
    ];

    // Employees belonging to this department (through EmploymentInformation)
    public function employees()
    {
        return $this->hasMany(EmploymentInformation::class, 'department_id', 'id');
    }

    // Department Head (Employee)
    public function head()
    {
        return $this->belongsTo(Employee::class, 'department_head_id', 'id');
    }
}
