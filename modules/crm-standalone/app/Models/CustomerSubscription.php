<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'customer_id',
    'service_type',
    'service_name',
    'reference',
    'status',
    'starts_at',
    'expires_at',
    'renewal_cycle',
    'amount',
    'notes',
])]
class CustomerSubscription extends Model
{
    public const SERVICE_TYPES = [
        'domain_hosting' => 'Domain Hosting',
        'internet_service' => 'Internet Service',
        'gps' => 'GPS',
        'email_hosting' => 'Email Hosting',
        'website_hosting' => 'Website Hosting',
        'other' => 'Other',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'date',
            'expires_at' => 'date',
            'amount' => 'decimal:2',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SubscriptionPayment::class);
    }

    public function credits(): HasMany
    {
        return $this->hasMany(SubscriptionCredit::class);
    }

    public function serviceLabel(): string
    {
        return self::SERVICE_TYPES[$this->service_type] ?? str($this->service_type)->headline()->toString();
    }
}
