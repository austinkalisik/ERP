<?php

namespace App\Traits;

use App\Services\AuditService;

trait Auditable
{
    /**
     * Boot the auditable trait
     */
    protected static function bootAuditable()
    {
        // ✅ Log when model is created
        static::created(function ($model) {
            // Refresh the model to get any database-set values (like current_stock)
            $model->refresh();
            AuditService::created($model);
        });

        // ✅ Log when model is updated (but NOT on creation)
        static::updated(function ($model) {
            // Skip if model was just created (wasRecentlyCreated)
            if ($model->wasRecentlyCreated) {
                return;
            }
            
            $oldValues = $model->getOriginal();
            AuditService::updated($model, $oldValues);
        });

        // ✅ Log when model is deleted
        static::deleted(function ($model) {
            AuditService::deleted($model);
        });
    }

    /**
     * Get audit logs for this model
     */
    public function auditLogs()
    {
        return \App\Models\AuditLog::where('model_type', get_class($this))
            ->where('model_id', $this->id)
            ->latest()
            ->get();
    }
}