<?php

namespace App\Providers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;
use Symfony\Component\HttpFoundation\Request as SymfonyRequest;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        if ((bool) config('app.force_https')) {
            URL::forceScheme('https');
        }

        // Trust local reverse proxies so HTTPS is detected correctly behind Caddy.
        SymfonyRequest::setTrustedProxies(
            ['127.0.0.1', '::1', '192.168.88.133'],
            SymfonyRequest::HEADER_X_FORWARDED_FOR
                | SymfonyRequest::HEADER_X_FORWARDED_HOST
                | SymfonyRequest::HEADER_X_FORWARDED_PORT
                | SymfonyRequest::HEADER_X_FORWARDED_PROTO
                | SymfonyRequest::HEADER_X_FORWARDED_PREFIX
        );

        View::composer('*', function ($view) {
            $appSettings = [
                'system_name' => 'Nextgen Assets Management System',
                'system_tagline' => 'Owned by Nextgen Technology',
            ];

            try {
                if (Schema::hasTable('settings')) {
                    $settings = DB::table('settings')
                        ->whereIn('key', ['system_name', 'system_tagline'])
                        ->pluck('value', 'key')
                        ->toArray();

                    $appSettings['system_name'] = $settings['system_name'] ?? $appSettings['system_name'];
                    $appSettings['system_tagline'] = $settings['system_tagline'] ?? $appSettings['system_tagline'];
                }
            } catch (\Throwable $e) {
                //
            }

            $view->with('appSettings', $appSettings);
        });
    }
}
