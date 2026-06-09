<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        $map = [

            /*
            |--------------------------------------------------------------------------
            | HRMS Roles
            |--------------------------------------------------------------------------
            */
            'hr' => [
                'access_hrms',
                'access_payroll',
                'employee.view',
                'employee.create',
                'employee.update',
                'employee.delete',
                'leave.view',
                'leave.manage',
                'ot.manage',
                'attendance.manage',
                'payslip.view',
            ],

            'dept_head' => [
                'access_hrms',
                'employee.view',
                'leave.view',
                'leave.approve',
                'ot.approve',
                'attendance.view',
            ],

            'employee' => [
                'access_hrms',
                'employee.view',
                'leave.view',
                'leave.create',
                'ot.create',
                'attendance.view',
                'payslip.view',
            ],

             /*
            |--------------------------------------------------------------------------
            | AIMS Roles
            |--------------------------------------------------------------------------
            */
            'aims_manager' => [
                'access_aims',
                'aims.inventory.view',
                'aims.inventory.create',
                'aims.inventory.update',
                'aims.inventory.delete',
                'aims.suppliers.view',
                'aims.suppliers.create',
                'aims.suppliers.update',
                'aims.suppliers.delete',
                'aims.purchase_orders.view',
                'aims.purchase_orders.create',
                'aims.purchase_orders.update',
                'aims.purchase_orders.delete',
                'aims.purchase_orders.approve',
                'aims.reports.view',
            ],

            'aims_staff' => [
                'access_aims',
                'aims.inventory.view',
                'aims.inventory.update',  
                'aims.purchase_orders.view',
                'aims.purchase_orders.create',
                'aims.suppliers.view',
                'aims.reports.view',
            ],

            /*
            |--------------------------------------------------------------------------
            | MOMS Roles
            |--------------------------------------------------------------------------
            */
            'moms_manager' => [
                'access_moms',
                'moms.fleet.view',
                'moms.fleet.create',
                'moms.fleet.update',
                'moms.fleet.delete',
                'moms.operators.view',
                'moms.operators.create',
                'moms.operators.update',
                'moms.operators.delete',
                'moms.assignments.view',
                'moms.assignments.create',
                'moms.assignments.update',
                'moms.assignments.delete',
                'moms.operations.view',
                'moms.operations.create',
                'moms.operations.update',
                'moms.operations.delete',
                'moms.operations.approve',
                'moms.maintenance.view',
                'moms.maintenance.create',
                'moms.maintenance.update',
                'moms.maintenance.delete',
                'moms.breakdowns.view',
                'moms.breakdowns.create',
                'moms.breakdowns.update',
                'moms.breakdowns.delete',
                'moms.fuel.view',
                'moms.fuel.create',
                'moms.fuel.update',
                'moms.fuel.delete',
                'moms.inventory.view',
                'moms.inventory.create',
                'moms.inventory.update',
                'moms.inventory.delete',
                'moms.schedules.view',
                'moms.schedules.create',
                'moms.schedules.update',
                'moms.schedules.delete',
                'moms.finance.view',
                'moms.finance.create',
                'moms.finance.update',
                'moms.reports.view',
            ],

            'moms_supervisor' => [
                'access_moms',
                'moms.fleet.view',
                'moms.operators.view',
                'moms.assignments.view',
                'moms.assignments.create',
                'moms.assignments.update',
                'moms.operations.view',
                'moms.operations.create',
                'moms.operations.update',
                'moms.operations.approve',
                'moms.maintenance.view',
                'moms.maintenance.create',
                'moms.maintenance.update',
                'moms.breakdowns.view',
                'moms.breakdowns.create',
                'moms.breakdowns.update',
                'moms.fuel.view',
                'moms.fuel.create',
                'moms.fuel.update',
                'moms.inventory.view',
                'moms.inventory.create',
                'moms.inventory.update',
                'moms.schedules.view',
                'moms.schedules.create',
                'moms.schedules.update',
                'moms.finance.view',
                'moms.reports.view',
            ],

            'moms_operator' => [
                'access_moms',
                'moms.assignments.view',
                'moms.operations.view',
                'moms.operations.create',
                'moms.breakdowns.view',
                'moms.breakdowns.create',
               
            ],
        ];

        foreach ($map as $role => $permissionSlugs) {
            $users = User::where('role', $role)->get();

            $permissionIds = Permission::whereIn('slug', $permissionSlugs)
                ->pluck('id')
                ->toArray();

            foreach ($users as $user) {
                $user->permissions()->sync($permissionIds);
            }
        }
    }
}
