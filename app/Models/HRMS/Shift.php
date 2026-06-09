<?php

namespace App\Models\HRMS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\HRMS\Employee;
use App\Traits\Auditable;

class Shift extends Model
{
    use HasFactory;
    use Auditable;

    protected $table = 'shifts';

    protected $fillable = [
        'shift_name',
        'start_time',
        'end_time',
    ];

    protected $casts = [
        'start_time' => 'string',
        'end_time' => 'string',
    ];

    // One shift → many employees
    public function employees()
    {
        return $this->hasMany(Employee::class, 'shift_id', 'id');
    }
}
