<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'ticket_number',
        'title',
        'description',
        'client_id',
        'service_id',
        'requester_name',
        'requester_email',
        'assignee_name',
        'team',
        'department',
        'category',
        'priority',
        'status',
        'due_date',
        'reported_at',
        'due_at',
        'resolved_at',
        'sla_minutes',
        'internal_notes',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'reported_at' => 'datetime',
            'due_at' => 'datetime',
            'resolved_at' => 'datetime',
            'internal_notes' => 'array',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TicketComment::class)->latest();
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(TicketAttachment::class)->latest();
    }

    public function activities(): HasMany
    {
        return $this->hasMany(TicketActivity::class)->latest();
    }
}
