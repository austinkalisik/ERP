<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IntegrationSetting;
use App\Services\AuditLogService;
use Illuminate\Http\Request;

class IntegrationSettingController extends Controller
{
    public function index()
    {
        return IntegrationSetting::orderBy('type')->get()->map(function ($setting) {
            $data = $setting->toArray();
            $data['settings'] = collect($data['settings'] ?? [])->map(fn ($v, $k) => str_contains((string) $k, 'password') || str_contains((string) $k, 'secret') ? '********' : $v);
            return $data;
        });
    }

    public function update(Request $request, IntegrationSetting $integrationSetting, AuditLogService $audit)
    {
        $data = $request->validate(['name' => ['sometimes', 'string'], 'settings' => ['sometimes', 'array'], 'enabled' => ['sometimes', 'boolean']]);
        $integrationSetting->update($data);
        $audit->record($request->user()->id, 'integration.updated', $integrationSetting, ['type' => $integrationSetting->type], $request);
        return $integrationSetting;
    }
}
