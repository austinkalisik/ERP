<?php

namespace App\Services;

use App\Models\AlarmAcknowledgement;
use App\Models\Event;
use App\Models\User;

class AlarmService
{
    public function acknowledge(Event $event, User $user, ?string $notes = null): Event
    {
        $event->update([
            'acknowledged' => true,
            'acknowledged_by' => $user->id,
            'acknowledged_at' => now(),
            'resolution_notes' => $notes,
        ]);

        AlarmAcknowledgement::create(['event_id' => $event->id, 'user_id' => $user->id, 'notes' => $notes]);

        return $event->refresh();
    }
}
