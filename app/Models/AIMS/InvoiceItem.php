<?php

namespace App\Models\AIMS;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class InvoiceItem extends Model
{
      use Auditable;
    
    protected $fillable = [
          'invoice_id',
        'request_order_item_id',
        'description',
        'quantity',
        'unit_price',
        'discount',
        'tax',
        'subtotal',
        'gl_account_id',
        
    ];

    // Relationships

    /**
     * Get the invoice this item belongs to.
     */
    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Get the request order item associated with this invoice item.
     */
    public function requestOrderItem()
    {
        return $this->belongsTo(RequestOrderItem::class);
    }

        /**
     * Get the invoice this item belongs to.
     */
    public function ItemsInfo()
    {

        // id FK on RequestOrderItem (link to InvoiceItem)
        // id FK on Item
        // request_order_item_id FK on InvoiceItem
        // item_id FK on RequestOrderItem

        return $this->hasOneThrough(Item::class,RequestOrderItem::class,'id','id','request_order_item_id','item_id');
    }


    // Optional: Accessor to calculate total (quantity * unit_price)
    public function getCalculatedSubtotalAttribute()
    {
        return $this->quantity * $this->unit_price;
    }
}
