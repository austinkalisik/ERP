<?php

namespace App\Models\CRM;

use App\Models\CRM\CrmSubscription;
use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;

class CrmClient extends Model
{
    use Auditable;

    protected $table = 'crm_clients';

    protected $fillable = [
        'name',
        'contact_person',
        'email',
        'phone',
        'address',
        'tin_number',
        'notes',
    ];

    public function subscriptions()
    {
        return $this->hasMany(CrmSubscription::class, 'client_id')
                    ->with('service')
                    ->orderBy('expiry_date', 'asc');
    }

    public function getTotalCreditsAttribute(): int
    {
        return $this->relationLoaded('subscriptions')
            ? $this->subscriptions->sum('credit_days')
            : 0;
    }
}