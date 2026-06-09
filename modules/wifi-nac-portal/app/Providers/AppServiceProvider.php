<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureMailFromSettings();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    protected function configureMailFromSettings(): void
    {
        try {
            if (! Schema::hasTable('system_settings')) {
                return;
            }

            $settings = SystemSetting::query()
                ->whereIn('key', [
                    'email_from_address',
                    'email_from_name',
                    'mail_host',
                    'mail_port',
                    'mail_scheme',
                    'mail_username',
                    'mail_password',
                ])
                ->pluck('value', 'key');

            if ($settings->isEmpty()) {
                return;
            }

            $mailHost = $this->mailSetting($settings, 'mail_host', 'mail.mailers.smtp.host');
            $mailPort = $this->mailSetting($settings, 'mail_port', 'mail.mailers.smtp.port');
            $fromAddress = $this->mailSetting($settings, 'email_from_address', 'mail.from.address');

            config([
                'mail.default' => 'smtp',
                'mail.from.address' => $fromAddress,
                'mail.from.name' => $this->mailSetting($settings, 'email_from_name', 'mail.from.name'),
                'mail.mailers.smtp.host' => $mailHost,
                'mail.mailers.smtp.port' => (int) $mailPort,
                'mail.mailers.smtp.scheme' => $this->mailSetting($settings, 'mail_scheme', 'mail.mailers.smtp.scheme') ?: null,
                'mail.mailers.smtp.username' => $this->mailSetting($settings, 'mail_username', 'mail.mailers.smtp.username') ?: null,
                'mail.mailers.smtp.password' => $this->mailSetting($settings, 'mail_password', 'mail.mailers.smtp.password') ?: null,
            ]);
        } catch (\Throwable) {
            return;
        }
    }

    /**
     * @param  \Illuminate\Support\Collection<string, string|null>  $settings
     */
    private function mailSetting($settings, string $settingKey, string $configKey): mixed
    {
        $value = $settings->get($settingKey);
        $fallback = config($configKey);

        if (blank($value)) {
            return $fallback;
        }

        if ($settingKey === 'mail_host' && $value === '127.0.0.1' && $fallback !== '127.0.0.1') {
            return $fallback;
        }

        if ($settingKey === 'mail_port' && (string) $value === '2525' && (string) $fallback !== '2525') {
            return $fallback;
        }

        if ($settingKey === 'email_from_address' && $value === 'hello@example.com' && $fallback !== 'hello@example.com') {
            return $fallback;
        }

        return $value;
    }
}
