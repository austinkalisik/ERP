<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['name' => 'Dell Supplier', 'email' => 'dell@supplier.local', 'phone' => '+6757000001'],
            ['name' => 'HP Supplier', 'email' => 'hp@supplier.local', 'phone' => '+6757000002'],
            ['name' => 'Cisco Distributor', 'email' => 'cisco@supplier.local', 'phone' => '+6757000003'],
        ];

        foreach ($rows as $row) {
            Supplier::updateOrCreate(['email' => $row['email']], $row);
        }
    }
}
