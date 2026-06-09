<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['name' => 'IT Support'],
            ['name' => 'Networking'],
            ['name' => 'Administration'],
            ['name' => 'Operations'],
        ];

        foreach ($rows as $row) {
            Department::updateOrCreate(['name' => $row['name']], $row);
        }
    }
}
