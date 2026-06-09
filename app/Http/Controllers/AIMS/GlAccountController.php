<?php

namespace App\Http\Controllers\AIMS;

use App\Models\AIMS\GlAccount;
use Illuminate\Http\Request;

use App\Http\Controllers\Controller;



class GlAccountController extends Controller
{
    /**
     * Test creating a GL Account
     */
    public function createSample()
    {
        $account = GlAccount::create([
            'gl_code' => '1000',
            'gl_name' => 'Cash',
            'account_type' => 'Asset',
            'level_no' => 1,
            'is_postable' => true,
            'currency_code' => 'USD',
            'status' => 'ACTIVE',
            'created_by' => 1
        ]);

        return response()->json([
            'message' => 'Sample GL Account created',
            'data' => $account
        ]);
    }

    /**
     * List all GL Accounts
     */
    public function index()
    {
        $accounts = GlAccount::with('parent')->get();

        return response()->json([
            'message' => 'GL Accounts retrieved successfully',
            'data' => $accounts
        ]);
    }

    /**
     * Test parent-child relationship
     */
    public function testHierarchy()
    {
        // Create parent
        $parent = GlAccount::create([
            'gl_code' => '2000',
            'gl_name' => 'Accounts Receivable',
            'account_type' => 'Asset',
            'level_no' => 1,
            'is_postable' => false,
            'status' => 'ACTIVE',
        ]);

        // Create child
        $child = GlAccount::create([
            'gl_code' => '2001',
            'gl_name' => 'Customer Receivable',
            'account_type' => 'Asset',
            'parent_gl_id' => $parent->gl_id,
            'level_no' => 2,
            'is_postable' => true,
            'status' => 'ACTIVE',
        ]);

        return response()->json([
            'parent' => $parent,
            'children' => $parent->children
        ]);
    }

     // Store new GL account
    public function store(Request $request)
    {
        $request->validate([
            'gl_code' => 'required|unique:gl_accounts,gl_code',
            'gl_name' => 'required|string|max:150',
            'account_type' => 'required|string',
            'parent_gl_id' => 'nullable|exists:gl_accounts,id',
            'is_postable' => 'boolean',
            'currency_code' => 'nullable|string|max:10',
            'status' => 'required|string|max:20',
        ]);

        $parent = GlAccount::find($request->parent_gl_id);

        $account = GlAccount::create([
            'gl_code' => $request->gl_code,
            'gl_name' => $request->gl_name,
            'account_type' => $request->account_type,
            'parent_gl_id' => $request->parent_gl_id,
            'level_no' => $parent ? $parent->level_no + 1 : 1,
            'is_postable' => $request->is_postable ?? true,
            'currency_code' => $request->currency_code,
            'status' => $request->status ?? 'ACTIVE',
            'created_by' => 1,
        ]);

        return response()->json([
            'message' => 'GL Account created successfully',
            'data' => $account
        ]);
    }

     /**
     * Update an existing GL Account
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        // Find the GL account
        $glAccount = GLAccount::find($id);

        if (!$glAccount) {
            return response()->json([
                'success' => false,
                'message' => 'GL Account not found.'
            ], 404);
        }

        // Validate incoming data
         $request->validate([
          'gl_code' => 'required|string|max:50|unique:gl_accounts,gl_code,' . $id . ',id',
        'gl_name' => 'required|string|max:255',
        'account_type' => 'required|string|in:Asset,Liability,Equity,Revenue,Expense',
        'parent_gl_id' => 'nullable|exists:gl_accounts,id',
        'status' => 'required|string|in:ACTIVE,INACTIVE',
        'is_postable' => 'required|boolean',
        ]);

      

        // Update the GL account
        $glAccount->update($request->only([
            'gl_code',
            'gl_name',
            'account_type',
            'parent_gl_id',
            'status',
            'is_postable'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'GL Account updated successfully.',
            'data' => $glAccount
        ]);
    }

      // Return all top-level accounts for parent selection
    public function parents()
    {
        $parents = GlAccount::whereNull('parent_gl_id')->get();
        return response()->json($parents);
    }

     public function destroy($id)
    {
        $account = GlAccount::find($id);

        if (!$account) {
            return response()->json([
                'message' => 'GL Account not found'
            ], 404);
        }

        $account->delete();

        return response()->json([
            'message' => 'GL Account deleted successfully'
        ], 200);
    }
}