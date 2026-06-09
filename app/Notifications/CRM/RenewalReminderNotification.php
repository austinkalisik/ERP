<?php

namespace App\Notifications\CRM;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class RenewalReminderNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly array $data) {}

    /**
     * Delivered via database only — shows in the notification bell
     * using your existing NotificationsController.
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $days   = $this->data['days_left'];
        $client = $this->data['client_name'];
        $svc    = $this->data['service_name'];

        return [
            'type'            => 'crm_renewal_reminder',
            'title'           => "Renewal due in {$days} day" . ($days !== 1 ? 's' : ''),
            'message'         => "{$client} — {$svc} expires in {$days} day" . ($days !== 1 ? 's' : '') . ". K" . number_format($this->data['amount'], 2) . " due.",
            'subscription_id' => $this->data['subscription_id'],
            'client_name'     => $client,
            'service_name'    => $svc,
            'expiry_date'     => $this->data['expiry_date'],
            'days_left'       => $days,
            'amount'          => $this->data['amount'],
            'url'             => "/crm/renewals",
        ];
    }
}