<?php

namespace App\Models\AIMS;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;


class InvoiceApproval extends Model
{

    const ACTION_APPROVED = 'approved';
    const ACTION_REJECTED = 'rejected';
    const ACTION_CANCELLED = 'cancelled';

    protected $table = 'invoice_approvals';

    protected $fillable = [
        'invoice_id',
        'user_id',
        'action',
        'remarks',
    ];

    /**
     * Relationships
     */

    // Approval belongs to an invoice
    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    // Approval belongs to a user (approver)
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
