<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemStatus extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'name',
        'status',
        'region',
        'checked_at',
        'message',
    ];

    protected function casts(): array
    {
        return [
            'checked_at' => 'datetime',
        ];
    }
}
