<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

// Core Seeders
use Database\Seeders\PermissionSeeder;
use Database\Seeders\DepartmentSeeder;
use Database\Seeders\ShiftSeeder;
use Database\Seeders\PositionSeeder;
use Database\Seeders\UserSeeder;
use Database\Seeders\OperatorSeeder;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\EmploymentClassificationSeeder;
use Database\Seeders\LeaveTypeSeeder;
use Database\Seeders\OvertimeTypeSeeder;
use Database\Seeders\PayrollConfigSeeder;
use Database\Seeders\PublicHolidaySeeder;

// MOMS Seeders
use Database\Seeders\MachineSeeder;
use Database\Seeders\JobSiteSeeder;
use Database\Seeders\ChecklistTemplateSeeder;

// HRMS Seeders
use Database\Seeders\EmployeeSeeder;

// AIMS Seeders
use Database\Seeders\InventoryItemSeeder;

// CRM Seeders
use Database\Seeders\CrmServiceSeeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | CORE DATA
        | Order matters:
        |   1. PermissionSeeder   — permissions must exist before anyone gets them
        |   2. UserSeeder         — creates all role users incl. moms_operator users
        |   3. OperatorSeeder     — creates operator profiles for moms_operator users
        |   4. RolePermissionSeeder — bulk-assigns permissions; operator users now exist
        |--------------------------------------------------------------------------
        */
        $this->call([
            PermissionSeeder::class,
            DepartmentSeeder::class,
            ShiftSeeder::class,
            LeaveTypeSeeder::class,
            OvertimeTypeSeeder::class,
            PayrollConfigSeeder::class,
            PublicHolidaySeeder::class,
            PositionSeeder::class,
            EmploymentClassificationSeeder::class,
            UserSeeder::class,
            OperatorSeeder::class,        // ← BEFORE RolePermissionSeeder
            RolePermissionSeeder::class,  // ← assigns perms to ALL moms_operator users
            PaymentTermsSeeder::class,
        ]);

        /*
        |--------------------------------------------------------------------------
        | MOMS DATA
        |--------------------------------------------------------------------------
        */
        $this->call([
            MachineSeeder::class,
            JobSiteSeeder::class,
            ChecklistTemplateSeeder::class,
        ]);

        /*
        |--------------------------------------------------------------------------
        | HRMS DATA
        |--------------------------------------------------------------------------
        */
        $this->call([
            EmployeeSeeder::class,
        ]);

        /*
        |--------------------------------------------------------------------------
        | AIMS DATA
        |--------------------------------------------------------------------------
        */
        $this->call([
            InventoryItemSeeder::class,
            GlAccountSeeder::class,
        ]);

        /*
        |--------------------------------------------------------------------------
        | CRM DATA
        | Seeds the 3 default services: Internet Service, Domain Hosting, GPS
        | Uses firstOrCreate — safe to re-run without duplicates
        |--------------------------------------------------------------------------
        */
        $this->call([
            CrmServiceSeeder::class,
        ]);
    }
}