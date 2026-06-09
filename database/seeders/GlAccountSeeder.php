<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class GlAccountSeeder extends Seeder
{
     public function run(): void
    {
        $now = Carbon::now();

        // Insert parent accounts first
        $parents = [
            [
                'gl_code' => '1000',
                'gl_name' => 'Assets',
                'account_type' => 'Asset',
                'parent_gl_id' => null,
                'level_no' => 1,
                'is_postable' => 0,
                'currency_code' => null,
                'status' => 'ACTIVE',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'gl_code' => '2000',
                'gl_name' => 'Liabilities',
                'account_type' => 'Liability',
                'parent_gl_id' => null,
                'level_no' => 1,
                'is_postable' => 0,
                'currency_code' => null,
                'status' => 'ACTIVE',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'gl_code' => '3000',
                'gl_name' => 'Equity',
                'account_type' => 'Equity',
                'parent_gl_id' => null,
                'level_no' => 1,
                'is_postable' => 0,
                'currency_code' => null,
                'status' => 'ACTIVE',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'gl_code' => '4000',
                'gl_name' => 'Revenue',
                'account_type' => 'Revenue',
                'parent_gl_id' => null,
                'level_no' => 1,
                'is_postable' => 0,
                'currency_code' => null,
                'status' => 'ACTIVE',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'gl_code' => '5000',
                'gl_name' => 'Expenses',
                'account_type' => 'Expense',
                'parent_gl_id' => null,
                'level_no' => 1,
                'is_postable' => 0,
                'currency_code' => null,
                'status' => 'ACTIVE',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        foreach ($parents as $parent) {
            DB::table('gl_accounts')->updateOrInsert(
                ['gl_code' => $parent['gl_code']],
                $parent
            );
        }

        // Fetch parent IDs dynamically
        $assetId = DB::table('gl_accounts')->where('gl_code', '1000')->value('id');
        $liabilityId = DB::table('gl_accounts')->where('gl_code', '2000')->value('id');
        $equityId = DB::table('gl_accounts')->where('gl_code', '3000')->value('id');
        $revenueId = DB::table('gl_accounts')->where('gl_code', '4000')->value('id');
        $expenseId = DB::table('gl_accounts')->where('gl_code', '5000')->value('id');

        // Insert child accounts
        $children = [
            // Liabilities
            ['2100', 'Accounts Payable', 'Liability', $liabilityId],
            ['2200', 'Nasfund Payable', 'Liability', $liabilityId],
            ['2210', 'NCSL Payable', 'Liability', $liabilityId],
            ['2300', 'Accrued Taxes', 'Liability', $liabilityId],

            // Equity
            ['3100', 'Retained Earnings', 'Equity', $equityId],
            ['3200', 'Share Capital', 'Equity', $equityId],

            // Revenue
            ['4010', 'Machine Rental Income', 'Revenue', $revenueId],
            ['4020', 'Hauling Revenue', 'Revenue', $revenueId],
            ['4050', 'Reimbursable Income', 'Revenue', $revenueId],

            // Expenses
            ['5010', 'Machine Maintenance - Parts', 'Expense', $expenseId],
            ['5020', 'Machine Maintenace - Consumables', 'Expense', $expenseId],
            ['5030', 'Fuel and Lubricants', 'Expense', $expenseId],
            ['5100', 'Payroll Expense - Basic', 'Expense', $expenseId],
            ['5110', 'Employer Nasfund Contribution', 'Expense', $expenseId],
            ['5200', 'Accommodation and Meals', 'Expense', $expenseId],

            // Assets
            ['1010', 'Cash in Bank', 'Asset', $assetId],
            ['1100', 'Accounts Receivable', 'Asset', $assetId],
            ['1200', 'Inventory Parts', 'Asset', $assetId],
            ['1210', 'Inventory - Consumables', 'Asset', $assetId],
            ['1500', 'Fixed Assets - Heavy Equipment', 'Asset', $assetId],
            ['1550', 'Accumulated Depreciation', 'Asset', $assetId],
        ];

        foreach ($children as $child) {
            DB::table('gl_accounts')->updateOrInsert(['gl_code' => $child[0]], [
                'gl_code' => $child[0],
                'gl_name' => $child[1],
                'account_type' => $child[2],
                'parent_gl_id' => $child[3],
                'level_no' => 2,
                'is_postable' => 1,
                'currency_code' => null,
                'status' => 'ACTIVE',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
