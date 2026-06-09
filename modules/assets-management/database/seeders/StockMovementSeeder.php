<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;

class StockMovementSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', 'admin')->first();
        if (! $admin) {
            $admin = User::first();
        }

        $dell = Supplier::where('email', 'dell@supplier.local')->first();
        $hp = Supplier::where('email', 'hp@supplier.local')->first();
        $cisco = Supplier::where('email', 'cisco@supplier.local')->first();

        // Get items
        $dellLaptop = Item::where('asset_tag', 'NGA-0001')->first();
        $hpPrinter = Item::where('asset_tag', 'NGA-0002')->first();
        $ciscoSwitch = Item::where('asset_tag', 'NGA-0003')->first();

        if ($admin) {
            // Initial stock in movements
            if ($dellLaptop) {
                StockMovement::updateOrCreate(
                    [
                        'item_id' => $dellLaptop->id,
                        'type' => 'IN',
                        'reference_no' => 'PO-2026-001',
                    ],
                    [
                        'quantity' => 5,
                        'supplier_id' => $dell?->id,
                        'notes' => 'Initial stock receipt from Dell',
                        'user_id' => $admin->id,
                        'created_at' => now()->subDays(30),
                    ]
                );
            }

            if ($hpPrinter) {
                StockMovement::updateOrCreate(
                    [
                        'item_id' => $hpPrinter->id,
                        'type' => 'IN',
                        'reference_no' => 'PO-2026-002',
                    ],
                    [
                        'quantity' => 3,
                        'supplier_id' => $hp?->id,
                        'notes' => 'Initial stock receipt from HP',
                        'user_id' => $admin->id,
                        'created_at' => now()->subDays(28),
                    ]
                );

                // Stock out for maintenance
                StockMovement::updateOrCreate(
                    [
                        'item_id' => $hpPrinter->id,
                        'type' => 'OUT',
                        'reference_no' => 'MAINT-2026-001',
                    ],
                    [
                        'quantity' => 1,
                        'notes' => 'Moved to Maintenance for repair',
                        'user_id' => $admin->id,
                        'created_at' => now()->subDays(10),
                    ]
                );
            }

            if ($ciscoSwitch) {
                StockMovement::updateOrCreate(
                    [
                        'item_id' => $ciscoSwitch->id,
                        'type' => 'IN',
                        'reference_no' => 'PO-2026-003',
                    ],
                    [
                        'quantity' => 1,
                        'supplier_id' => $cisco?->id,
                        'notes' => 'Initial stock receipt from Cisco',
                        'user_id' => $admin->id,
                        'created_at' => now()->subDays(25),
                    ]
                );
            }
        }
    }
}
