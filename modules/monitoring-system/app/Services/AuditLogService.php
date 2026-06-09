<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditLogService
{
    public function record(?int $userId, string $action, ?Model $subject = null, array $metadata = [], ?Request $request = null): AuditLog
    {
        return AuditLog::create([
            'user_id' => $userId,
            'action' => $action,
            'auditable_type' => $subject ? $subject::class : null,
            'auditable_id' => $subject?->getKey(),
            'metadata' => $metadata,
            'ip_address' => $request?->ip(),
        ]);
    }
}
