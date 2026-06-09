<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'client_id',
        'name',
        'asset_tag',
        'type',
        'status',
        'location',
    ];
}
