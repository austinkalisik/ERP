<?php

namespace App\Notifications\CRM;

use App\Models\CRM\CrmSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SubscriptionExpiredNotification extends Notification
{
    use Queueable;

    public function __construct(public CrmSubscription $subscription) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'module'  => 'crm',
            'type'    => 'subscription_expired',
            'title'   => '🔴 Subscription Expired',
            'message' => "{$this->subscription->client?->name}: {$this->subscription->service?->name} expired on {$this->subscription->expiry_date->format('d M Y')}.",
            'url'     => '/crm/subscriptions/' . $this->subscription->id,
        ];
    }
}