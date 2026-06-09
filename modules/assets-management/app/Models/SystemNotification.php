<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemNotification extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'priority',
        'title',
        'message',
        'url',
        'source_type',
        'source_id',
        'data',
        'read_at',
    ];

    protected $appends = ['is_read'];

    protected $hidden = [
        'updated_at',
    ];

    public function getIsReadAttribute(): bool
    {
        return $this->isRead();
    }

    protected function casts(): array
    {
        return [
            'data' => 'array',
            'read_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isRead(): bool
    {
        return ! is_null($this->read_at);
    }
}
