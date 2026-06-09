<?php
namespace App\Notifications\AIMS;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use App\Models\AIMS\Item;
class StockInNotification extends Notification
{
    use Queueable;
    public function __construct(public Item $item, public int $quantity) {}
    public function via(object $notifiable): array { return ['database']; }
    public function toDatabase(object $notifiable): array
    {
        return [
            'module'   => 'aims',
            'type'     => 'stock_in',
            'title'    => '📥 Stock Received',
            'message'  => "{$this->quantity} {$this->item->unit} of {$this->item->name} received. New stock: {$this->item->current_stock} {$this->item->unit}.",
            'url'      => '/aims/stock-movements',
            'item_id'  => $this->item->id,
            'quantity' => $this->quantity,
        ];
    }
}