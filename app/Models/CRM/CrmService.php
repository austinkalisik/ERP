<?php

namespace App\Models\CRM;

use App\Models\CRM\CrmSubscription;
use Illuminate\Database\Eloquent\Model;

class CrmService extends Model
{
    protected $table    = 'crm_services';
    protected $fillable = ['name', 'description', 'is_active'];
    protected $casts    = ['is_active' => 'boolean'];

    public function subscriptions()
    {
        return $this->hasMany(CrmSubscription::class, 'service_id');
    }
}