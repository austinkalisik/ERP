<?php

namespace App\Models\AIMS;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Supplier extends Model
{
    use Auditable;
    
    protected $fillable = [
        'name',
        'contact_person',
        'phone',
        'email',
        'address',
    ];

    public function items()
    {
        return $this->hasMany(Item::class);
    }
}
