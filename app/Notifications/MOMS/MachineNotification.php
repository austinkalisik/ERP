<?php
namespace App\Notifications\MOMS;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\MOMS\Machine;

// NOTE: ShouldQueue removed — notification now fires synchronously.
// If you want async (recommended for production), add back:
//   implements ShouldQueue
// and make sure your queue worker is running:
//   php artisan queue:work
class MachineNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Machine $machine,
        public string  $action
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $emoji = $this->action === 'added' ? '🚜' : '🔧';

        return [
            'module'     => 'moms',
            'type'       => 'machine_' . str_replace(' ', '_', $this->action),
            'title'      => "{$emoji} Machine " . ucfirst($this->action),
            'message'    => "Machine {$this->machine->machine_id} ({$this->machine->category} — {$this->machine->make} {$this->machine->model}) has been {$this->action}.",
            'url'        => '/moms/machines/' . $this->machine->id,
            'machine_id' => $this->machine->machine_id,
        ];
    }
}