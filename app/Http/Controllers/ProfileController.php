<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\AuditLog;
use App\Models\User;

class ProfileController extends Controller
{
    /**
     * Get the authenticated user's profile
     */
    public function show(Request $request)
    {
        return response()->json([
            'name' => $request->user()->name,
            'email' => $request->user()->email,
            'role' => $request->user()->role,
        ]);
    }

    /**
     * Update the user's profile information
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $request->user()->id,
        ]);

        $user = $request->user();
        
        // Store old values for audit (only for admin)
        $oldData = [
            'name' => $user->name,
            'email' => $user->email,
        ];
        
        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->save();

        // Log profile updates (only if admin is updating their own profile)
        if ($user->role === 'system_admin') {
            $changes = [];
            if ($oldData['name'] !== $user->name) {
                $changes[] = "name from '{$oldData['name']}' to '{$user->name}'";
            }
            if ($oldData['email'] !== $user->email) {
                $changes[] = "email from '{$oldData['email']}' to '{$user->email}'";
            }

            if (!empty($changes)) {
                AuditLog::create([
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'user_role' => $user->role,
                    'action' => 'updated',
                    'model_type' => User::class,
                    'model_id' => $user->id,
                    'description' => 'Updated own profile: ' . implode(', ', $changes),
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'module' => 'Users',
                ]);
            }
        }

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ]
        ]);
    }

    /**
     * Update the user's password
     */
    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8',
        ]);

        $user = $request->user();

        // Verify current password
        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        // Update password
        $user->password = Hash::make($validated['new_password']);
        $user->save();

        // Log password change
        AuditLog::create([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_role' => $user->role,
            'action' => 'other',
            'model_type' => User::class,
            'model_id' => $user->id,
            'description' => "Changed own password",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'module' => 'Users',
        ]);

        return response()->json([
            'message' => 'Password updated successfully'
        ]);
    }
}
