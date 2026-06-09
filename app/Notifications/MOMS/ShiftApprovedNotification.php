<?php
namespace App\Notifications\MOMS;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\MOMS\ShiftOperation;
class ShiftApprovedNotification extends Notification
{
    use Queueable;
    public function __construct(public ShiftOperation $operation) {}
    public function via(object $notifiable): array { return ['database']; }
    public function toDatabase(object $notifiable): array
    {
        $machine = $this->operation->machine;
        return [
            'module'       => 'moms',
            'type'         => 'shift_approved',
            'title'        => '✅ Shift Approved',
            'message'      => "Your shift for {$machine->machine_id} has been approved.",
            'url'          => '/moms/operations/' . $this->operation->id,
            'operation_id' => $this->operation->id,
        ];
    }
}