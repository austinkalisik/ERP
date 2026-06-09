<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'company_name',
    'contact_name',
    'email',
    'phone',
    'industry',
    'status',
    'website',
    'address',
    'notes',
    'next_follow_up_at',
])]
class Customer extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'next_follow_up_at' => 'date',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function domainHostingRequests(): HasMany
    {
        return $this->hasMany(DomainHostingRequest::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(CustomerSubscription::class);
    }
}
