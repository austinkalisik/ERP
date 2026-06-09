<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class SecuritySetting extends Model
{
    use Auditable;

    protected $table = 'security_settings';

    protected $fillable = [
        'session_timeout',
        'max_login_attempts',
        'lockout_duration',
        'password_expiry_days',
        'min_password_length',
        'require_strong_password',
        'audit_log_retention_days',
        'two_factor_enabled',
    ];

    protected $casts = [
        'session_timeout'          => 'integer',
        'max_login_attempts'       => 'integer',
        'lockout_duration'         => 'integer',
        'password_expiry_days'     => 'integer',
        'min_password_length'      => 'integer',
        'require_strong_password'  => 'boolean',
        'audit_log_retention_days' => 'integer',
        'two_factor_enabled'       => 'boolean',
    ];

    /**
     * Singleton — always returns the one row.
     * Creates it with defaults if missing.
     */
    public static function current(): self
    {
        return static::firstOrCreate([], [
            'session_timeout'          => 30,
            'max_login_attempts'       => 5,
            'lockout_duration'         => 15,
            'password_expiry_days'     => 90,
            'min_password_length'      => 8,
            'require_strong_password'  => true,
            'audit_log_retention_days' => 90,
            'two_factor_enabled'       => false,
        ]);
    }
}