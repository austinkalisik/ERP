<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    protected $fillable = [
        'name',
        'description',
    ];

    protected $hidden = [
        'created_at',
        'updated_at',
    ];

    public function assignments(): HasMany
    {
        return $this->hasMany(Assignment::class);
    }

    public function receivers(): HasMany
    {
        return $this->hasMany(Receiver::class);
    }

    public function activeAssignments(): HasMany
    {
        return $this->hasMany(Assignment::class)->whereNull('returned_at');
    }
}
