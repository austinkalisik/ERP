<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('departments')->insert([
            ['name' => 'IT', 'prefix' => 'IT'],
            ['name' => 'HR', 'prefix' => 'HR'],
            ['name' => 'Finance', 'prefix' => 'FI'],
            ['name' => 'Operations', 'prefix' => 'OP'],
        ]);
    }
}
