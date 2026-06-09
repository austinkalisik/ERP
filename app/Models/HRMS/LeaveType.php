<?php

namespace App\Models\HRMS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class LeaveType extends Model
{
    use HasFactory;
    use Auditable;

    protected $table = 'leave_types';

    protected $fillable = [
        'leave_type',
        'leave_code',
        'num_hours',
    ];

    protected $casts = [
        'num_hours' => 'decimal:2',
    ];
}