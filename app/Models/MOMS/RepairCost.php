<?php

namespace App\Models\MOMS;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class RepairCost extends Model
{
    use Auditable;

    protected $table = 'repair_costs';

    protected $fillable = [
        'machine_id',
        'maintenance_log_id',
        'cost_type',
        'description',
        'amount',
        'currency',
        'supplier',
        'invoice_ref',
        'cost_date',
        'recorded_by',
        'notes',
    ];

    protected $casts = [
        'amount'    => 'decimal:2',
        'cost_date' => 'date',
    ];

    public function machine()
    {
        return $this->belongsTo(Machine::class);
    }

    public function recorder()
    {
        return $this->belongsTo(\App\Models\User::class, 'recorded_by');
    }

    public function maintenance()
    {
        return $this->belongsTo(MaintenanceLog::class, 'maintenance_log_id');
    }
}