<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InventoryItemSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            /*
            |----------------------------------------------------------------------
            | Spare Parts
            |----------------------------------------------------------------------
            */
            [
                'item_type'              => 'Inventory Item',
                'status'                 => 'Active',
                'location'               => 'Main Warehouse',
                'name'                   => 'Hydraulic Filter - HF-200',
                'sku'                    => 'SPR-001-HF200',
                'barcode'                => '9310099000011',
                'category'               => 'Spare Parts',
                'brand'                  => 'Donaldson',       // Industry-standard hydraulic filter brand
                'unit'                   => 'Pieces',
                'supplier_id'            => null,
                'lead_time'              => 7,
                'preferred_purchase_qty' => 20,
                'cost_price'             => 85.00,
                'selling_price'          => 110.00,
                'valuation_method'       => 'FIFO',
                'current_stock'          => 45,
                'minimum_stock'          => 10,
                'maximum_stock'          => 100,
                'reorder_quantity'       => 20,
                'notes'                  => 'Used in heavy equipment hydraulic systems.',
            ],
            [
                'item_type'              => 'Inventory Item',
                'status'                 => 'Active',
                'location'               => 'Main Warehouse',
                'name'                   => 'V-Belt Drive - Type B78',
                'sku'                    => 'SPR-002-VB78',
                'barcode'                => '9310099000022',
                'category'               => 'Spare Parts',
                'brand'                  => 'Gates',           // Gates is the leading V-belt manufacturer worldwide
                'unit'                   => 'Pieces',
                'supplier_id'            => null,
                'lead_time'              => 5,
                'preferred_purchase_qty' => 15,
                'cost_price'             => 42.50,
                'selling_price'          => 65.00,
                'valuation_method'       => 'FIFO',
                'current_stock'          => 30,
                'minimum_stock'          => 5,
                'maximum_stock'          => 60,
                'reorder_quantity'       => 15,
                'notes'                  => 'Standard belt for conveyor and pump drives.',
            ],
            [
                'item_type'              => 'Inventory Item',
                'status'                 => 'Active',
                'location'               => 'Main Warehouse',
                'name'                   => 'Bearing Assembly - 6205ZZ',
                'sku'                    => 'SPR-003-BA6205',
                'barcode'                => '9310099000033',
                'category'               => 'Spare Parts',
                'brand'                  => 'SKF',             // SKF is the world-leading bearing manufacturer
                'unit'                   => 'Pieces',
                'supplier_id'            => null,
                'lead_time'              => 10,
                'preferred_purchase_qty' => 10,
                'cost_price'             => 35.00,
                'selling_price'          => 52.00,
                'valuation_method'       => 'FIFO',
                'current_stock'          => 20,
                'minimum_stock'          => 5,
                'maximum_stock'          => 50,
                'reorder_quantity'       => 10,
                'notes'                  => 'Deep groove ball bearing for motor shafts.',
            ],

            /*
            |----------------------------------------------------------------------
            | Consumables
            |----------------------------------------------------------------------
            */
            [
                'item_type'              => 'Consumable',
                'status'                 => 'Active',
                'location'               => 'Main Warehouse',
                'name'                   => 'Engine Oil SAE 40 - 5L',
                'sku'                    => 'CON-001-EO40',
                'barcode'                => '9310099000044',
                'category'               => 'Consumables',
                'brand'                  => 'Shell',           // Shell Rimula is the standard diesel engine oil in PNG
                'unit'                   => 'Liters',
                'supplier_id'            => null,
                'lead_time'              => 3,
                'preferred_purchase_qty' => 50,
                'cost_price'             => 28.00,
                'selling_price'          => 40.00,
                'valuation_method'       => 'FIFO',
                'current_stock'          => 120,
                'minimum_stock'          => 20,
                'maximum_stock'          => 200,
                'reorder_quantity'       => 50,
                'notes'                  => 'Multi-grade engine oil for diesel engines.',
            ],
            [
                'item_type'              => 'Consumable',
                'status'                 => 'Active',
                'location'               => 'Secondary Storage',
                'name'                   => 'Welding Rod E6013 - 2.5mm',
                'sku'                    => 'CON-002-WR6013',
                'barcode'                => '9310099000055',
                'category'               => 'Consumables',
                'brand'                  => 'Lincoln Electric',  // Lincoln Electric is the global leader in welding products
                'unit'                   => 'Kilograms',
                'supplier_id'            => null,
                'lead_time'              => 5,
                'preferred_purchase_qty' => 25,
                'cost_price'             => 18.50,
                'selling_price'          => 27.00,
                'valuation_method'       => 'Weighted Average',
                'current_stock'          => 75,
                'minimum_stock'          => 15,
                'maximum_stock'          => 150,
                'reorder_quantity'       => 25,
                'notes'                  => 'General purpose welding electrode.',
            ],
            [
                'item_type'              => 'Consumable',
                'status'                 => 'Active',
                'location'               => 'Main Warehouse',
                'name'                   => 'Safety Gloves - Cut Resistant (Pair)',
                'sku'                    => 'CON-003-SG-CR',
                'barcode'                => '9310099000066',
                'category'               => 'Consumables',
                'brand'                  => 'Ansell',          // Ansell is the leading PPE glove brand in industrial settings
                'unit'                   => 'Pieces',
                'supplier_id'            => null,
                'lead_time'              => 7,
                'preferred_purchase_qty' => 30,
                'cost_price'             => 12.00,
                'selling_price'          => 18.00,
                'valuation_method'       => 'FIFO',
                'current_stock'          => 60,
                'minimum_stock'          => 10,
                'maximum_stock'          => 120,
                'reorder_quantity'       => 30,
                'notes'                  => 'PPE gloves for workshop and field operations.',
            ],

            /*
            |----------------------------------------------------------------------
            | Tools & Equipment
            |----------------------------------------------------------------------
            */
            [
                'item_type'              => 'Inventory Item',
                'status'                 => 'Active',
                'location'               => 'Main Warehouse',
                'name'                   => 'Angle Grinder 4.5" - 900W',
                'sku'                    => 'TOL-001-AG900',
                'barcode'                => '9310099000077',
                'category'               => 'Tools & Equipment',
                'brand'                  => 'Bosch',           // Bosch Professional is the standard for power tools
                'unit'                   => 'Pieces',
                'supplier_id'            => null,
                'lead_time'              => 14,
                'preferred_purchase_qty' => 5,
                'cost_price'             => 320.00,
                'selling_price'          => 420.00,
                'valuation_method'       => 'FIFO',
                'current_stock'          => 8,
                'minimum_stock'          => 2,
                'maximum_stock'          => 20,
                'reorder_quantity'       => 5,
                'notes'                  => 'Used for cutting and grinding metal surfaces.',
            ],
            [
                'item_type'              => 'Inventory Item',
                'status'                 => 'Active',
                'location'               => 'Main Warehouse',
                'name'                   => 'Digital Vernier Caliper 150mm',
                'sku'                    => 'TOL-002-DVC150',
                'barcode'                => '9310099000088',
                'category'               => 'Tools & Equipment',
                'brand'                  => 'Mitutoyo',        // Mitutoyo is the world's most trusted precision measurement brand
                'unit'                   => 'Pieces',
                'supplier_id'            => null,
                'lead_time'              => 10,
                'preferred_purchase_qty' => 5,
                'cost_price'             => 180.00,
                'selling_price'          => 240.00,
                'valuation_method'       => 'FIFO',
                'current_stock'          => 6,
                'minimum_stock'          => 2,
                'maximum_stock'          => 15,
                'reorder_quantity'       => 5,
                'notes'                  => 'Precision measurement tool for machined parts.',
            ],

            /*
            |----------------------------------------------------------------------
            | Raw Materials
            |----------------------------------------------------------------------
            */
            [
                'item_type'              => 'Inventory Item',
                'status'                 => 'Active',
                'location'               => 'Secondary Storage',
                'name'                   => 'Mild Steel Flat Bar 50x6mm (6m)',
                'sku'                    => 'RAW-001-FB50X6',
                'barcode'                => '9310099000099',
                'category'               => 'Raw Materials',
                'brand'                  => 'OneSteel',        // OneSteel (now InfraBuild) is the primary steel supplier in the Pacific
                'unit'                   => 'Meters',
                'supplier_id'            => null,
                'lead_time'              => 7,
                'preferred_purchase_qty' => 20,
                'cost_price'             => 55.00,
                'selling_price'          => 75.00,
                'valuation_method'       => 'Weighted Average',
                'current_stock'          => 40,
                'minimum_stock'          => 10,
                'maximum_stock'          => 80,
                'reorder_quantity'       => 20,
                'notes'                  => '6-metre lengths. Used in fabrication and framing.',
            ],
            [
                'item_type'              => 'Inventory Item',
                'status'                 => 'Active',
                'location'               => 'Secondary Storage',
                'name'                   => 'Galvanised Wire Rope 8mm (per metre)',
                'sku'                    => 'RAW-002-GWR8',
                'barcode'                => '9310099000100',
                'category'               => 'Raw Materials',
                'brand'                  => 'Bridon-Bekaert',  // Bridon-Bekaert is the world's leading wire rope manufacturer
                'unit'                   => 'Meters',
                'supplier_id'            => null,
                'lead_time'              => 14,
                'preferred_purchase_qty' => 50,
                'cost_price'             => 8.50,
                'selling_price'          => 13.00,
                'valuation_method'       => 'Weighted Average',
                'current_stock'          => 200,
                'minimum_stock'          => 50,
                'maximum_stock'          => 500,
                'reorder_quantity'       => 100,
                'notes'                  => 'Used for rigging, hoisting, and securing loads.',
            ],
        ];

        foreach ($items as $item) {
            DB::table('items')->insertOrIgnore(array_merge($item, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }
}