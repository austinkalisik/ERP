<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Models\User;
use App\Models\CRM\CrmSubscription;
use App\Notifications\CRM\SubscriptionExpiringNotification;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| MOMS — Maintenance Due Check
| Runs daily at 07:00 AM to check engine hours and due dates,
| then sends in-app notifications to all MOMS users.
|--------------------------------------------------------------------------
*/
Schedule::command('moms:check-maintenance-due')->dailyAt('07:00');

/*
|--------------------------------------------------------------------------
| CRM — Expiring Subscription Notifications
| Runs daily at 08:00 AM — notifies managers of subscriptions
| expiring within 7 days.
|--------------------------------------------------------------------------
*/
Schedule::call(function () {
    $expiring = CrmSubscription::query()
        ->where('status', 'Expiring')
        ->whereDate('expiry_date', '<=', now()->addDays(7))
        ->whereDate('expiry_date', '>=', now())
        ->with(['client', 'service'])   // ← load both
        ->get();

    foreach ($expiring as $sub) {
        $daysLeft = (int) now()->diffInDays($sub->expiry_date, false);

        User::whereIn('role', ['system_admin', 'crm_manager', 'crm_staff'])
            ->get()
            ->each(fn($u) => $u->notify(
                new SubscriptionExpiringNotification(
                    clientName:     $sub->client->name     ?? 'Unknown Client',
                    serviceName:    $sub->service->name    ?? 'Unknown Service',
                    daysLeft:       $daysLeft,
                    subscriptionId: $sub->id,
                )
            ));
    }
})->dailyAt('08:00')->name('notify-expiring-subscriptions')->withoutOverlapping();