<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\HRMS\LeaveType;
use Illuminate\Support\Facades\Schema;

class LeaveTypeSeeder extends Seeder
{
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        LeaveType::truncate();
        Schema::enableForeignKeyConstraints();

        $types = [
            ['leave_type' => 'Annual Leave',        'leave_code' => 'AL',  'num_hours' => 8],
            ['leave_type' => 'R&R',                 'leave_code' => 'RNR', 'num_hours' => 8],
            ['leave_type' => 'Sick Leave',           'leave_code' => 'SL',  'num_hours' => 8],
            ['leave_type' => 'Special Leave',        'leave_code' => 'SPL', 'num_hours' => 8],
        ];

        foreach ($types as $type) {
            LeaveType::create($type);
        }
    }
}
