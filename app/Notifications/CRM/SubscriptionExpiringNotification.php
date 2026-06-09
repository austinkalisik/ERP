<?php

namespace App\Notifications\CRM;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SubscriptionExpiringNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $clientName,
        public string $serviceName,
        public int    $daysLeft,
        public int    $subscriptionId,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'module'  => 'crm',
            'type'    => 'subscription_expiring',
            'title'   => '⏰ Subscription Expiring Soon',
            'message' => "{$this->clientName} — {$this->serviceName} expires in {$this->daysLeft} day(s).",
            'url'     => "/crm/subscriptions/{$this->subscriptionId}",
        ];
    }
}