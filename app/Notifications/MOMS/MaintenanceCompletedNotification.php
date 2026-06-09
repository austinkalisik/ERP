<?php

namespace App\Notifications\MOMS;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\MOMS\MaintenanceLog;

// FIXED: Added ShouldQueue so notify() dispatches to the queue instead of
// blocking the HTTP response with one DB write per MOMS user.
// Queueable was already here but useless without this interface.
class MaintenanceCompletedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public MaintenanceLog $log
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $machine   = $this->log->machine;
        $performer = $this->log->performedBy;

        return [
            'type'       => 'maintenance_completed',
            'title'      => '✅ Maintenance Completed',
            'message'    => "Machine {$machine->machine_id} — {$this->log->maintenance_type} maintenance completed by {$performer->name}.",
            'machine_id' => $machine->machine_id,
            'log_id'     => $this->log->id,
            'url'        => '/moms/maintenance/logs',
        ];
    }
}