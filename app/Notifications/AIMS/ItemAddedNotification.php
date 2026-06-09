<?php
namespace App\Notifications\AIMS;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\AIMS\Item;
class ItemAddedNotification extends Notification
{
    use Queueable;
    public function __construct(public Item $item) {}
    public function via(object $notifiable): array { return ['database']; }
    public function toDatabase(object $notifiable): array
    {
        return [
            'module'  => 'aims',
            'type'    => 'item_added',
            'title'   => '📦 New Item Added',
            'message' => "{$this->item->name} (SKU: {$this->item->sku}) has been added to inventory with {$this->item->current_stock} {$this->item->unit} in stock.",
            'url'     => '/aims/inventory',
            'item_id' => $this->item->id,
        ];
    }
}