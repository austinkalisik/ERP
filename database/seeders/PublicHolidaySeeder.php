<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PublicHolidaySeeder extends Seeder
{
    public function run(): void
    {
        $holidays = [
            ['name' => "New Year's Day",         'date' => '2026-01-01', 'recurring' => true],
            ['name' => 'Easter Monday',           'date' => '2026-04-06', 'recurring' => false],
            ['name' => "Queen's Birthday",        'date' => '2026-06-08', 'recurring' => false],
            ['name' => 'Remembrance Day',         'date' => '2026-07-23', 'recurring' => true],
            ['name' => 'Repentance Day',          'date' => '2026-08-26', 'recurring' => true],
            ['name' => 'Independence Day',        'date' => '2026-09-16', 'recurring' => true],
            ['name' => 'Milne Bay Day',           'date' => '2026-10-23', 'recurring' => true],
            ['name' => 'All Saints Day',          'date' => '2026-11-01', 'recurring' => true],
            ['name' => 'Christmas Day',           'date' => '2026-12-25', 'recurring' => true],
            ['name' => 'Boxing Day',              'date' => '2026-12-26', 'recurring' => true],
        ];

        foreach ($holidays as $holiday) {
            DB::table('public_holidays')->updateOrInsert(
                ['name' => $holiday['name'], 'date' => $holiday['date']],
                array_merge($holiday, [
                    'type'        => 'Public Holiday',
                    'description' => null,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ])
            );
        }
    }
}