<?php

namespace App\Models\CRM;

use App\Models\CRM\CrmSubscription;
use Illuminate\Database\Eloquent\Model;

class CrmServiceInterruption extends Model
{
    protected $table = 'crm_service_interruptions';

    protected $fillable = [
        'subscription_id',
        'from_date',
        'to_date',
        'credit_days',
        'reason',
    ];

    protected $casts = [
        'from_date'   => 'date',
        'to_date'     => 'date',
        'credit_days' => 'integer',
    ];

    public function subscription()
    {
        return $this->belongsTo(CrmSubscription::class, 'subscription_id');
    }
}