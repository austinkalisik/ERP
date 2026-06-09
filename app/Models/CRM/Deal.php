<?php

namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Traits\Auditable;

class Deal extends Model
{
    use Auditable;

    protected $table = 'deals';

    protected $fillable = [
        'client_id', 'service_id', 'assigned_to', 'title', 'category',
        'priority', 'stage', 'value', 'currency', 'expected_close_date',
        'actual_close_date', 'description', 'notes', 'project_status',
    ];

    protected $casts = [
        'value'               => 'decimal:2',
        'expected_close_date' => 'date',
        'actual_close_date'   => 'date',
    ];

    public function client()
    {
        return $this->belongsTo(CrmClient::class, 'client_id');
    }

    public function service()
    {
        return $this->belongsTo(CrmService::class, 'service_id');
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function documents()
    {
        return $this->hasMany(DealDocument::class)->latest();
    }

    public function invoices()
    {
        return $this->hasMany(DealInvoice::class)->latest();
    }
}