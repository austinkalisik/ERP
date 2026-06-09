<?php

namespace App\Models\HRMS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Attendance extends Model
{
    use HasFactory;
    use Auditable;

    protected $fillable = [
        'employee_id',
        'shift_id',       
        'shift_type',    
        'date',
        'am_time_in',
        'am_time_out',
        'pm_time_in',
        'pm_time_out',
        'status',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

   
    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }
}