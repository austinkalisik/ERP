<?php

namespace App\Http\Controllers;

use App\Models\HRMS\Employee;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        return response()->json([
            "employees" => Employee::count(),
            "payroll" => DB::getSchemaBuilder()->hasTable('payrolls')
                ? DB::table('payrolls')->count()
                : 0,
            "inventory" => DB::table('items')->count(),
            "lowStock" => DB::table('items')
                ->whereColumn('current_stock', '<=', 'minimum_stock')
                ->count(),
            "systemUsers" => DB::table('users')->count(),
            "recentActivity" => "System loaded successfully."
        ]);
    }
}
