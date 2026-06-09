<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    protected function ensureDefaults(): void
    {
        $defaults = [
            'system_name' => 'Nextgen Assets Management System',
            'system_tagline' => 'Owned by Nextgen Technology',
            'company_name' => 'NextGen Technology',
            'company_website' => 'https://nextgenpng.net/',
            'support_email' => 'support@nextgenpng.net',
            'low_stock_threshold' => '5',
            'assignment_overdue_days' => '7',
            'items_per_page' => '10',
            'email_notifications_enabled' => '1',
            'maintenance_alerts_enabled' => '1',
            'allow_user_impersonation' => '1',
            'system_logo' => '',
        ];

        foreach ($defaults as $key => $value) {
            $exists = DB::table('settings')->where('key', $key)->exists();

            if (! $exists) {
                DB::table('settings')->insert([
                    'key' => $key,
                    'value' => $value,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    protected function getSettingValue(string $key): ?string
    {
        $row = DB::table('settings')->where('key', $key)->first();

        return $row?->value;
    }

    protected function upsertSetting(string $key, ?string $value): void
    {
        $exists = DB::table('settings')->where('key', $key)->exists();

        if ($exists) {
            DB::table('settings')
                ->where('key', $key)
                ->update([
                    'value' => $value,
                    'updated_at' => now(),
                ]);

            return;
        }

        DB::table('settings')->insert([
            'key' => $key,
            'value' => $value,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function index()
    {
        $this->ensureDefaults();

        return response()->json(
            DB::table('settings')
                ->orderBy('key')
                ->get()
        );
    }

    public function update(Request $request, string $key)
    {
        $validated = $request->validate([
            'value' => ['nullable', 'string'],
        ]);

        $this->upsertSetting($key, $validated['value'] ?? null);

        return response()->json([
            'message' => 'Setting updated',
        ]);
    }

    public function uploadLogo(Request $request)
    {
        $this->ensureDefaults();

        $request->validate([
            'system_logo' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,svg', 'max:2048'],
        ]);

        $oldLogo = $this->getSettingValue('system_logo');

        if ($oldLogo && Storage::disk('public')->exists($oldLogo)) {
            Storage::disk('public')->delete($oldLogo);
        }

        $path = $request->file('system_logo')->store('branding', 'public');

        $this->upsertSetting('system_logo', $path);

        return response()->json([
            'message' => 'System logo updated successfully.',
            'path' => $path,
        ]);
    }

    public function deleteLogo()
    {
        $this->ensureDefaults();

        $oldLogo = $this->getSettingValue('system_logo');

        if ($oldLogo && Storage::disk('public')->exists($oldLogo)) {
            Storage::disk('public')->delete($oldLogo);
        }

        $this->upsertSetting('system_logo', '');

        return response()->json([
            'message' => 'System logo removed successfully.',
        ]);
    }

    public function showLogo()
    {
        $this->ensureDefaults();

        $logo = $this->getSettingValue('system_logo');

        if (! $logo || ! Storage::disk('public')->exists($logo)) {
            abort(404);
        }

        $path = Storage::disk('public')->path($logo);
        $mime = mime_content_type($path) ?: 'application/octet-stream';

        return response()->file($path, [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
