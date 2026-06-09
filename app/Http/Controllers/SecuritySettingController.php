<?php

namespace App\Http\Controllers;

use App\Models\SecuritySetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SecuritySettingController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json(SecuritySetting::current());
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_timeout'          => 'sometimes|integer|min:5|max:1440',
            'max_login_attempts'       => 'sometimes|integer|min:3|max:20',
            'lockout_duration'         => 'sometimes|integer|min:1|max:1440',
            'password_expiry_days'     => 'sometimes|integer|min:0|max:365',
            'min_password_length'      => 'sometimes|integer|min:6|max:128',
            'require_strong_password'  => 'sometimes|boolean',
            'audit_log_retention_days' => 'sometimes|integer|min:0|max:3650',
            'two_factor_enabled'       => 'sometimes|boolean',
        ]);

        $settings = SecuritySetting::current();
        $settings->update($validated);

        return response()->json([
            'message'  => 'Security settings saved successfully.',
            'settings' => $settings->fresh(),
        ]);
    }
}