<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeviceReading extends Model
{
    protected $fillable = ['device_id', 'metric', 'value', 'unit', 'recorded_at'];
    protected $casts = ['recorded_at' => 'datetime', 'value' => 'decimal:2'];

    public function device() { return $this->belongsTo(Device::class); }
}
