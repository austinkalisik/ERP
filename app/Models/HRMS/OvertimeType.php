<?php

namespace App\Models\HRMS;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class OvertimeType extends Model
{
    use Auditable;

    protected $fillable = [
        'overtime_type',
        'overtime_code',
        'multiplier',
    ];
}