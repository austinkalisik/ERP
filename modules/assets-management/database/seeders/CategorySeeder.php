<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['name' => 'Laptops', 'description' => 'Portable computers'],
            ['name' => 'Networking', 'description' => 'Routers, switches, firewalls'],
            ['name' => 'Printers', 'description' => 'Printers and scanners'],
            ['name' => 'Accessories', 'description' => 'Monitors, keyboards, mice'],
        ];

        foreach ($rows as $row) {
            Category::updateOrCreate(['name' => $row['name']], $row);
        }
    }
}
