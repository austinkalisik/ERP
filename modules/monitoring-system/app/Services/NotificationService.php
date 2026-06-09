<?php

namespace App\Services;

use App\Models\Event;

class NotificationService
{
    public function dispatch(Event $event): void
    {
        // Future email, SMS, webhook, and websocket notifications.
    }
}
