<?php

namespace App\Models\MOMS;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class ShiftOperation extends Model
{
    use Auditable;

    protected $fillable = [
        'operator_id',
        'machine_id',
        'assignment_id',

        // Initial Readings
        'starting_hour_meter',
        'starting_odometer',
        'fuel_level_observed',
        'estimated_fuel_in_tank',

        // Safety Checklist
        'engine_condition',
        'tires_condition',
        'lights_signals',
        'brakes_responsive',
        'fluid_levels',
        'safety_equipment',
        'mirrors_windows',
        'seatbelt_functioning',
        'checklist_notes',
        'operator_remarks',

        // End of Shift — Meter & Fuel
        'ending_hour_meter',
        'ending_odometer',
        'fuel_consumed',

        // Hour Accounting (DER fields)
        'ready_hours',
        'standby_hours',
        'breakdown_hours',
        'pm_hours',
        'delay_reason',

        // Production (flexible for all machine types)
        'production_quantity',
        'production_unit',
        'tons',
        'trips',

        // Legacy
        'work_done',
        'end_shift_notes',

        // Location & Department
        'location',
        'department',

        // Timestamps & Status
        'shift_start_time',
        'shift_end_time',
        'status',
    ];

    protected $casts = [
        'starting_hour_meter'   => 'decimal:2',
        'starting_odometer'     => 'decimal:2',
        'estimated_fuel_in_tank'=> 'decimal:2',
        'ending_hour_meter'     => 'decimal:2',
        'ending_odometer'       => 'decimal:2',
        'fuel_consumed'         => 'decimal:2',
        'ready_hours'           => 'decimal:2',
        'standby_hours'         => 'decimal:2',
        'breakdown_hours'       => 'decimal:2',
        'pm_hours'              => 'decimal:2',
        'production_quantity'   => 'decimal:2',
        'tons'                  => 'decimal:2',
        'work_done'             => 'decimal:2',
        'shift_start_time'      => 'datetime',
        'shift_end_time'        => 'datetime',
    ];

    // ── Calculated Accessors ─────────────────────────────────────────────

    /**
     * Operating hours = ending - starting hour meter
     */
    public function getOperatingHoursAttribute(): ?float
    {
        if ($this->ending_hour_meter && $this->starting_hour_meter) {
            return round($this->ending_hour_meter - $this->starting_hour_meter, 2);
        }
        return null;
    }

    /**
     * Hours Available = ready + standby (green column in DER)
     */
    public function getHoursAvailableAttribute(): float
    {
        return round(($this->ready_hours ?? 0) + ($this->standby_hours ?? 0), 2);
    }

    /**
     * Hours Unavailable = breakdown + PM (red column in DER)
     */
    public function getHoursUnavailableAttribute(): float
    {
        return round(($this->breakdown_hours ?? 0) + ($this->pm_hours ?? 0), 2);
    }

    // ── Relationships ────────────────────────────────────────────────────

    public function operator()
    {
        return $this->belongsTo(Operator::class);
    }

    public function machine()
    {
        return $this->belongsTo(Machine::class);
    }

    public function assignment()
    {
        return $this->belongsTo(Assignment::class);
    }
}