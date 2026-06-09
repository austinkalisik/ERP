<?php

namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class DealInvoice extends Model
{
    protected $table = 'deal_invoices';

    protected $fillable = [
        'deal_id', 'recorded_by', 'invoice_number', 'amount', 'currency',
        'status', 'issue_date', 'due_date', 'paid_date', 'notes',
    ];

    protected $casts = [
        'amount'    => 'decimal:2',
        'issue_date' => 'date',
        'due_date'   => 'date',
        'paid_date'  => 'date',
    ];

    public function deal()
    {
        return $this->belongsTo(Deal::class);
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}