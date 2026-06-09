<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    protected $fillable = [
        'user_id',
        'user_name',
        'user_role',
        'model_type',
        'model_id',
        'action',
        'description',
        'old_values',
        'new_values',
        'changes',
        'ip_address',
        'user_agent',
        'module',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'changes' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Get the user who performed the action
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the affected model (polymorphic)
     */
    public function model()
    {
        if ($this->model_type && $this->model_id) {
            return $this->model_type::find($this->model_id);
        }
        return null;
    }

    /**
     * Scope: Filter by module
     */
    public function scopeModule($query, string $module)
    {
        return $query->where('module', $module);
    }

    /**
     * Scope: Filter by action
     */
    public function scopeAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope: Filter by user
     */
    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope: Filter by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Scope: Recent logs
     */
    public function scopeRecent($query, int $limit = 50)
    {
        return $query->latest()->limit($limit);
    }

    /**
     * Get formatted changes for display
     */
    public function getFormattedChangesAttribute()
    {
        if (!$this->changes) {
            return [];
        }

        $formatted = [];
        foreach ($this->changes as $field => $values) {
            $formatted[] = [
                'field' => ucfirst(str_replace('_', ' ', $field)),
                'old' => $values['old'] ?? null,
                'new' => $values['new'] ?? null,
            ];
        }

        return $formatted;
    }

    /**
     * Get human-readable model name
     */
    public function getModelNameAttribute()
    {
        if (!$this->model_type) {
            return 'System';
        }

        $parts = explode('\\', $this->model_type);
        return end($parts);
    }
}