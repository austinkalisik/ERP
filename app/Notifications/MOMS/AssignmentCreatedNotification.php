<?php
namespace App\Notifications\MOMS;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use App\Models\MOMS\Assignment;
class AssignmentCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;
    public function __construct(public Assignment $assignment) {}
    public function via(object $notifiable): array { return ['database']; }
    public function toDatabase(object $notifiable): array
    {
        $machine  = $this->assignment->machine;
        $operator = $this->assignment->operator?->user;
        return [
            'module'        => 'moms',
            'type'          => 'assignment_created',
            'title'         => '📋 New Assignment Created',
            'message'       => "Assignment for {$machine->machine_id} ({$this->assignment->shift_type} shift) has been created" . ($operator ? " for {$operator->name}" : '') . ".",
            'url'           => '/moms/assignments/' . $this->assignment->id,
            'assignment_id' => $this->assignment->id,
        ];
    }
}