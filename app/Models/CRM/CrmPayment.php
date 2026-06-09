<?php

namespace App\Models\CRM;

use App\Models\CRM\CrmSubscription;
use App\Models\Attachment;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class CrmPayment extends Model
{
    protected $table = 'crm_payments';

    protected $fillable = [
        'subscription_id',
        'amount',
        'payment_date',
        'period_from',
        'period_to',
        'notes',
        'recorded_by',
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'payment_date' => 'date',
        'period_from'  => 'date',
        'period_to'    => 'date',
    ];

    public function subscription()
    {
        return $this->belongsTo(CrmSubscription::class, 'subscription_id');
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function attachments()
    {
        return $this->morphMany(Attachment::class, 'attachable')
                    ->orderBy('created_at', 'desc');
    }
}