<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FinanceRecord extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'client_id',
        'invoice_number',
        'amount',
        'status',
        'issued_at',
        'due_at',
    ];
}
