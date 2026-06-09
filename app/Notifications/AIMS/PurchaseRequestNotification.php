<?php

namespace App\Notifications\AIMS;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\AIMS\PurchaseRequest;

class PurchaseRequestNotification extends Notification
{
    use Queueable;

    public function __construct(
        public PurchaseRequest $request,
        public string $action  // 'approved' | 'rejected' | 'created'
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $emoji = match($this->action) {
            'approved' => '✅',
            'rejected' => '❌',
            default    => '📦',
        };

        return [
            'module'     => 'aims',
            'type'       => 'purchase_request_' . $this->action,
            'title'      => "{$emoji} Purchase Request " . ucfirst($this->action),
            'message'    => "PR #{$this->request->id} has been {$this->action}.",
            'url'        => "/aims/purchase-requests/{$this->request->id}",
            'request_id' => $this->request->id,
            'action'     => $this->action,
        ];
    }
}