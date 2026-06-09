<?php

namespace App\Notifications\AIMS;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\AIMS\Item;

class LowStockNotification extends Notification
{
    use Queueable;

    public function __construct(public Item $item) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'module'         => 'aims',
            'type'           => 'low_stock',
            'title'          => '⚠️ Low Stock Alert',
            'message'        => "{$this->item->name} is running low — only {$this->item->current_stock} {$this->item->unit} remaining (min: {$this->item->minimum_stock}).",
            'url'            => '/aims/inventory',
            'item_id'        => $this->item->id,
            'current_stock'  => $this->item->current_stock,
            'minimum_stock'  => $this->item->minimum_stock,
        ];
    }
}