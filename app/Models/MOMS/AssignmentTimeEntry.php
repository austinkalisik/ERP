<?php

namespace App\Models\MOMS;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;
use Carbon\Carbon;

class AssignmentTimeEntry extends Model
{
    use Auditable;

    protected $fillable = [
        'assignment_id',
        'operation_id',
        'time_category',
        'activity',
        'start_time',
        'end_time',
        'duration_hours',
    ];

    protected $casts = [
        'start_time'     => 'datetime:Y-m-d H:i:s',
        'end_time'       => 'datetime:Y-m-d H:i:s',
        'duration_hours' => 'decimal:2',
    ];

    // Belongs to an Assignment (old flow — from AssignmentView)
    public function assignment()
    {
        return $this->belongsTo(Assignment::class);
    }

    // Belongs to a ShiftOperation (new flow — from TimeEntries page)
    public function operation()
    {
        return $this->belongsTo(ShiftOperation::class, 'operation_id');
    }

    protected static function booted(): void
    {
        static::saving(function (self $entry) {
            if ($entry->start_time && $entry->end_time) {
                $start = $entry->start_time instanceof Carbon
                    ? $entry->start_time
                    : Carbon::parse($entry->start_time);

                $end = $entry->end_time instanceof Carbon
                    ? $entry->end_time
                    : Carbon::parse($entry->end_time);

                if ($end->gt($start)) {
                    $entry->duration_hours = round($end->diffInMinutes($start) / 60, 2);
                }
            }
        });
    }
}