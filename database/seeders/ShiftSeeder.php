<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use App\Models\HRMS\Shift;

class ShiftSeeder extends Seeder
{
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        Shift::truncate();
        Schema::enableForeignKeyConstraints();

        $shifts = [
            [
                'shift_name' => 'Day Shift',
                'start_time' => '06:00:00',
                'end_time'   => '18:00:00',  // 12 hours
            ],
            [
                'shift_name' => 'Night Shift',
                'start_time' => '18:00:00',
                'end_time'   => '06:00:00',  // 12 hours (next day)
            ],
        ];

        foreach ($shifts as $shift) {
            Shift::create($shift);
        }
    }
}
