<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\HRMS\OvertimeType;

class OvertimeTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['overtime_type' => 'Regular OT',          'overtime_code' => 'REGOT', 'multiplier' => 1.50],
            ['overtime_type' => 'Night Shift OT',       'overtime_code' => 'NSDOT', 'multiplier' => 1.10],
            ['overtime_type' => 'Off Day OT',           'overtime_code' => 'ODOT',  'multiplier' => 2.00],
            ['overtime_type' => 'Public Holiday Work',  'overtime_code' => 'PHW',   'multiplier' => 2.00],
        ];

        foreach ($types as $type) {
            OvertimeType::firstOrCreate(
                ['overtime_code' => $type['overtime_code']],
                $type
            );
        }
    }
}