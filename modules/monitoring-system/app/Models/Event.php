<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = [
        'device_id', 'event_type', 'severity', 'location', 'message', 'occurred_at',
        'acknowledged', 'acknowledged_by', 'acknowledged_at', 'resolution_notes',
    ];

    protected $casts = ['occurred_at' => 'datetime', 'acknowledged_at' => 'datetime', 'acknowledged' => 'boolean'];

    public function device() { return $this->belongsTo(Device::class); }
    public function acknowledgements() { return $this->hasMany(AlarmAcknowledgement::class); }
}
