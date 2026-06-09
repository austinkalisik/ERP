<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('office:reset-empty {--force : Run without confirmation}', function () {
    if (! $this->option('force') && ! $this->confirm('This removes operational office data and keeps only the admin login. Continue?')) {
        $this->warn('Reset cancelled.');

        return 1;
    }

    $tables = [
        'asset_logs',
        'stock_movements',
        'assignments',
        'system_notifications',
        'assets',
        'items',
        'receivers',
        'departments',
        'categories',
        'suppliers',
        'password_reset_tokens',
        'sessions',
        'jobs',
        'failed_jobs',
    ];

    DB::statement('SET FOREIGN_KEY_CHECKS=0');

    foreach ($tables as $table) {
        if (DB::getSchemaBuilder()->hasTable($table)) {
            DB::table($table)->truncate();
        }
    }

    DB::table('users')->delete();

    DB::table('users')->insert([
        'name' => 'System Administrator',
        'email' => 'admin@nextgen.net',
        'email_verified_at' => now(),
        'password' => Hash::make('password'),
        'role' => 'admin',
        'remember_token' => null,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    DB::statement('SET FOREIGN_KEY_CHECKS=1');

    $this->info('Office data reset complete.');
    $this->line('Login email: admin@nextgen.net');
    $this->line('Login password: password');

    return 0;
})->purpose('Reset office operational data and keep one admin user');
