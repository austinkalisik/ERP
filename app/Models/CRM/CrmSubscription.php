<?php

namespace App\Models\CRM;

use App\Models\CRM\CrmClient;
use App\Models\CRM\CrmService;
use App\Models\CRM\CrmPayment;
use App\Models\CRM\CrmServiceInterruption;
use App\Models\Attachment;
use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;

class CrmSubscription extends Model
{
    use Auditable;

    protected $table = 'crm_subscriptions';

    protected $fillable = [
        'client_id',
        'service_id',
        'billing_cycle',
        'amount',
        'start_date',
        'expiry_date',
        'status',
        'credit_days',
        'notes',
    ];

    protected $casts = [
        'amount'      => 'decimal:2',
        'start_date'  => 'date',
        'expiry_date' => 'date',
        'credit_days' => 'integer',
    ];

    public function client()
    {
        return $this->belongsTo(CrmClient::class, 'client_id');
    }

    public function service()
    {
        return $this->belongsTo(CrmService::class, 'service_id');
    }

    public function payments()
    {
        return $this->hasMany(CrmPayment::class, 'subscription_id')
                    ->orderBy('payment_date', 'desc');
    }

    public function interruptions()
    {
        return $this->hasMany(CrmServiceInterruption::class, 'subscription_id')
                    ->orderBy('from_date', 'desc');
    }

    public function attachments()
    {
        return $this->morphMany(Attachment::class, 'attachable')
                    ->orderBy('created_at', 'desc');
    }

    public function refreshStatus(): void
    {
        $daysLeft = now()->startOfDay()->diffInDays(
            $this->expiry_date->copy()->startOfDay(),
            false
        );

        $newStatus = match (true) {
            $daysLeft < 0                 => 'Expired',
            $daysLeft <= 30               => 'Expiring',
            $this->status === 'Suspended' => 'Suspended',
            default                       => 'Active',
        };

        if ($this->status !== $newStatus) {
            $this->updateQuietly(['status' => $newStatus]);
        }
    }
}