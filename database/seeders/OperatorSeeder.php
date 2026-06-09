<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MOMS\Operator;
use App\Models\User;
use App\Models\Permission;

class OperatorSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | MOMS Operator Profiles
        |--------------------------------------------------------------------------
        | Linked 1-to-1 with the moms_operator users from UserSeeder.
        | Emails must match exactly what UserSeeder creates.
        |--------------------------------------------------------------------------
        */
        $operators = [
            [
                'email'              => 'moms.operator1@erp.test', // James Carter
                'license_number'     => 'LIC-OPE-0001',
                'license_type'       => 'Heavy Machinery',
                'license_expiry'     => '2026-06-30',
                'certification'      => 'Excavator Certified',
                'total_hours'        => 3240,
                'performance_rating' => 4.75,
                'notes'              => 'Senior operator. Specializes in excavation.',
                'status'             => 'Active',
            ],
            [
                'email'              => 'moms.operator2@erp.test', // William Turner
                'license_number'     => 'LIC-OPE-0002',
                'license_type'       => 'Heavy Machinery',
                'license_expiry'     => '2026-12-31',
                'certification'      => 'Dump Truck Certified',
                'total_hours'        => 2810,
                'performance_rating' => 4.50,
                'notes'              => 'Experienced dump truck operator.',
                'status'             => 'Active',
            ],
            [
                'email'              => 'moms.operator3@erp.test', // Sarah Mitchell
                'license_number'     => 'LIC-OPE-0003',
                'license_type'       => 'Light to Medium Equipment',
                'license_expiry'     => '2026-09-15',
                'certification'      => 'Grader Certified',
                'total_hours'        => 1950,
                'performance_rating' => 4.60,
                'notes'              => 'Grader and dozer operator.',
                'status'             => 'Active',
            ],
            [
                'email'              => 'moms.operator4@erp.test', // Robert Hayes
                'license_number'     => 'LIC-OPE-0004',
                'license_type'       => 'Heavy Machinery',
                'license_expiry'     => '2026-09-30',
                'certification'      => 'Loader Certified',
                'total_hours'        => 1420,
                'performance_rating' => 4.20,
                'notes'              => 'Wheel loader specialist.',
                'status'             => 'Active',
            ],
            [
                'email'              => 'moms.operator5@erp.test', // Emily Brooks
                'license_number'     => 'LIC-OPE-0005',
                'license_type'       => 'Light to Medium Equipment',
                'license_expiry'     => '2026-11-30',
                'certification'      => 'Water Truck Certified',
                'total_hours'        => 980,
                'performance_rating' => 3.90,
                'notes'              => 'Water truck and support equipment.',
                'status'             => 'On Leave',
            ],
        ];

        foreach ($operators as $data) {
            $user = User::where('email', $data['email'])->first();

            if (!$user) {
                $this->command->warn("User not found for {$data['email']} — skipping.");
                continue;
            }

            // Skip if this user already has an operator profile
            if (Operator::where('user_id', $user->id)->exists()) {
                $this->command->info("Operator profile already exists for {$user->name} — skipping.");
                continue;
            }

            Operator::create([
                'user_id'            => $user->id,
                'license_number'     => $data['license_number'],
                'license_type'       => $data['license_type'],
                'license_expiry'     => $data['license_expiry'],
                'certification'      => $data['certification'],
                'total_hours'        => $data['total_hours'],
                'performance_rating' => $data['performance_rating'],
                'notes'              => $data['notes'],
                'status'             => $data['status'],
            ]);

            // Assign access_moms permission so the operator can log in and use MOMS
            $momsPermission = Permission::where('slug', 'access_moms')->first();
            if ($momsPermission) {
                $user->permissions()->syncWithoutDetaching([$momsPermission->id]);
            }

            $this->command->info("Created operator profile for {$user->name}.");
        }
    }
}