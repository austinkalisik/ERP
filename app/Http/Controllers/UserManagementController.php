<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserManagementController extends Controller
{
    // ✅ All valid roles — used in both update() and store() validation
    private const VALID_ROLES = [
        'system_admin',
        'hr',
        'dept_head',
        'employee',
        'aims_manager',
        'aims_staff',
        'moms_manager',
        'moms_supervisor',
        'moms_operator',
    ];

    /**
     * GET /api/users
     * Returns all users ordered by creation date ascending.
     */
    public function index()
    {
        $users = User::select('id', 'name', 'email', 'role', 'is_active', 'created_at')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($users);
    }

    /**
     * PUT /api/users/{id}
     * Update user name, email, role, active status.
     */
    public function update(Request $request, $id)
    {
        $user        = User::findOrFail($id);
        $currentUser = $request->user();

        $oldData = [
            'name'      => $user->name,
            'email'     => $user->email,
            'role'      => $user->role,
            'is_active' => $user->is_active,
        ];

        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'email'     => [
                'required', 'string', 'email', 'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            // ✅ FIXED: was missing AIMS and MOMS roles
            'role'      => ['required', Rule::in(self::VALID_ROLES)],
            'is_active' => 'required|boolean',
        ]);

        $user->name      = $validated['name'];
        $user->email     = $validated['email'];
        $user->role      = $validated['role'];
        $user->is_active = $validated['is_active'];
        $user->save();

        // Build audit trail
        $changes = [];
        if ($oldData['name']      !== $user->name)      $changes[] = "name from '{$oldData['name']}' to '{$user->name}'";
        if ($oldData['email']     !== $user->email)     $changes[] = "email from '{$oldData['email']}' to '{$user->email}'";
        if ($oldData['role']      !== $user->role)      $changes[] = "role from '{$oldData['role']}' to '{$user->role}'";
        if ($oldData['is_active'] !== $user->is_active) $changes[] = "status to " . ($user->is_active ? 'activated' : 'deactivated');

        if (!empty($changes)) {
            $auditChanges = [];
            foreach ($changes as $change) {
                if (preg_match('/(.+?) from \'(.+?)\' to \'(.+?)\'/', $change, $m)) {
                    $auditChanges[$m[1]] = ['old' => $m[2], 'new' => $m[3]];
                }
            }

            AuditLog::create([
                'user_id'     => $currentUser->id,
                'user_name'   => $currentUser->name,
                'user_role'   => $currentUser->role,
                'model_type'  => 'App\\Models\\User',
                'model_id'    => $user->id,
                'action'      => 'updated',
                'description' => 'Updated user ' . $user->name . ': ' . implode(', ', $changes),
                'old_values'  => $oldData,
                'new_values'  => [
                    'name'      => $user->name,
                    'email'     => $user->email,
                    'role'      => $user->role,
                    'is_active' => $user->is_active,
                ],
                'changes'     => $auditChanges,
                'ip_address'  => $request->ip(),
                'user_agent'  => $request->userAgent(),
                'module'      => 'Settings',
            ]);
        }

        return response()->json([
            'message' => 'User updated successfully',
            'user'    => $user,
        ]);
    }

    /**
     * POST /api/users/{id}/reset-password
     */
    public function resetPassword(Request $request, $id)
    {
        $user        = User::findOrFail($id);
        $currentUser = $request->user();

        $validated = $request->validate([
            'new_password' => 'required|string|min:8',
        ]);

        $user->password = Hash::make($validated['new_password']);
        $user->save();

        AuditLog::create([
            'user_id'     => $currentUser->id,
            'user_name'   => $currentUser->name,
            'user_role'   => $currentUser->role,
            'model_type'  => 'App\\Models\\User',
            'model_id'    => $user->id,
            'action'      => 'other',
            'description' => "Reset password for user: {$user->name} ({$user->email})",
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
            'module'      => 'Settings',
        ]);

        return response()->json(['message' => 'Password reset successfully']);
    }

    /**
     * DELETE /api/users/{id}
     */
    public function destroy(Request $request, $id)
    {
        $user        = User::findOrFail($id);
        $currentUser = $request->user();

        if ($user->id == $currentUser->id) {
            return response()->json(['message' => 'You cannot delete your own account'], 403);
        }

        $userName  = $user->name;
        $userEmail = $user->email;
        $userRole  = $user->role;

        $user->delete();

        AuditLog::create([
            'user_id'     => $currentUser->id,
            'user_name'   => $currentUser->name,
            'user_role'   => $currentUser->role,
            'model_type'  => 'App\\Models\\User',
            'model_id'    => $id,
            'action'      => 'deleted',
            'description' => "Deleted user: {$userName} ({$userEmail}) with role '{$userRole}'",
            'old_values'  => ['name' => $userName, 'email' => $userEmail, 'role' => $userRole],
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
            'module'      => 'Settings',
        ]);

        return response()->json(['message' => 'User deleted successfully']);
    }
}