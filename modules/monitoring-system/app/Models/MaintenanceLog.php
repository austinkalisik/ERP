<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaintenanceLog extends Model
{
    protected $fillable = ['device_id', 'assigned_technician_id', 'issue', 'priority', 'status', 'due_date', 'resolution_notes'];
    protected $casts = ['due_date' => 'date'];

    public function device() { return $this->belongsTo(Device::class); }
    public function technician() { return $this->belongsTo(User::class, 'assigned_technician_id'); }
}
