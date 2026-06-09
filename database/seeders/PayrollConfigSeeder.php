<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PayrollConfigSeeder extends Seeder
{
    public function run(): void
    {
        $configs = [
            [
                'key'         => 'tax_rate',
                'value'       => '0.10',
                'label'       => 'Income Tax Rate',
                'description' => 'Percentage of gross pay deducted as income tax (e.g. 0.10 = 10%)',
            ],
            [
                'key'         => 'nasfund_rate',
                'value'       => '0.06',
                'label'       => 'NASFUND Contribution Rate',
                'description' => 'Percentage of gross pay contributed to NASFUND (e.g. 0.06 = 6%)',
            ],
            [
                'key'         => 'hours_per_day',
                'value'       => '12',
                'label'       => 'Working Hours Per Day',
                'description' => 'Standard hours worked per day for attendance pay calculation',
            ],
            [
                'key'         => 'leave_hours_per_day',
                'value'       => '8',
                'label'       => 'Leave Hours Per Day',
                'description' => 'Hours paid per leave day (may differ from working hours)',
            ],
            [
                'key'         => 'standard_days_per_month',
                'value'       => '22',
                'label'       => 'Standard Working Days Per Month',
                'description' => 'Used to convert monthly/annual salary to hourly rate',
            ],
        ];

        foreach ($configs as $config) {
            DB::table('payroll_config')->updateOrInsert(
                ['key' => $config['key']],
                array_merge($config, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}