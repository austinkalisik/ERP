<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Assignment extends Model
{
    protected $fillable = [
        'item_id',
        'user_id',
        'receiver_id',
        'receiver_name',
        'department_id',
        'quantity',
        'assigned_at',
        'returned_at',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'assigned_at' => 'datetime',
        'returned_at' => 'datetime',
    ];

    protected $appends = [
        'is_active',
        'receiver_label',
    ];

    protected $hidden = [
        'created_at',
        'updated_at',
    ];

    public function getIsActiveAttribute(): bool
    {
        return $this->isActive();
    }

    public function getReceiverLabelAttribute(): string
    {
        return $this->receiver_name ?: ($this->receiver?->name ?? ($this->user?->name ?? '-'));
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(Receiver::class);
    }

    public function assignedDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function isActive(): bool
    {
        return $this->returned_at === null;
    }
}
