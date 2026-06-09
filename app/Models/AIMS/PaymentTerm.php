<?php

namespace App\Models\AIMS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentTerm extends Model
{
      use HasFactory;

    protected $table = 'payment_terms';

    protected $fillable = [
        'name',
        'days',
    ];
    
}
