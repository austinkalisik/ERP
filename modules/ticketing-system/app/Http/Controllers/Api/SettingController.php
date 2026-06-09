<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SettingController extends Controller
{
    private const DEFAULTS = [
        'company_name' => 'Nextgen Technology Limited',
        'website_url' => 'https://nextgenpng.net/',
        'support_email' => 'support@nextgenpng.net',
        'support_phone' => '+675 7999 8999',
        'office_address' => 'Port Moresby, PNG',
        'profile_name' => 'Nextgen Support Desk',
        'profile_role' => 'Service Operations',
        'profile_photo' => '',
        'default_sla_minutes' => '1440',
        'notifications_enabled' => '1',
    ];

    public function show(): JsonResponse
    {
        return response()->json($this->settings());
    }

    public function update(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'company_name' => ['required', 'string', 'max:255'],
            'website_url' => ['required', 'url', 'max:255'],
            'support_email' => ['required', 'email', 'max:255'],
            'support_phone' => ['required', 'string', 'max:50'],
            'office_address' => ['nullable', 'string', 'max:500'],
            'profile_name' => ['required', 'string', 'max:255'],
            'profile_role' => ['required', 'string', 'max:255'],
            'profile_photo' => ['nullable', 'string', 'max:1048576'],
            'default_sla_minutes' => ['nullable', 'integer', 'min:15', 'max:525600'],
            'notifications_enabled' => ['nullable', 'boolean'],
        ]);

        $data = $validator->validate();

        foreach (array_keys(self::DEFAULTS) as $key) {
            SystemSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $data[$key] ?? '']
            );
        }

        return response()->json($this->settings());
    }

    private function settings(): array
    {
        $stored = SystemSetting::query()->pluck('value', 'key')->all();

        return array_replace(self::DEFAULTS, $stored);
    }
}
