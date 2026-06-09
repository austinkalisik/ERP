<?php

namespace App\Notifications\MOMS;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\MOMS\MaintenanceSchedule;

class MaintenanceDueNotification extends Notification
{
    use Queueable;

    public function __construct(
        public MaintenanceSchedule $schedule,
        public string $reason  // 'hours' or 'date'
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $machine = $this->schedule->machine;

        $message = $this->reason === 'hours'
            ? "Machine {$machine->machine_id} is due for PMS — reached {$this->schedule->next_due_hours} engine hours."
            : "Machine {$machine->machine_id} has a scheduled maintenance due: {$this->schedule->title} on {$this->schedule->next_due_date->format('M d, Y')}.";

        return [
            'type'        => 'maintenance_due',
            'title'       => 'Maintenance Due',
            'message'     => $message,
            'machine_id'  => $machine->machine_id,
            'schedule_id' => $this->schedule->id,
            'reason'      => $this->reason,
            'due_hours'   => $this->schedule->next_due_hours,
            'due_date'    => $this->schedule->next_due_date?->format('Y-m-d'),
            'url'         => '/moms/maintenance/schedules',
        ];
    }
}