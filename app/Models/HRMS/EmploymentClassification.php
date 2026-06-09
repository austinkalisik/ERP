<?php

namespace App\Models\HRMS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class EmploymentClassification extends Model
{
    use HasFactory;
    use Auditable;

    protected $fillable = [
        'name',
        'is_active',
    ];
}