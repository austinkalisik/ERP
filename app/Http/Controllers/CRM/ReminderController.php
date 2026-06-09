<?php

namespace App\Http\Controllers\CRM;

use App\Http\Controllers\Controller;
use App\Models\CRM\CrmRenewalReminder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class ReminderController extends Controller
{
    /**
     * GET /api/crm/reminders
     * Returns the last 100 reminders sent — shown in the Reminders tab.
     */
    public function index(Request $request): JsonResponse
    {
        $reminders = CrmRenewalReminder::with([
            'subscription.client:id,name,email',
            'subscription.service:id,name',
        ])
        ->orderByDesc('created_at')
        ->limit(100)
        ->get()
        ->map(fn($r) => [
            'id'                  => $r->id,
            'subscription_id'     => $r->subscription_id,
            'client_name'         => $r->subscription?->client?->name    ?? '—',
            'client_email'        => $r->subscription?->client?->email   ?? '—',
            'service_name'        => $r->subscription?->service?->name   ?? '—',
            'days_before'         => $r->days_before,
            'expiry_date_at_send' => $r->expiry_date_at_send?->toDateString(),
            'email_sent'          => $r->email_sent,
            'notification_sent'   => $r->notification_sent,
            'sent_at'             => $r->created_at?->toDateTimeString(),
        ]);

        // Summary counts
        $total     = CrmRenewalReminder::count();
        $thisMonth = CrmRenewalReminder::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return response()->json([
            'data'    => $reminders,
            'summary' => [
                'total'      => $total,
                'this_month' => $thisMonth,
            ],
        ]);
    }

    /**
     * POST /api/crm/reminders/run
     * Manually triggers the reminder command — system_admin only.
     * Useful for testing or re-running after a mail config fix.
     */
    public function run(Request $request): JsonResponse
    {
        $dryRun = $request->boolean('dry_run', false);

        $exitCode = Artisan::call('crm:send-renewal-reminders', [
            '--dry-run' => $dryRun,
        ]);

        $output = Artisan::output();

        return response()->json([
            'message'   => $dryRun ? 'Dry run complete — no emails sent.' : 'Reminder command executed.',
            'exit_code' => $exitCode,
            'output'    => $output,
        ]);
    }
}