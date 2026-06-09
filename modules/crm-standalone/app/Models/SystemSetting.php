<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

#[Fillable(['key', 'value'])]
class SystemSetting extends Model
{
    public static function getValue(string $key, ?string $default = null): ?string
    {
        $value = Cache::rememberForever(static::cacheKey($key), fn () => static::query()
            ->where('key', $key)
            ->value('value'));

        return $value ?? $default;
    }

    public static function setValue(string $key, ?string $value): void
    {
        static::query()->updateOrCreate(['key' => $key], ['value' => $value]);
        Cache::forget(static::cacheKey($key));
    }

    public static function getBrandLogoUrl(): ?string
    {
        $value = static::getValue('brand_logo_url');

        if (blank($value)) {
            return null;
        }

        $path = parse_url($value, PHP_URL_PATH) ?: $value;
        $filename = basename($path);

        if ($filename === '' || $filename === '.' || $filename === '..') {
            return null;
        }

        if (str_contains($path, '/storage/branding/') || str_contains($path, 'branding/')) {
            return route('branding.logo', ['filename' => $filename], false);
        }

        return $value;
    }

    private static function cacheKey(string $key): string
    {
        return "system_settings.{$key}";
    }
}
