<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

#[Fillable([
    'customer_subscription_id',
    'paid_at',
    'period_start',
    'period_end',
    'amount',
    'payment_reference',
    'invoice_number',
    'document_type',
    'file_path',
    'file_name',
    'file_mime',
    'file_size',
    'notes',
])]
class SubscriptionPayment extends Model
{
    protected function casts(): array
    {
        return [
            'paid_at' => 'date',
            'period_start' => 'date',
            'period_end' => 'date',
            'amount' => 'decimal:2',
        ];
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(CustomerSubscription::class, 'customer_subscription_id');
    }

    public function fileUrl(): ?string
    {
        if (! $this->file_path) {
            return null;
        }

        return Storage::disk('public')->url($this->file_path);
    }
}
