<?php

namespace App\Notifications\MOMS;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\MOMS\Assignment;

class AssignmentNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Assignment $assignment
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $machine  = $this->assignment->machine;
        $assigner = $this->assignment->assignedBy;

        return [
            'type'          => 'assignment_created',
            'title'         => '📋 New Assignment',
            'message'       => "You have been assigned to machine {$machine->machine_id} — {$this->assignment->shift_type} shift. Assigned by {$assigner->name}.",
            'machine_id'    => $machine->machine_id,
            'assignment_id' => $this->assignment->id,
            'shift_type'    => $this->assignment->shift_type,
            'start_time'    => $this->assignment->start_time,
            'url'           => '/moms/assignments',
        ];
    }
}