<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MOMS\MaintenanceSchedule;
use App\Models\User;
use App\Notifications\MOMS\MaintenanceDueNotification;

class CheckMaintenanceDue extends Command
{
    protected $signature   = 'moms:check-maintenance-due';
    protected $description = 'Check for maintenance schedules due by date or engine hours and notify MOMS users';

    public function handle(): void
    {
        $momsUsers = User::whereIn('role', [
            'system_admin',
            'moms_manager',
            'moms_supervisor',
            'moms_operator',
        ])->get();

        if ($momsUsers->isEmpty()) {
            $this->info('No MOMS users found.');
            return;
        }

        $activeSchedules = MaintenanceSchedule::with('machine')
            ->where('is_active', true)
            ->get();

        $notified = 0;

        foreach ($activeSchedules as $schedule) {
            $machine      = $schedule->machine;
            $shouldNotify = false;
            $reason       = null;

            // Check 1: Hours-based
            if (
                $schedule->hour_interval &&
                $schedule->next_due_hours &&
                $machine &&
                $machine->engine_hours >= $schedule->next_due_hours
            ) {
                $shouldNotify = true;
                $reason       = 'hours';
            }

            // Check 2: Date-based
            if (
                !$shouldNotify &&
                $schedule->next_due_date &&
                $schedule->next_due_date->isPast()
            ) {
                $shouldNotify = true;
                $reason       = 'date';
            }

            if ($shouldNotify) {
                foreach ($momsUsers as $user) {
                    // Avoid duplicate notifications — skip if already notified today
                    $alreadyNotified = $user->notifications()
                        ->where('type', MaintenanceDueNotification::class)
                        ->whereDate('created_at', today())
                        ->whereJsonContains('data->schedule_id', $schedule->id)
                        ->exists();

                    if (!$alreadyNotified) {
                        $user->notify(new MaintenanceDueNotification($schedule, $reason));
                        $notified++;
                    }
                }
            }
        }

        $this->info("Done. {$notified} notification(s) sent.");
    }
}