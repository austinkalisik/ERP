<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use App\Models\MOMS\Machine;

class MachineSeeder extends Seeder
{
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        Machine::truncate();
        Schema::enableForeignKeyConstraints();

        $machines = [

            // ── Excavators (from real form: 1200-6, 6015B, XE2000) ────────────
            [
                'category'         => 'Excavator',
                'make'             => 'Hitachi',
                'model'            => 'EX1200-6',
                'engine_hours'     => 0,
                'fuel_capacity'    => 1400,
                'status'           => 'Active',
                'location'         => 'Mine Operations',
            ],
            [
                'category'         => 'Excavator',
                'make'             => 'Caterpillar',
                'model'            => '6015B',
                'engine_hours'     => 0,
                'fuel_capacity'    => 1700,
                'status'           => 'Active',
                'location'         => 'Mine Operations',
            ],
            [
                'category'         => 'Excavator',
                'make'             => 'XCMG',
                'model'            => 'XE2000',
                'engine_hours'     => 0,
                'fuel_capacity'    => 1600,
                'status'           => 'Active',
                'location'         => 'Mine Operations',
            ],

            // ── OHT Trucks (from real form: 785, 777, XDE130, XDE260) ─────────
            [
                'category'         => 'OHT Truck',
                'make'             => 'Caterpillar',
                'model'            => '785',
                'engine_hours'     => 0,
                'fuel_capacity'    => 3400,
                'status'           => 'Active',
                'location'         => 'Mine Operations',
            ],
            [
                'category'         => 'OHT Truck',
                'make'             => 'Caterpillar',
                'model'            => '777',
                'engine_hours'     => 0,
                'fuel_capacity'    => 2800,
                'status'           => 'Active',
                'location'         => 'Mine Operations',
            ],
            [
                'category'         => 'OHT Truck',
                'make'             => 'XCMG',
                'model'            => 'XDE130',
                'engine_hours'     => 0,
                'fuel_capacity'    => 2200,
                'status'           => 'Active',
                'location'         => 'Mine Operations',
            ],
            [
                'category'         => 'OHT Truck',
                'make'             => 'XCMG',
                'model'            => 'XDE260',
                'engine_hours'     => 0,
                'fuel_capacity'    => 3800,
                'status'           => 'Active',
                'location'         => 'Mine Operations',
            ],

            // ── Bulldozers ────────────────────────────────────────────────────
            [
                'category'         => 'Bulldozer',
                'make'             => 'Caterpillar',
                'model'            => 'D9T',
                'engine_hours'     => 0,
                'fuel_capacity'    => 1100,
                'status'           => 'Active',
                'location'         => 'Mine Operations',
            ],
            [
                'category'         => 'Bulldozer',
                'make'             => 'Komatsu',
                'model'            => 'D375A',
                'engine_hours'     => 0,
                'fuel_capacity'    => 1000,
                'status'           => 'Active',
                'location'         => 'Mine Operations',
            ],

            // ── Dozer ─────────────────────────────────────────────────────────
            [
                'category'         => 'Dozer',
                'make'             => 'Caterpillar',
                'model'            => 'D6T',
                'engine_hours'     => 0,
                'fuel_capacity'    => 500,
                'status'           => 'Active',
                'location'         => 'Mine Operations',
            ],

            // ── Light Vehicles (from real form: LV-690251) ───────────────────
            [
                'category'         => 'Light Vehicle',
                'make'             => 'Toyota',
                'model'            => 'Landcruiser 79',
                'engine_hours'     => 0,
                'fuel_capacity'    => 130,
                'status'           => 'Active',
                'location'         => 'Site Office',
            ],
            [
                'category'         => 'Light Vehicle',
                'make'             => 'Toyota',
                'model'            => 'Hilux',
                'engine_hours'     => 0,
                'fuel_capacity'    => 80,
                'status'           => 'Active',
                'location'         => 'Site Office',
            ],

            // ── Loader ────────────────────────────────────────────────────────
            [
                'category'         => 'Loader',
                'make'             => 'Caterpillar',
                'model'            => '992K',
                'engine_hours'     => 0,
                'fuel_capacity'    => 800,
                'status'           => 'Active',
                'location'         => 'Mine Operations',
            ],

            // ── Grader ────────────────────────────────────────────────────────
            [
                'category'         => 'Grader',
                'make'             => 'Caterpillar',
                'model'            => '16M',
                'engine_hours'     => 0,
                'fuel_capacity'    => 450,
                'status'           => 'Active',
                'location'         => 'Civil & Infrastructure',
            ],
        ];

        foreach ($machines as $machineData) {
            $prefix = Machine::getCategoryPrefix($machineData['category']);

            $lastNumber = Machine::where('machine_id', 'LIKE', $prefix . '-%')
                ->pluck('machine_id')
                ->map(fn (string $machineId): int => (int) substr($machineId, strlen($prefix) + 1))
                ->max();

            if ($lastNumber) {
                $nextNumber = $lastNumber + 1;
            } else {
                $nextNumber = 1;
            }

            $machineData['machine_id'] = $prefix . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);

            Machine::create($machineData);
        }
    }
}
