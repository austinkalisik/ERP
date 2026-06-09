<?php

namespace App\Notifications\Payroll;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PayrollNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $type,    // 'payroll_run' | 'payslip_ready' | 'cash_advance_approved' | 'cash_advance_rejected'
        public string $title,
        public string $message,
        public string $url      = '/payroll',
        public array  $meta     = []
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $emoji = match($this->type) {
            'payroll_run'              => '💰',
            'payslip_ready'            => '📄',
            'cash_advance_approved'    => '✅',
            'cash_advance_rejected'    => '❌',
            default                    => '💼',
        };

        return [
            'module'  => 'payroll',
            'type'    => $this->type,
            'title'   => "{$emoji} {$this->title}",
            'message' => $this->message,
            'url'     => $this->url,
            ...$this->meta,
        ];
    }
}