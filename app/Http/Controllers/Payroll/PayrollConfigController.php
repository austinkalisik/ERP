<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PayrollConfigController extends Controller
{
    // GET /api/payroll/settings/config
    public function index()
    {
        $config = DB::table('payroll_config')->orderBy('id')->get();
        return response()->json($config);
    }

    // PUT /api/payroll/settings/config
    // Accepts: { key: value, key: value, ... }
    public function update(Request $request)
    {
        $data = $request->validate([
            'tax_rate'               => 'sometimes|numeric|min:0|max:1',
            'nasfund_rate'           => 'sometimes|numeric|min:0|max:1',
            'hours_per_day'          => 'sometimes|numeric|min:1|max:24',
            'leave_hours_per_day'    => 'sometimes|numeric|min:1|max:24',
            'standard_days_per_month'=> 'sometimes|numeric|min:1|max:31',
        ]);

        foreach ($data as $key => $value) {
            DB::table('payroll_config')
                ->where('key', $key)
                ->update(['value' => $value, 'updated_at' => now()]);
        }

        return response()->json([
            'message' => 'Payroll configuration updated successfully',
            'data'    => DB::table('payroll_config')->orderBy('id')->get(),
        ]);
    }
}