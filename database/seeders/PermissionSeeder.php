<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [

            /*
            |--------------------------------------------------------------------------
            | Module Access
            |--------------------------------------------------------------------------
            */
            ['slug' => 'access_hrms',       'description' => 'Access HR Management System'],
            ['slug' => 'access_payroll',     'description' => 'Access Payroll System'],
            ['slug' => 'access_aims',        'description' => 'Access Inventory Management System'],
            ['slug' => 'access_moms',        'description' => 'Access Machine Operations System'],
            ['slug' => 'access_accounting',  'description' => 'Access Accounting System'],
            ['slug' => 'access_crm',         'description' => 'Access CRM System'],

            /*
            |--------------------------------------------------------------------------
            | Employee Management
            |--------------------------------------------------------------------------
            */
            ['slug' => 'employee.view',   'description' => 'View employee information'],
            ['slug' => 'employee.create', 'description' => 'Create employee records'],
            ['slug' => 'employee.update', 'description' => 'Update employee records'],
            ['slug' => 'employee.delete', 'description' => 'Delete employee records'],

            /*
            |--------------------------------------------------------------------------
            | Leave Management
            |--------------------------------------------------------------------------
            */
            ['slug' => 'leave.view',    'description' => 'View leave records'],
            ['slug' => 'leave.create',  'description' => 'File leave'],
            ['slug' => 'leave.approve', 'description' => 'Approve or reject leave'],
            ['slug' => 'leave.manage',  'description' => 'Manage all leave records'],

            /*
            |--------------------------------------------------------------------------
            | Overtime
            |--------------------------------------------------------------------------
            */
            ['slug' => 'ot.create',  'description' => 'File overtime'],
            ['slug' => 'ot.approve', 'description' => 'Approve overtime'],
            ['slug' => 'ot.manage',  'description' => 'Manage overtime records'],

            /*
            |--------------------------------------------------------------------------
            | Attendance
            |--------------------------------------------------------------------------
            */
            ['slug' => 'attendance.view',   'description' => 'View attendance'],
            ['slug' => 'attendance.manage', 'description' => 'Manage attendance records'],

            /*
            |--------------------------------------------------------------------------
            | Payslip
            |--------------------------------------------------------------------------
            */
            ['slug' => 'payslip.view', 'description' => 'View payslip'],

            /*
            |--------------------------------------------------------------------------
            | User Account Management (ADMIN ONLY)
            |--------------------------------------------------------------------------
            */
            ['slug' => 'user.create', 'description' => 'Create user login accounts'],

            /*
            |--------------------------------------------------------------------------
            | AIMS — Inventory
            |--------------------------------------------------------------------------
            */
            ['slug' => 'aims.inventory.view',   'description' => 'View inventory items'],
            ['slug' => 'aims.inventory.create', 'description' => 'Create inventory items'],
            ['slug' => 'aims.inventory.update', 'description' => 'Update inventory items'],
            ['slug' => 'aims.inventory.delete', 'description' => 'Delete inventory items'],

            /*
            |--------------------------------------------------------------------------
            | AIMS — Suppliers
            |--------------------------------------------------------------------------
            */
            ['slug' => 'aims.suppliers.view',   'description' => 'View suppliers'],
            ['slug' => 'aims.suppliers.create', 'description' => 'Create suppliers'],
            ['slug' => 'aims.suppliers.update', 'description' => 'Update suppliers'],
            ['slug' => 'aims.suppliers.delete', 'description' => 'Delete suppliers'],

            /*
            |--------------------------------------------------------------------------
            | AIMS — Purchase Orders
            |--------------------------------------------------------------------------
            */
            ['slug' => 'aims.purchase_orders.view',    'description' => 'View purchase orders'],
            ['slug' => 'aims.purchase_orders.create',  'description' => 'Create purchase orders'],
            ['slug' => 'aims.purchase_orders.update',  'description' => 'Update purchase orders'],
            ['slug' => 'aims.purchase_orders.delete',  'description' => 'Delete purchase orders'],
            ['slug' => 'aims.purchase_orders.approve', 'description' => 'Approve purchase orders'],

            /*
            |--------------------------------------------------------------------------
            | AIMS — Reports
            |--------------------------------------------------------------------------
            */
            ['slug' => 'aims.reports.view', 'description' => 'View AIMS reports'],

            /*
            |--------------------------------------------------------------------------
            | MOMS — Fleet
            |--------------------------------------------------------------------------
            */
            ['slug' => 'moms.fleet.view',   'description' => 'View fleet records'],
            ['slug' => 'moms.fleet.create', 'description' => 'Create fleet records'],
            ['slug' => 'moms.fleet.update', 'description' => 'Update fleet records'],
            ['slug' => 'moms.fleet.delete', 'description' => 'Delete fleet records'],

            /*
            |--------------------------------------------------------------------------
            | MOMS — Operators
            |--------------------------------------------------------------------------
            */
            ['slug' => 'moms.operators.view',   'description' => 'View operators'],
            ['slug' => 'moms.operators.create', 'description' => 'Create operators'],
            ['slug' => 'moms.operators.update', 'description' => 'Update operators'],
            ['slug' => 'moms.operators.delete', 'description' => 'Delete operators'],

            /*
            |--------------------------------------------------------------------------
            | MOMS — Assignments
            |--------------------------------------------------------------------------
            */
            ['slug' => 'moms.assignments.view',   'description' => 'View assignments'],
            ['slug' => 'moms.assignments.create', 'description' => 'Create assignments'],
            ['slug' => 'moms.assignments.update', 'description' => 'Update assignments'],
            ['slug' => 'moms.assignments.delete', 'description' => 'Delete assignments'],

            /*
            |--------------------------------------------------------------------------
            | MOMS — Daily Operations
            |--------------------------------------------------------------------------
            */
            ['slug' => 'moms.operations.view',    'description' => 'View shift operations'],
            ['slug' => 'moms.operations.create',  'description' => 'Create shift operations'],
            ['slug' => 'moms.operations.update',  'description' => 'Update shift operations'],
            ['slug' => 'moms.operations.delete',  'description' => 'Delete shift operations'],
            ['slug' => 'moms.operations.approve', 'description' => 'Approve shift operations'],

            /*
            |--------------------------------------------------------------------------
            | MOMS — Maintenance
            |--------------------------------------------------------------------------
            */
            ['slug' => 'moms.maintenance.view',   'description' => 'View maintenance records'],
            ['slug' => 'moms.maintenance.create', 'description' => 'Create maintenance records'],
            ['slug' => 'moms.maintenance.update', 'description' => 'Update maintenance records'],
            ['slug' => 'moms.maintenance.delete', 'description' => 'Delete maintenance records'],

            /*
            |--------------------------------------------------------------------------
            | MOMS — Breakdowns
            |--------------------------------------------------------------------------
            */
            ['slug' => 'moms.breakdowns.view',   'description' => 'View breakdown records'],
            ['slug' => 'moms.breakdowns.create', 'description' => 'Create breakdown records'],
            ['slug' => 'moms.breakdowns.update', 'description' => 'Update breakdown records'],
            ['slug' => 'moms.breakdowns.delete', 'description' => 'Delete breakdown records'],

            /*
            |--------------------------------------------------------------------------
            | MOMS — Fuel
            |--------------------------------------------------------------------------
            */
            ['slug' => 'moms.fuel.view',   'description' => 'View fuel transactions'],
            ['slug' => 'moms.fuel.create', 'description' => 'Create fuel transactions'],
            ['slug' => 'moms.fuel.update', 'description' => 'Update fuel transactions'],
            ['slug' => 'moms.fuel.delete', 'description' => 'Delete fuel transactions'],

            /*
            |--------------------------------------------------------------------------
            | MOMS — Inventory Parts
            |--------------------------------------------------------------------------
            */
            ['slug' => 'moms.inventory.view',   'description' => 'View MOMS inventory parts'],
            ['slug' => 'moms.inventory.create', 'description' => 'Create MOMS inventory parts'],
            ['slug' => 'moms.inventory.update', 'description' => 'Update MOMS inventory parts'],
            ['slug' => 'moms.inventory.delete', 'description' => 'Delete MOMS inventory parts'],

            /*
            |--------------------------------------------------------------------------
            | MOMS — Schedules
            |--------------------------------------------------------------------------
            */
            ['slug' => 'moms.schedules.view',   'description' => 'View maintenance schedules'],
            ['slug' => 'moms.schedules.create', 'description' => 'Create maintenance schedules'],
            ['slug' => 'moms.schedules.update', 'description' => 'Update maintenance schedules'],
            ['slug' => 'moms.schedules.delete', 'description' => 'Delete maintenance schedules'],

            /*
            |--------------------------------------------------------------------------
            | MOMS — Reports
            |--------------------------------------------------------------------------
            */
            ['slug' => 'moms.reports.view', 'description' => 'View MOMS reports and exports'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['slug' => $permission['slug']],
                ['description' => $permission['description']]
            );
        }
    }
}
