<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Models\SecuritySetting;
use Illuminate\Console\Command;

class PurgeAuditLogs extends Command
{
    protected $signature   = 'audit:purge';
    protected $description = 'Delete audit_logs entries older than the configured retention period.';

    public function handle(): int
    {
        $settings  = SecuritySetting::current();
        $retention = $settings->audit_log_retention_days;

        if ($retention === 0) {
            $this->info('Retention is set to Forever — nothing purged.');
            return self::SUCCESS;
        }

        $cutoff  = now()->subDays($retention);
        $deleted = AuditLog::where('created_at', '<', $cutoff)->delete();

        $this->info("Purged {$deleted} audit log entries older than {$retention} days (before {$cutoff->toDateString()}).");

        return self::SUCCESS;
    }
}