<?php

namespace App\Models\MOMS;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Traits\Auditable;

class Breakdown extends Model
{
    use Auditable;

    protected $fillable = [
        'machine_id',
        'breakdown_type',
        'severity',
        'incident_time',
        'description',
        'diagnostics',
        'downtime_minutes',
        'repair_cost',
        'status',
        'reported_by',
        'resolved_at',
    ];

    protected $casts = [
        'incident_time' => 'datetime',
        'resolved_at' => 'datetime',
        'repair_cost' => 'decimal:2',
        'downtime_minutes' => 'integer',
    ];

    /**
     * Relationship to Machine
     */
    public function machine()
    {
        return $this->belongsTo(Machine::class);
    }

    /**
     * Relationship to User who reported the breakdown
     */
    public function reportedBy()
    {
        return $this->belongsTo(User::class, 'reported_by');
    }
}