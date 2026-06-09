<?php

namespace App\Models\MOMS;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Traits\Auditable;

class MaintenanceLog extends Model
{
    use Auditable;

    protected $fillable = [
        'machine_id',
        'maintenance_schedule_id',
        'maintenance_type',
        'status',
        'start_time',
        'end_time',
        'cost',
        'description',
        'parts_used',
        'parts_cost',
        'performed_by',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time'   => 'datetime',
        'cost'       => 'decimal:2',
        'parts_cost' => 'decimal:2',
        'parts_used' => 'array',
    ];

    public function machine()
    {
        return $this->belongsTo(Machine::class);
    }

    public function schedule()
    {
        return $this->belongsTo(MaintenanceSchedule::class, 'maintenance_schedule_id');
    }

    public function performedBy()
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    // ── Polymorphic attachments ────────────────────────────────────────────
    public function attachments()
    {
        return $this->morphMany(\App\Models\Attachment::class, 'attachable')->latest();
    }
}