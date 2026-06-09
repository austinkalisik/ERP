<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

#[Fillable([
    'customer_id',
    'assigned_to',
    'domain_name',
    'service_type',
    'plan',
    'status',
    'requested_start_date',
    'renewal_date',
    'quoted_amount',
    'requirements',
    'internal_notes',
])]
class DomainHostingRequest extends Model
{
    use HasFactory;

    public const DOMAIN_SERVICE_TYPES = [
        'domain_hosting',
        'website_hosting',
        'email_hosting',
        'email_antispam',
        'ssl',
        'domain_transfer',
    ];

    public const SUPPORT_SERVICE_TYPES = [
        'isp_connectivity',
        'network_infrastructure',
        'cctv_security',
        'document_management',
        'vehicle_tracking',
        'audio_visual',
        'web_app_development',
        'support_contract',
    ];

    protected function casts(): array
    {
        return [
            'requested_start_date' => 'date',
            'renewal_date' => 'date',
            'quoted_amount' => 'decimal:2',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereNotIn('status', ['completed', 'cancelled']);
    }

    public function scopeDomainServices(Builder $query): Builder
    {
        return $query->whereIn('service_type', self::DOMAIN_SERVICE_TYPES);
    }

    public function scopeSupportServices(Builder $query): Builder
    {
        return $query->whereIn('service_type', self::SUPPORT_SERVICE_TYPES);
    }

    public function scopeDomainRegistrations(Builder $query): Builder
    {
        return $query->where('service_type', 'domain_registration');
    }
}
