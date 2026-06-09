<?php

namespace App\Notifications\HRMS;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\HRMS\Application;

class ApplicationStatusNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Application $application,
        public string $oldStatus,
        public string $newStatus
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $type      = $this->application->application_type;
        $bioId     = $this->application->biometric_id;
        $newStatus = $this->newStatus;

        $emoji = match(true) {
            str_contains($newStatus, 'Approved') => '✅',
            str_contains($newStatus, 'Posted')   => '📋',
            str_contains($newStatus, 'Rejected') => '❌',
            str_contains($newStatus, 'Pending')  => '⏳',
            default                              => '📄',
        };

        return [
            'module'     => 'hrms',
            'type'       => 'application_status',
            'title'      => "{$emoji} {$type} Application {$newStatus}",
            'message'    => "Application for {$bioId} has been updated to: {$newStatus}",
            'url'        => '/hrms/applications',
            'app_id'     => $this->application->id,
            'old_status' => $this->oldStatus,
            'new_status' => $newStatus,
        ];
    }
}