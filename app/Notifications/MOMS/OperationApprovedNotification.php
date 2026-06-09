<?php

namespace App\Notifications\MOMS;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\MOMS\ShiftOperation;

class OperationApprovedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public ShiftOperation $operation
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $machine = $this->operation->machine;

        return [
            'type'         => 'operation_approved',
            'title'        => '✅ Shift Report Approved',
            'message'      => "Your shift report for machine {$machine->machine_id} has been approved.",
            'machine_id'   => $machine->machine_id,
            'operation_id' => $this->operation->id,
            'url'          => '/moms/operations',
        ];
    }
}