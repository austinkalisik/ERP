<?php

namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CrmRenewalReminder extends Model
{
    protected $table = 'crm_renewal_reminders';

    protected $fillable = [
        'subscription_id',
        'days_before',
        'expiry_date_at_send',
        'channel',
        'email_sent',
        'notification_sent',
    ];

    protected $casts = [
        'expiry_date_at_send' => 'date',
        'email_sent'          => 'boolean',
        'notification_sent'   => 'boolean',
    ];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(CrmSubscription::class, 'subscription_id');
    }
}