<?php
namespace App\Notifications\MOMS;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\MOMS\Breakdown;
class BreakdownNotification extends Notification
{
    use Queueable;
    public function __construct(public Breakdown $breakdown) {}
    public function via(object $notifiable): array { return ['database']; }
    public function toDatabase(object $notifiable): array
    {
        $machine = $this->breakdown->machine;
        return [
            'module'       => 'moms',
            'type'         => 'breakdown_reported',
            'title'        => '🔴 Breakdown Reported',
            'message'      => "Breakdown reported for {$machine->machine_id}: {$this->breakdown->description}",
            'url'          => '/moms/breakdowns/' . $this->breakdown->id,
            'breakdown_id' => $this->breakdown->id,
            'machine_id'   => $machine->machine_id,
        ];
    }
}