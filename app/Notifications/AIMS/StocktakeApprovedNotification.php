<?php

namespace App\Notifications\AIMS;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\AIMS\StocktakeSession;

class StocktakeApprovedNotification extends Notification
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
            'type'    => 'stocktake_approved',
            'title'   => '✅ Stocktake Approved',
            'message' => "{$this->session->reference} approved — inventory has been adjusted.",
            'url'     => "/aims/stocktake/{$this->session->id}/variance",
        ];
    }
}