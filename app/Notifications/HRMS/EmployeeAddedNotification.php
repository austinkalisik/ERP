<?php

namespace App\Notifications\HRMS;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class EmployeeAddedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $employeeName,
        public string $biometricId,
        public string $department
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'module'       => 'hrms',
            'type'         => 'employee_added',
            'title'        => '👤 New Employee Added',
            'message'      => "{$this->employeeName} ({$this->biometricId}) has been added to {$this->department}.",
            'url'          => '/hrms',
            'biometric_id' => $this->biometricId,
        ];
    }
}