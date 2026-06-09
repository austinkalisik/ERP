<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    use HasFactory;

    protected $fillable = [
        'location_id', 'name', 'type', 'ip_address', 'protocol', 'status',
        'last_heartbeat', 'manufacturer', 'model', 'serial_number', 'notes', 'metadata',
    ];

    protected $casts = ['last_heartbeat' => 'datetime', 'metadata' => 'array'];

    public function location() { return $this->belongsTo(Location::class); }
    public function readings() { return $this->hasMany(DeviceReading::class); }
    public function events() { return $this->hasMany(Event::class); }
}
