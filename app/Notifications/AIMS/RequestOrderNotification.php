<?php
namespace App\Notifications\AIMS;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
class RequestOrderNotification extends Notification
{
    use Queueable;
    public function __construct(
        public int    $orderId,
        public string $orderRef,
        public string $action   // 'created' | 'approved' | 'received' | 'cancelled'
    ) {}
    public function via(object $notifiable): array { return ['database']; }
    public function toDatabase(object $notifiable): array
    {
        $emoji = match($this->action) {
            'created'   => '🛒',
            'approved'  => '✅',
            'received'  => '📬',
            'cancelled' => '❌',
            default     => '📋',
        };
        return [
            'module'   => 'aims',
            'type'     => 'request_order_' . $this->action,
            'title'    => "{$emoji} Request Order " . ucfirst($this->action),
            'message'  => "Request Order {$this->orderRef} has been {$this->action}.",
            'url'      => '/aims/request-orders/' . $this->orderId,
            'order_id' => $this->orderId,
        ];
    }
}