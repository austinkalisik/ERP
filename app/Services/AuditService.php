<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditService
{
    private const SENSITIVE_FIELDS = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'api_key',
        'api_secret',
        'secret',
        'token',
    ];

    /**
     * Fields that are noisy and not worth tracking in audit logs.
     * e.g. timestamps that change on every save.
     */
    private const EXCLUDED_FIELDS = [
        'updated_at',
        'created_at',
        'deleted_at',
        'email_verified_at',
    ];

    /**
     * Core log writer — all other methods funnel through here.
     */
    public static function log(
        string $action,
        $model = null,
        ?string $description = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $module = null
    ): AuditLog {
        $user   = Auth::user();
        $isHttp = app()->runningInConsole() === false;

        // Sanitise values before storing
        $oldValues = $oldValues ? self::sanitise($oldValues) : null;
        $newValues = $newValues ? self::sanitise($newValues) : null;

        $changes = null;
        if ($oldValues && $newValues) {
            $changes = self::calculateChanges($oldValues, $newValues);
        }

        return AuditLog::create([
            'user_id'     => $user?->id,
            'user_name'   => $user?->name,
            'user_role'   => $user?->role,
            'model_type'  => $model ? get_class($model) : null,
            'model_id'    => $model?->id,
            'action'      => $action,
            'description' => $description ?? self::generateDescription($action, $model),
            'old_values'  => $oldValues,
            'new_values'  => $newValues,
            'changes'     => $changes,
            'ip_address'  => $isHttp ? Request::ip()        : 'CLI',
            'user_agent'  => $isHttp ? Request::userAgent() : 'CLI',
            'module'      => $module ?? self::detectModule($model),
        ]);
    }

    // ── Standard CRUD actions ─────────────────────────────────────────────────

    public static function created($model, ?string $module = null): AuditLog
    {
        return self::log('created', $model, null, null, $model->toArray(), $module);
    }

    public static function updated($model, array $oldValues, ?string $module = null): AuditLog
    {
        return self::log('updated', $model, null, $oldValues, $model->toArray(), $module);
    }

    public static function deleted($model, ?string $module = null): AuditLog
    {
        return self::log('deleted', $model, null, $model->toArray(), null, $module);
    }

    // ── Auth actions ──────────────────────────────────────────────────────────

    public static function login(): AuditLog
    {
        return self::log('login', Auth::user(), Auth::user()->name . ' logged in');
    }

    public static function logout(): AuditLog
    {
        return self::log('logout', Auth::user(), Auth::user()->name . ' logged out');
    }

    // ── Workflow actions ──────────────────────────────────────────────────────

    public static function approved($model, ?string $module = null): AuditLog
    {
        return self::log('approved', $model, null, ['status' => 'pending'], ['status' => 'approved'], $module);
    }

    public static function rejected($model, ?string $module = null): AuditLog
    {
        return self::log('rejected', $model, null, ['status' => 'pending'], ['status' => 'rejected'], $module);
    }

    // ── AIMS-specific ─────────────────────────────────────────────────────────

    public static function stockMovement(
        string $type,
        $item,
        int $quantity,
        ?string $reference = null
    ): AuditLog {
        $action = $type === 'IN' ? 'stock_in' : 'stock_out';

        return self::log(
            $action,
            $item,
            "Stock {$type}: {$quantity} units of {$item->name}" .
                ($reference ? " (Ref: {$reference})" : ''),
            null,
            ['quantity' => $quantity, 'type' => $type, 'reference' => $reference],
            'AIMS'
        );
    }

    // ── Custom freeform action ────────────────────────────────────────────────

    public static function custom(
        string $action,
        string $description,
        $model = null,
        ?string $module = null,
        ?array $additionalData = null
    ): AuditLog {
        return self::log($action, $model, $description, null, $additionalData, $module);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Mask sensitive fields and strip noisy timestamp fields.
     * Real-world systems (AWS CloudTrail, Datadog, Splunk) always do this
     * to prevent credentials leaking into audit logs.
     */
    private static function sanitise(array $values): array
    {
        $result = [];

        foreach ($values as $key => $value) {
            // Drop noisy fields entirely
            if (in_array($key, self::EXCLUDED_FIELDS)) {
                continue;
            }

            // Mask sensitive fields — store '[REDACTED]' not the actual value
            if (in_array(strtolower($key), self::SENSITIVE_FIELDS)) {
                $result[$key] = '[REDACTED]';
                continue;
            }

            $result[$key] = $value;
        }

        return $result;
    }

    /**
     * Only record fields that actually changed.
     * Skips unchanged fields to keep the log clean and readable.
     */
    private static function calculateChanges(array $old, array $new): array
    {
        $changes = [];

        // Check what changed in new values
        foreach ($new as $key => $value) {
            $oldValue = $old[$key] ?? null;

            // Loose comparison handles int/string mismatches from DB casting
            if ($oldValue != $value) {
                $changes[$key] = [
                    'old' => $oldValue,
                    'new' => $value,
                ];
            }
        }

        // Also catch fields that were removed (set to null/deleted)
        foreach ($old as $key => $value) {
            if (!array_key_exists($key, $new) && $value !== null) {
                $changes[$key] = [
                    'old' => $value,
                    'new' => null,
                ];
            }
        }

        return $changes;
    }

    /**
     * Auto-generate a human-readable description when none is provided.
     * Uses 'name', 'title', 'code', or falls back to ID.
     */
    private static function generateDescription(string $action, $model): string
    {
        if (!$model) {
            return ucfirst($action);
        }

        $modelName  = class_basename($model);
        $identifier = $model->name
            ?? $model->title
            ?? $model->code
            ?? $model->fullname
            ?? $model->slug
            ?? ('#' . ($model->id ?? '?'));

        return ucfirst($action) . " {$modelName}: {$identifier}";
    }

    
    private static function detectModule($model): ?string
    {
        if (!$model) return null;

        $class = get_class($model);

        
        if (str_contains($class, 'AIMS'))    return 'AIMS';
        if (str_contains($class, 'HRMS'))    return 'HRMS';
        if (str_contains($class, 'Payroll')) return 'Payroll';
        if (str_contains($class, 'MOMS'))    return 'MOMS';

        
        $basename = class_basename($model);

        return match ($basename) {
            'User'            => 'Users',
            'Permission'      => 'Settings',
            'SecuritySetting' => 'Settings',
            'SystemSetting'   => 'Settings',
            'Attachment'      => 'System',
            'AuditLog'        => 'System',   
            default           => 'System',
        };
    }
}