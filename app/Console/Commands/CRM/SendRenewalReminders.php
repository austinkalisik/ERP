<?php

namespace App\Console\Commands\CRM;

use App\Mail\CRM\RenewalReminderEmail;
use App\Models\CRM\CrmRenewalReminder;
use App\Models\CRM\CrmSubscription;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use App\Notifications\CRM\RenewalReminderNotification;

class SendRenewalReminders extends Command
{
    protected $signature   = 'crm:send-renewal-reminders {--dry-run : Preview what would be sent without sending}';
    protected $description = 'Send renewal reminder emails and dashboard notifications for subscriptions expiring in 30, 14, or 7 days';

    /**
     * Reminder thresholds in days before expiry.
     * 30 days = heads-up, 14 days = action needed, 7 days = urgent.
     */
    private const THRESHOLDS = [30, 14, 7];

    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');
        $today    = now()->startOfDay();

        $this->info($isDryRun
            ? '=== DRY RUN — no emails will be sent ==='
            : '=== CRM Renewal Reminders ==='
        );
        $this->info("Running for: {$today->format('d M Y')}");

        $sent    = 0;
        $skipped = 0;
        $failed  = 0;

        foreach (self::THRESHOLDS as $daysBefore) {

            $targetDate = $today->copy()->addDays($daysBefore)->toDateString();

            // Subscriptions expiring exactly on the target date,
            // Active or Expiring, with a valid client email.
            $subscriptions = CrmSubscription::with([
                'client:id,name,contact_person,email,phone',
                'service:id,name',
            ])
            ->whereDate('expiry_date', $targetDate)
            ->whereIn('status', ['Active', 'Expiring'])
            ->whereHas('client', fn($q) =>
                $q->whereNotNull('email')->where('email', '!=', '')
            )
            ->get();

            $this->line("\n[{$daysBefore}d window] Target: {$targetDate} — {$subscriptions->count()} subscription(s)");

            foreach ($subscriptions as $sub) {

                $expiryDate = $sub->expiry_date->toDateString();

                // Skip if already sent for this expiry cycle
                $alreadySent = CrmRenewalReminder::where('subscription_id',   $sub->id)
                    ->where('days_before',         $daysBefore)
                    ->where('expiry_date_at_send', $expiryDate)
                    ->exists();

                if ($alreadySent) {
                    $this->line("  SKIP  #{$sub->id} {$sub->client->name} — already sent");
                    $skipped++;
                    continue;
                }

                $data = [
                    'client_name'     => $sub->client->name,
                    'contact_person'  => $sub->client->contact_person,
                    'email'           => $sub->client->email,
                    'service_name'    => $sub->service->name,
                    'billing_cycle'   => $sub->billing_cycle,
                    'amount'          => $sub->amount,
                    'expiry_date'     => $expiryDate,
                    'days_left'       => $daysBefore,
                    'subscription_id' => $sub->id,
                ];

                // Dry run — just preview, no sending
                if ($isDryRun) {
                    $this->line("  DRY   #{$sub->id} {$sub->client->name} → {$sub->client->email} ({$daysBefore}d)");
                    continue;
                }

                $emailOk        = false;
                $notificationOk = false;

                // ── Email ─────────────────────────────────────────────────────
                try {
                    Mail::to($sub->client->email)
                        ->send(new RenewalReminderEmail($data));
                    $emailOk = true;
                    $this->line("  EMAIL ✓ #{$sub->id} {$sub->client->name} → {$sub->client->email}");
                } catch (\Throwable $e) {
                    Log::error("CRM reminder email failed for subscription #{$sub->id}: {$e->getMessage()}");
                    $this->error("  EMAIL ✗ #{$sub->id} {$sub->client->name} — {$e->getMessage()}");
                    $failed++;
                }

                // ── Dashboard notification → all CRM staff ────────────────────
                try {
                    $crmUsers = User::whereIn('role', ['system_admin', 'crm_manager', 'crm_staff'])->get();
                    Notification::send($crmUsers, new RenewalReminderNotification($data));
                    $notificationOk = true;
                    $this->line("  NOTIF ✓ #{$sub->id} → {$crmUsers->count()} user(s)");
                } catch (\Throwable $e) {
                    Log::error("CRM reminder notification failed for subscription #{$sub->id}: {$e->getMessage()}");
                    $this->error("  NOTIF ✗ #{$sub->id} — {$e->getMessage()}");
                }

                // ── Record so it won't fire again this cycle ──────────────────
                if ($emailOk || $notificationOk) {
                    CrmRenewalReminder::create([
                        'subscription_id'     => $sub->id,
                        'days_before'         => $daysBefore,
                        'expiry_date_at_send' => $expiryDate,
                        'channel'             => 'both',
                        'email_sent'          => $emailOk,
                        'notification_sent'   => $notificationOk,
                    ]);
                    $sent++;
                }
            }
        }

        $this->newLine();
        $this->info("Done. Sent: {$sent} | Skipped (already sent): {$skipped} | Failed: {$failed}");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}