<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Permission;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | SYSTEM ADMIN
        |--------------------------------------------------------------------------
        */
        $admin = User::firstOrCreate(
            ['email' => 'admin@erp.test'],
            [
                'name'      => 'System Admin',
                'password'  => Hash::make('password123'),
                'role'      => 'system_admin',
                'is_active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | HRMS Users
        |--------------------------------------------------------------------------
        */
        User::firstOrCreate(
            ['email' => 'hr@erp.test'],
            [
                'name'      => 'HR User',
                'password'  => Hash::make('password123'),
                'role'      => 'hr',
                'is_active' => true,
            ]
        );

        User::firstOrCreate(
            ['email' => 'head@erp.test'],
            [
                'name'      => 'Department Head',
                'password'  => Hash::make('password123'),
                'role'      => 'dept_head',
                'is_active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | AIMS Users
        |--------------------------------------------------------------------------
        */
        User::firstOrCreate(
            ['email' => 'aims.manager@erp.test'],
            [
                'name'      => 'AIMS Manager',
                'password'  => Hash::make('password123'),
                'role'      => 'aims_manager',
                'is_active' => true,
            ]
        );

        User::firstOrCreate(
            ['email' => 'aims.staff@erp.test'],
            [
                'name'      => 'AIMS Staff',
                'password'  => Hash::make('password123'),
                'role'      => 'aims_staff',
                'is_active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | MOMS Users
        |--------------------------------------------------------------------------
        */
        User::firstOrCreate(
            ['email' => 'moms.manager@erp.test'],
            [
                'name'      => 'MOMS Manager',
                'password'  => Hash::make('password123'),
                'role'      => 'moms_manager',
                'is_active' => true,
            ]
        );

        User::firstOrCreate(
            ['email' => 'moms.supervisor@erp.test'],
            [
                'name'      => 'MOMS Supervisor',
                'password'  => Hash::make('password123'),
                'role'      => 'moms_supervisor',
                'is_active' => true,
            ]
        );

        // Operators 1–5 — English names
        User::firstOrCreate(
            ['email' => 'moms.operator1@erp.test'],
            [
                'name'      => 'James Carter',
                'password'  => Hash::make('password123'),
                'role'      => 'moms_operator',
                'is_active' => true,
            ]
        );

        User::firstOrCreate(
            ['email' => 'moms.operator2@erp.test'],
            [
                'name'      => 'William Turner',
                'password'  => Hash::make('password123'),
                'role'      => 'moms_operator',
                'is_active' => true,
            ]
        );

        User::firstOrCreate(
            ['email' => 'moms.operator3@erp.test'],
            [
                'name'      => 'Sarah Mitchell',
                'password'  => Hash::make('password123'),
                'role'      => 'moms_operator',
                'is_active' => true,
            ]
        );

        User::firstOrCreate(
            ['email' => 'moms.operator4@erp.test'],
            [
                'name'      => 'Robert Hayes',
                'password'  => Hash::make('password123'),
                'role'      => 'moms_operator',
                'is_active' => true,
            ]
        );

        User::firstOrCreate(
            ['email' => 'moms.operator5@erp.test'],
            [
                'name'      => 'Emily Brooks',
                'password'  => Hash::make('password123'),
                'role'      => 'moms_operator',
                'is_active' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Assign ALL permissions to system admin
        |--------------------------------------------------------------------------
        */
        $admin->permissions()->sync(
            Permission::pluck('id')->toArray()
        );
    }
}
