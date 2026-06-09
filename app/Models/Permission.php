<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Permission extends Model
{
    use HasFactory;
    use Auditable;

    protected $fillable = [
        'slug',
        'description',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class);
    }
}