<?php

namespace App\Notifications\AIMS;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\AIMS\StocktakeSession;

class StocktakeCompletedNotification extends Notification
{
    use Queueable;

    public function __construct(public StocktakeSession $session) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'module'  => 'aims',
            'type'    => 'stocktake_completed',
            'title'   => '📋 Stocktake Completed',
            'message' => "{$this->session->reference} is ready for variance review.",
            'url'     => "/aims/stocktake/{$this->session->id}/variance",
        ];
    }
}