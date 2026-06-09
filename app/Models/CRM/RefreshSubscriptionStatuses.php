<?php

namespace App\Console\Commands;

use App\Models\CRM\CrmSubscription;
use App\Models\User;
use App\Notifications\CRM\SubscriptionExpiringNotification;
use App\Notifications\CRM\SubscriptionExpiredNotification;
use Illuminate\Console\Command;

/**
 * Register in app/Console/Kernel.php:
 *   $schedule->command('crm:refresh-subscriptions')->dailyAt('00:05');
 *
 * Run manually:
 *   php artisan crm:refresh-subscriptions
 */
class RefreshSubscriptionStatuses extends Command
{
    protected $signature   = 'crm:refresh-subscriptions';
    protected $description = 'Refresh CRM subscription statuses and send expiry notifications';

    public function handle(): void
    {
        $today    = now()->startOfDay();
        $todayStr = $today->toDateString();
        $day30    = $today->copy()->addDays(30)->toDateString();
        $day7     = $today->copy()->addDays(7)->toDateString();

        $notifyUsers = User::whereIn('role', ['system_admin', 'crm_manager'])->get();

        // 1. Mark newly expired
        $justExpired = CrmSubscription::with(['client:id,name', 'service:id,name'])
            ->where('expiry_date', '<', $todayStr)
            ->whereNotIn('status', ['Expired', 'Suspended'])
            ->get();

        foreach ($justExpired as $sub) {
            $sub->updateQuietly(['status' => 'Expired']);
            $notifyUsers->each(fn($u) => $u->notify(new SubscriptionExpiredNotification($sub)));
            $this->line("Expired: #{$sub->id} {$sub->client?->name} — {$sub->service?->name}");
        }

        // 2. Mark Active → Expiring (within 30 days)
        CrmSubscription::whereBetween('expiry_date', [$todayStr, $day30])
            ->where('status', 'Active')
            ->update(['status' => 'Expiring']);

        // 3. Restore Expiring → Active (expiry extended beyond 30 days)
        CrmSubscription::where('expiry_date', '>', $day30)
            ->where('status', 'Expiring')
            ->update(['status' => 'Active']);

        // 4. Send 30-day expiry notifications
        $expiring30 = CrmSubscription::with(['client:id,name', 'service:id,name'])
            ->whereDate('expiry_date', $day30)
            ->where('status', 'Expiring')
            ->get();

        foreach ($expiring30 as $sub) {
            $notifyUsers->each(fn($u) => $u->notify(new SubscriptionExpiringNotification(
                $sub->client?->name ?? 'Unknown',
                $sub->service?->name ?? 'Unknown',
                30,
                $sub->id,
            )));
            $this->line("Expiring (30d): #{$sub->id} {$sub->client?->name}");
        }

        // 5. Send 7-day expiry notifications
        $expiring7 = CrmSubscription::with(['client:id,name', 'service:id,name'])
            ->whereDate('expiry_date', $day7)
            ->where('status', 'Expiring')
            ->get();

        foreach ($expiring7 as $sub) {
            $notifyUsers->each(fn($u) => $u->notify(new SubscriptionExpiringNotification(
                $sub->client?->name ?? 'Unknown',
                $sub->service?->name ?? 'Unknown',
                7,
                $sub->id,
            )));
            $this->line("Expiring (7d): #{$sub->id} {$sub->client?->name}");
        }

        $this->info('CRM subscription statuses refreshed successfully.');
    }
}