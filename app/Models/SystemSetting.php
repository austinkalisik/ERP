<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class SystemSetting extends Model
{
    use Auditable;

    protected $fillable = [
        'company_name',
        'company_address',
        'email',
        'phone',
        'country',
        'timezone',
        'currency',
        'date_format',
        'language',
        'theme',
    ];
}