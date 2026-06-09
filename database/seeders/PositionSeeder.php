<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PositionSeeder extends Seeder
{
    public function run()
    {
        DB::table('positions')->insert([
            ['name' => 'Department Head'],
            ['name' => 'Supervisor'],
            ['name' => 'Assistant Supervisor'],
            ['name' => 'Manager'],
            ['name' => 'Team Lead'],
        ]);
    }
}

