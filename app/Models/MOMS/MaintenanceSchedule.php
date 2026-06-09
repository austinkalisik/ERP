<?php

namespace App\Models\MOMS;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class MaintenanceSchedule extends Model
{
    use Auditable;

    protected $fillable = [
        'machine_id',
        'title',
        'description',
        'frequency',
        'interval_value',
        'hour_interval',
        'last_engine_hours',
        'next_due_hours',
        'next_due_date',
        'last_performed_date',
        'is_active',
    ];

    protected $casts = [
        'next_due_date'       => 'date',
        'last_performed_date' => 'date',
        'is_active'           => 'boolean',
        'interval_value'      => 'integer',
        'hour_interval'       => 'integer',
        'last_engine_hours'   => 'integer',
        'next_due_hours'      => 'integer',
    ];

    public function machine()
    {
        return $this->belongsTo(Machine::class);
    }

    public function logs()
    {
        return $this->hasMany(MaintenanceLog::class);
    }
}