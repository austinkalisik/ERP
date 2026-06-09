<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SystemSetting;

class SettingsController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | GET /api/settings/general
    |--------------------------------------------------------------------------
    | Returns snake_case keys to match the React frontend (SettingsPage.jsx
    | and SettingsContext.jsx both use snake_case: company_name, date_format).
    |--------------------------------------------------------------------------
    */
    public function show()
    {
        $settings = SystemSetting::first();

        if (!$settings) {
            $settings = SystemSetting::create([]);
        }

        // ✅ snake_case keys — matches formData in GeneralSettings component
        return response()->json([
            'company_name'    => $settings->company_name,
            'company_address' => $settings->company_address,
            'email'           => $settings->email,
            'phone'           => $settings->phone,
            'country'         => $settings->country,
            'timezone'        => $settings->timezone,
            'currency'        => $settings->currency,
            'date_format'     => $settings->date_format,
            'language'        => $settings->language,
            'theme'           => $settings->theme,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | POST /api/settings/general
    |--------------------------------------------------------------------------
    | Reads snake_case keys from the request body — matches what the React
    | frontend sends via settingsApi.saveGeneral(formData).
    |--------------------------------------------------------------------------
    */
    public function store(Request $request)
    {
        $settings = SystemSetting::firstOrCreate([]);

        // ✅ snake_case request keys — matches formData keys sent from frontend
        $settings->update([
            'company_name'    => $request->company_name,
            'company_address' => $request->company_address,
            'email'           => $request->email,
            'phone'           => $request->phone,
            'country'         => $request->country,
            'timezone'        => $request->timezone,
            'currency'        => $request->currency,
            'date_format'     => $request->date_format,
            'language'        => $request->language,
            'theme'           => $request->theme,
        ]);

        return response()->json(['success' => true]);
    }

    /*
    |--------------------------------------------------------------------------
    | POST /api/settings/modules
    |--------------------------------------------------------------------------
    */
    public function saveModules(Request $request)
    {
        $settings = SystemSetting::firstOrCreate([]);
        // Store enabled modules as JSON if you add a modules column later
        return response()->json(['success' => true]);
    }
}