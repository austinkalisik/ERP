<?php
namespace App\Notifications\MOMS;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\MOMS\Operator;
class OperatorNotification extends Notification
{
    use Queueable;
    public function __construct(public Operator $operator) {}
    public function via(object $notifiable): array { return ['database']; }
    public function toDatabase(object $notifiable): array
    {
        $name = $operator->user->name ?? "Operator #{$this->operator->id}";
        return [
            'module'      => 'moms',
            'type'        => 'operator_added',
            'title'       => '👷 New Operator Added',
            'message'     => "{$name} has been registered as an operator.",
            'url'         => '/moms/operators/' . $this->operator->id,
            'operator_id' => $this->operator->id,
        ];
    }
}