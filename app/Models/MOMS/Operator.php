<?php

namespace App\Models\MOMS;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Traits\Auditable;

class Operator extends Model
{
    use Auditable;

    protected $fillable = [
        'user_id',
        'license_number',
        'license_type',
        'license_expiry',
        'certification',
        'total_hours',
        'performance_rating',
        'notes',
        'status',
    ];

    protected $casts = [
        'license_expiry' => 'date:Y-m-d',
        'total_hours' => 'integer',
        'performance_rating' => 'decimal:2',
    ];

    /**
     * Relationship to User
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}