<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use App\Models\MOMS\ChecklistTemplate;

class ChecklistTemplateSeeder extends Seeder
{
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        ChecklistTemplate::truncate();
        Schema::enableForeignKeyConstraints();

        $now = now();
        $rows = [];

        foreach ($this->data() as $category => $items) {
            foreach ($items as $i => $text) {
                $rows[] = [
                    'category'    => $category,
                    'item_number' => $i + 1,
                    'item_text'   => $text,
                    'is_active'   => true,
                    'sort_order'  => $i + 1,
                    'created_at'   => $now,
                    'updated_at'   => $now,
                ];
            }
        }

        ChecklistTemplate::insert($rows);
    }

    private function data(): array
    {
        return [

            // ─────────────────────────────────────────────────────────────────
            // EXCAVATOR — 40 items (from real form: 1200-6, 6015B, XE2000)
            // Image 4 — exactly as written on paper form
            // ─────────────────────────────────────────────────────────────────
            'Excavator' => [
                'Cabin clean condition',
                'Seats – suspension adjustment/condition',
                'Seat belt inspection / use',
                'Windows and glass',
                'Rear-view mirrors',
                'Doors',
                'Interior trim panels',
                'Automatic fire suppression (FSS) – Pressure Gauge Check (Green / Red)',
                'Portable fire extinguisher (Green / Red)',
                'Automatic Step ladder operation',
                'Automatic lubrication operates normally (Level Tank)',
                'Hydraulic Oil Level',
                'Engine oil level',
                'Coolant level',
                'Cooling system hoses and hose clamps',
                'Engine idle speed 800±30r/min',
                'Engine max speed 1900±50r/min',
                'Is the horn loud/clear?',
                'Start switch operation',
                'Camera',
                'Radio Player',
                'No system warning on display',
                'Are the battery terminals securely connected?',
                'Safe Mine',
                'Wipers & washers & water level',
                'Test two-way radio',
                'The fuel gauge, coolant temperature gauge, hydraulic oil temperature gauge, hour meter, and engine oil pressure gauge all display normal readings',
                'Inspect all lights: work lights, indicator lamps, cab headlights, walkway lights, fog lamps, service lights, boom lights, and interior lights',
                'Check leaking (Main Pump – Main Control Valve – Swing Motor – Center swivel joint)',
                'Air conditioning (A/C) function',
                'Radiator coolant level',
                'Fuel tank level (%)',
                'Undercarriage: Check that the fixing bolts between the H-frame and the longitudinal beams are not loose',
                'Carrier roller: Check that the carrier roller mounting bolts are not loose and that the carrier roller mating surfaces show no oil seepage/leakage',
                'Track idler: Check that the idler mounting bolts are not loose and that the idler mating surfaces show no oil seepage/leakage',
                'Drive sprocket: Check that the drive sprocket mounting bolts are not loose',
                'Swing Drive Test Circle 2x 360 Degree',
                'Bucket test in / out',
                'Boom Regen swing test',
                'Bucket tooth/adapter condition (check crack)',
            ],

            // ─────────────────────────────────────────────────────────────────
            // BULLDOZER — 30 items (from real form)
            // Image 1 — exactly as written on paper form
            // ─────────────────────────────────────────────────────────────────
            'Bulldozer' => [
                'Check LOTO (Disconnect switch and emergency stop)',           // 1
                'Check the condition of the Fire Extinguisher',               // 2
                'Radio communication',                                         // 3
                'Test two-way radio',                                          // 4
                'Safe Mine',                                                   // 5
                'Check fluid leaks (Oil - Coolant - Fuel)',                   // 6
                'Check all Cylinder for damage and leaks',                    // 7
                'Check Engine oil level',                                     // 8
                'Check Hydraulic oil level',                                  // 9
                'Check Transmission oil level',                               // 10
                'Check Fuel level',                                            // 11
                'Check coolant level',                                         // 12
                'Battery condition',                                           // 13
                'Check cabin door and door glass',                            // 14
                'Seats – suspension adjustment/condition, and seat belt',     // 15
                'Windshield and mirrors',                                      // 16
                'Test Does Horn make a strong sound',                         // 17
                'No system warning on display',                               // 18
                'Machine temperatur',                                          // 19
                'Lights, turn signals, and rotaries',                         // 20
                'Wipers & washers level',                                     // 21
                'Engine abnormal sound',                                       // 22
                'Steering lever control',                                      // 23
                'Inspect lubrication lines, fittings, and (lubricant) distributor', // 24
                'Trackshoe and bolt',                                          // 25
                'Tracklink',                                                   // 26
                'Attachment (Blade-Ripper-Winch)',                            // 27
                'Carrier roller condition',                                    // 28
                'Final Drive LH/RH',                                          // 29
            ],

            // ─────────────────────────────────────────────────────────────────
            // DOZER — same checklist as Bulldozer
            // ─────────────────────────────────────────────────────────────────
            'Dozer' => [
                'Check LOTO (Disconnect switch and emergency stop)',
                'Check the condition of the Fire Extinguisher',
                'Radio communication',
                'Test two-way radio',
                'Safe Mine',
                'Check fluid leaks (Oil - Coolant - Fuel)',
                'Check all Cylinder for damage and leaks',
                'Check Engine oil level',
                'Check Hydraulic oil level',
                'Check Transmission oil level',
                'Check Fuel level',
                'Check coolant level',
                'Battery condition',
                'Check cabin door and door glass',
                'Seats – suspension adjustment/condition, and seat belt',
                'Windshield and mirrors',
                'Test Does Horn make a strong sound',
                'No system warning on display',
                'Machine temperature',
                'Lights, turn signals, and rotaries',
                'Wipers & washers level',
                'Engine abnormal sound',
                'Steering lever control',
                'Inspect lubrication lines, fittings, and (lubricant) distributor',
                'Trackshoe and bolt',
                'Tracklink',
                'Attachment (Blade-Ripper-Winch)',
                'Carrier roller condition',
                'Final Drive LH/RH',
            ],

            // ─────────────────────────────────────────────────────────────────
            // OHT TRUCK — 40 items (from real form: XDE130 – XDE260 / 785 / 777)
            // Image 3 — exactly as written on paper form
            // ─────────────────────────────────────────────────────────────────
            'OHT Truck' => [
                // Left column 1–20
                'Seats – suspension adjustment/condition',                                                          // 1
                'Seat belt – retainers and operation',                                                             // 2
                'Windows and glass',                                                                               // 3
                'Rear, Right, Left mirrors',                                                                       // 4
                'Doors',                                                                                           // 5
                'Trim panels',                                                                                     // 6
                'Fire suppression bottle charge pressure (if equip) (Greean / Red)',                               // 7
                'Fire suppression activators (pins/seals), hoses and pipes, nozzles, sensor tubes, safety labels, warning lights, gauge', // 8
                'Fire extinguishers gauge (Greean / Red)',                                                         // 9
                'Check grease line, fittings and distributors (Broken line)',                                      // 10
                'Engine oil level level',                                                                          // 11
                'Coolant level',                                                                                   // 12
                'Cooling system hoses / clamp missing',                                                            // 13
                'Engine idle rev 750±10r/min',                                                                     // 14
                'Engine max rev 1900±50r/min',                                                                     // 15
                'Engine oil leaks',                                                                                // 16
                'Coolant leaks',                                                                                   // 17
                'Test Does Horn make a strong sound',                                                              // 18
                'No system warning on display',                                                                    // 19
                'Air conditioner – condition and operation',                                                       // 20
                // Right column 21–40
                'Fuel gauge, rev meter, speed meter, coolant temp meter, hyd oil temp meter, odometer, engine oil pressure meter, all showing correctly', // 21
                'Wipers & washers level',                                                                          // 22
                'Battery and starter isolators',                                                                   // 23
                'Reverse alarm',                                                                                   // 24
                'Inspect all lights – Head lights, work lights, indicators, brake lights, marker lights, tail lights, reverse lights, fog light, service light, ladder light, retarder light, indoor light', // 25
                'Rear Camera',                                                                                     // 26
                'Safe Mine',                                                                                       // 27
                'Radio Test Call',                                                                                  // 28
                'Radio player',                                                                                    // 29
                'Hydraulic service brake Test',                                                                    // 30
                'Parking brake Test',                                                                              // 31
                'Loading braking switch function',                                                                 // 32
                'Operation of hosting cylinder lever in up, down, holding and floating positions condition',       // 33
                'Steering cylinders leaking',                                                                      // 34
                'Hydraulic oil level',                                                                             // 35
                'Hydraulic Oil Leaks',                                                                             // 36
                'Step Ladder / Handrail',                                                                          // 37
                'Final Drive leaking',                                                                             // 38
                'Tyre condition and Rim Crack',                                                                    // 39
                'Wheel nuts lose and air valve leaking',                                                           // 40
            ],

            // ─────────────────────────────────────────────────────────────────
            // DUMP TRUCK — same checklist as OHT Truck
            // ─────────────────────────────────────────────────────────────────
            'Dump Truck' => [
                'Seats – suspension adjustment/condition',
                'Seat belt – retainers and operation',
                'Windows and glass',
                'Rear, Right, Left mirrors',
                'Doors',
                'Trim panels',
                'Fire suppression bottle charge pressure (if equip) (Greean / Red)',
                'Fire suppression activators (pins/seals), hoses and pipes, nozzles, sensor tubes, safety labels, warning lights, gauge',
                'Fire extinguishers gauge (Greean / Red)',
                'Check grease line, fittings and distributors (Broken line)',
                'Engine oil level level',
                'Coolant level',
                'Cooling system hoses / clamp missing',
                'Engine idle rev 750±10r/min',
                'Engine max rev 1900±50r/min',
                'Engine oil leaks',
                'Coolant leaks',
                'Test Does Horn make a strong sound',
                'No system warning on display',
                'Air conditioner – condition and operation',
                'Fuel gauge, rev meter, speed meter, coolant temp meter, hyd oil temp meter, odometer, engine oil pressure meter, all showing correctly',
                'Wipers & washers level',
                'Battery and starter isolators',
                'Reverse alarm',
                'Inspect all lights – Head lights, work lights, indicators, brake lights, marker lights, tail lights, reverse lights, fog light, service light, ladder light, retarder light, indoor light',
                'Rear Camera',
                'Safe Mine',
                'Radio Test Call',
                'Radio player',
                'Hydraulic service brake Test',
                'Parking brake Test',
                'Loading braking switch function',
                'Operation of hosting cylinder lever in up, down, holding and floating positions condition',
                'Steering cylinders leaking',
                'Hydraulic oil level',
                'Hydraulic Oil Leaks',
                'Step Ladder / Handrail',
                'Final Drive leaking',
                'Tyre condition and Rim Crack',
                'Wheel nuts lose and air valve leaking',
            ],

            // ─────────────────────────────────────────────────────────────────
            // LIGHT VEHICLE — 28 items (from real form: LV-690251)
            // Image 2 — exactly as written on paper form
            // ─────────────────────────────────────────────────────────────────
            'Light Vehicle' => [
                'Registration and Safety sticker',
                'Tyres / Wheel Studs / Wheel Nut Indicators',
                'Fluid Levels, Oil and Transmission',
                'Fan and Belt',
                'Buggy Whip',
                'Cargo Restrained',
                'Seat and Seat Belts',
                'Cabin Gauges and Warnings',
                'Two Way Radio',
                'Fire Extinguisher',
                'Instrumentation and Switches',
                'Horn/Reverse Alarm',
                'Lights and Beacon',
                'Safemine Collision Avoidance System',
                'TrakPro Vehicle Tracking System',
                'Brakes / Park Brakes',
                'Steering System',
                'Engine Warning Light',
                'Windscreen / Window / Mirror',
                'Wiper and Washer',
                'Battery and Bracket mounting',
                'Visibility of Asset ID',
                'First Aid Kit in Vehicle and Fully Stocked',
                'Fuel Level',
                'Cabin Interior Condition',
                'Body Damage',
                'Tow Hitch',
                'Wheel Chocks',
                'Tyre change kit',
            ],

            // ─────────────────────────────────────────────────────────────────
            // LOADER — generic (no specific form provided)
            // ─────────────────────────────────────────────────────────────────
            'Loader' => [
                'Cabin clean condition and seat belt',
                'Windows, glass, and mirrors',
                'Engine oil level',
                'Hydraulic oil level',
                'Coolant level',
                'Fuel level',
                'Check fluid leaks (oil, coolant, hydraulic)',
                'Fire extinguisher condition (Green / Red)',
                'Battery condition and terminals',
                'Lights and signals working',
                'Horn loud and clear',
                'No system warning on display',
                'Wipers & washers level',
                'Tyres / tracks condition',
                'Bucket / attachment condition',
                'Grease points checked',
                'Two-way radio operational',
                'Safe Mine device operational',
            ],

            // ─────────────────────────────────────────────────────────────────
            // GRADER — generic (no specific form provided)
            // ─────────────────────────────────────────────────────────────────
            'Grader' => [
                'Cabin clean condition and seat belt',
                'Windows, glass, and mirrors',
                'Engine oil level',
                'Hydraulic oil level',
                'Coolant level',
                'Fuel level',
                'Check fluid leaks (oil, coolant, hydraulic)',
                'Fire extinguisher condition (Green / Red)',
                'Battery condition and terminals',
                'Lights and signals working',
                'Horn loud and clear',
                'No system warning on display',
                'Wipers & washers level',
                'Tyre condition and pressure',
                'Blade and circle gear condition',
                'Articulation joint check',
                'Grease points checked',
                'Two-way radio operational',
                'Safe Mine device operational',
            ],
        ];
    }
}
