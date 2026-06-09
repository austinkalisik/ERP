<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'customer_subscription_id',
    'credit_type',
    'starts_at',
    'ends_at',
    'months',
    'amount',
    'applied_to_expires_at',
    'reason',
])]
class SubscriptionCredit extends Model
{
    protected function casts(): array
    {
        return [
            'starts_at' => 'date',
            'ends_at' => 'date',
            'applied_to_expires_at' => 'date',
            'amount' => 'decimal:2',
            'months' => 'integer',
        ];
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(CustomerSubscription::class, 'customer_subscription_id');
    }
}
