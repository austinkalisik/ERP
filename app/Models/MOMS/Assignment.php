<?php

namespace App\Models\MOMS;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Traits\Auditable;

class Assignment extends Model
{
    use Auditable;

    protected $fillable = [
        'machine_id',
        'operator_id',
        'job_site',
        'assigned_by',
        'status',
        'shift_type',
        'reading_start',
        'reading_end',
        'start_time',
        'end_time',
        'duration_hours',
        'task_description',
        'time_category',
        'activity',
    ];

    protected $casts = [
        'start_time'     => 'datetime:Y-m-d H:i:s',
        'end_time'       => 'datetime:Y-m-d H:i:s',
        'duration_hours' => 'decimal:2',
        'reading_start'  => 'decimal:2',
        'reading_end'    => 'decimal:2',
    ];

    public function machine()
    {
        return $this->belongsTo(Machine::class);
    }

    public function operator()
    {
        return $this->belongsTo(Operator::class);
    }

    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function timeEntries()
    {
        return $this->hasMany(AssignmentTimeEntry::class)->orderBy('start_time');
    }

    public function calculateDuration(): ?float
    {
        if ($this->start_time && $this->end_time) {
            $start = new \DateTime($this->start_time);
            $end   = new \DateTime($this->end_time);
            $diff  = $start->diff($end);
            return round(($diff->days * 24) + $diff->h + ($diff->i / 60), 2);
        }
        return null;
    }

    /**
     * Total duration across all time entries (in hours).
     */
    public function totalTimeEntryHours(): float
    {
        return (float) $this->timeEntries->sum('duration_hours');
    }
}