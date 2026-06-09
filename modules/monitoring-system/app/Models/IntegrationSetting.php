<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IntegrationSetting extends Model
{
    protected $fillable = ['type', 'name', 'settings', 'enabled'];
    protected $casts = ['settings' => 'array', 'enabled' => 'boolean'];
}
