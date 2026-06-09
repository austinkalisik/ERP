<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Department;
use App\Models\Item;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class ItemSeeder extends Seeder
{
    public function run(): void
    {
        $laptop = Category::where('name', 'Laptops')->first();
        $network = Category::where('name', 'Networking')->first();
        $printer = Category::where('name', 'Printers')->first();

        $itSupport = Department::where('name', 'IT Support')->first();
        $networking = Department::where('name', 'Networking')->first();
        $admin = Department::where('name', 'Administration')->first();

        $dell = Supplier::where('email', 'dell@supplier.local')->first();
        $hp = Supplier::where('email', 'hp@supplier.local')->first();
        $cisco = Supplier::where('email', 'cisco@supplier.local')->first();

        $rows = [
            [
                'name' => 'Dell Latitude 5440',
                'sku' => 'DELL-LAT-5440',
                'brand' => 'Dell',
                'description' => 'Business laptop with 14-inch display, Intel Core i7',
                'category_id' => $laptop?->id,
                'supplier_id' => $dell?->id,
                'asset_tag' => 'NGA-0001',
                'serial_number' => 'DL5440-001',
                'quantity' => 5,
                'unit_of_measurement' => 'unit',
                'reorder_level' => 2,
                'unit_cost' => 1200.00,
                'status' => 'available',
                'location' => 'Port Moresby HQ',
                'purchase_date' => '2026-01-10',
            ],
            [
                'name' => 'HP LaserJet Pro 4003',
                'sku' => 'HP-LJP-4003',
                'brand' => 'HP',
                'description' => 'Professional laser printer, 35 ppm, network enabled',
                'category_id' => $printer?->id,
                'supplier_id' => $hp?->id,
                'asset_tag' => 'NGA-0002',
                'serial_number' => 'HP4003-002',
                'quantity' => 2,
                'unit_of_measurement' => 'unit',
                'reorder_level' => 1,
                'unit_cost' => 800.00,
                'status' => 'maintenance',
                'location' => 'Admin Office',
                'purchase_date' => '2026-01-12',
            ],
            [
                'name' => 'Cisco Catalyst 9200',
                'sku' => 'CISCO-CAT-9200',
                'brand' => 'Cisco',
                'description' => 'Enterprise-class switch, 48-port Gigabit',
                'category_id' => $network?->id,
                'supplier_id' => $cisco?->id,
                'asset_tag' => 'NGA-0003',
                'serial_number' => 'CS9200-003',
                'quantity' => 1,
                'unit_of_measurement' => 'unit',
                'reorder_level' => 1,
                'unit_cost' => 5000.00,
                'status' => 'available',
                'location' => 'Server Room',
                'purchase_date' => '2026-01-15',
            ],
        ];

        foreach ($rows as $row) {
            Item::updateOrCreate(
                ['asset_tag' => $row['asset_tag']],
                $row
            );
        }
    }
}
