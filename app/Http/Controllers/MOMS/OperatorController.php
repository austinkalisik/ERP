<?php

namespace App\Http\Controllers\MOMS;

use App\Http\Controllers\Controller;
use App\Models\MOMS\Operator;
use App\Models\User;
use App\Models\AuditLog;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;

class OperatorController extends Controller
{
    /**
     * GET /api/moms/operators
     */
    public function index(): JsonResponse
    {
        $operators = Operator::with('user')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($op) {
                $op->user_name  = $op->user?->name  ?? 'Unknown';
                $op->user_email = $op->user?->email ?? null;
                return $op;
            });

        return response()->json($operators);
    }

    /**
     * GET /api/moms/operators/available-users
     * Kept for backwards compatibility — returns moms_operator users
     * who don't yet have an operator profile.
     */
    public function availableUsers(): JsonResponse
    {
        $assignedUserIds = Operator::pluck('user_id')->toArray();

        $users = User::where('role', 'moms_operator')
            ->whereNotIn('id', $assignedUserIds)
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return response()->json($users);
    }

    /**
     * POST /api/moms/operators
     *
     * Real-world approach — single atomic transaction:
     *   1. Validate ALL fields (user + operator) up front so we never
     *      partially commit.
     *   2. Create the users row inside DB::transaction().
     *   3. Create the operators row in the same transaction.
     *   4. If anything throws, both inserts are rolled back automatically.
     *   5. Audit log written after commit (outside transaction — a failed
     *      audit log should never roll back a successful creation).
     */
    public function store(Request $request): JsonResponse
    {
        $currentUser = $request->user();

        // ── Validate everything before touching the DB ──────────────────
        $validated = $request->validate([
            // User account fields
            'name'               => 'required|string|max:255',
            'email'              => 'required|string|email|max:255|unique:users,email',
            'password'           => 'required|string|min:8',
            // Operator profile fields
            'license_number'     => 'required|string|unique:operators,license_number',
            'license_type'       => 'nullable|string|max:255',
            'license_expiry'     => 'required|date|after_or_equal:today',
            'certification'      => 'nullable|string|max:255',
            'total_hours'        => 'nullable|integer|min:0',
            'performance_rating' => 'nullable|numeric|min:0|max:5',
            'notes'              => 'nullable|string',
            'status'             => 'required|in:Active,Inactive,On Leave',
        ]);

        // ── Atomic transaction ───────────────────────────────────────────
        [$operator, $newUserId] = DB::transaction(function () use ($validated) {

            // Step 1 — create user account
            $user = User::create([
                'name'      => $validated['name'],
                'email'     => $validated['email'],
                'password'  => Hash::make($validated['password']),
                'role'      => 'moms_operator',
                'is_active' => true,
            ]);

            // Step 2 — create operator profile linked to that user
            $operator = Operator::create([
                'user_id'            => $user->id,
                'license_number'     => $validated['license_number'],
                'license_type'       => $validated['license_type']       ?? null,
                'license_expiry'     => $validated['license_expiry'],
                'certification'      => $validated['certification']      ?? null,
                'total_hours'        => $validated['total_hours']        ?? 0,
                'performance_rating' => $validated['performance_rating'] ?? 0,
                'notes'              => $validated['notes']              ?? null,
                'status'             => $validated['status'],
            ]);

            $operator->user_name  = $user->name;
            $operator->user_email = $user->email;

            return [$operator, $user->id];
        });

        // Assign ALL moms_operator permissions — mirrors RolePermissionSeeder exactly
        // so manually created operators have the same access as seeded ones.
        try {
            $operatorSlugs = [
                'access_moms',
                'moms.assignments.view',
                'moms.operations.view',
                'moms.operations.create',
                'moms.breakdowns.view',
                'moms.breakdowns.create',
            ];
            $permIds = Permission::whereIn('slug', $operatorSlugs)->pluck('id')->toArray();
            if (!empty($permIds)) {
                $newUser = User::find($newUserId);
                $newUser?->permissions()->syncWithoutDetaching($permIds);
            }
        } catch (\Throwable $e) {
            Log::warning("Failed to assign permissions to operator {$operator->id}: " . $e->getMessage());
        }

        // ── Audit log (outside transaction — non-critical) ───────────────
        try {
            AuditLog::create([
                'user_id'     => $currentUser->id,
                'user_name'   => $currentUser->name,
                'user_role'   => $currentUser->role,
                'model_type'  => 'App\\Models\\MOMS\\Operator',
                'model_id'    => $operator->id,
                'action'      => 'created',
                'description' => "Created operator: {$operator->user_name} (license: {$operator->license_number})",
                'new_values'  => [
                    'name'           => $operator->user_name,
                    'email'          => $operator->user_email,
                    'license_number' => $operator->license_number,
                    'status'         => $operator->status,
                ],
                'ip_address'  => $request->ip(),
                'user_agent'  => $request->userAgent(),
                'module'      => 'MOMS',
            ]);
        } catch (\Throwable $e) {
            // Audit failure is non-fatal — log it but don't 500 the response
            Log::warning("Audit log failed for operator creation: " . $e->getMessage());
        }

        return response()->json([
            'message'  => 'Operator created successfully',
            'operator' => $operator,
        ], 201);
    }

    /**
     * GET /api/moms/operators/{id}
     */
    public function show($id): JsonResponse
    {
        $operator = Operator::with('user')->findOrFail($id);
        $operator->user_name  = $operator->user?->name  ?? 'Unknown';
        $operator->user_email = $operator->user?->email ?? null;

        return response()->json($operator);
    }

    /**
     * PUT /api/moms/operators/{id}
     * Updates operator profile fields only — not the linked user account.
     * To change name/email/password use the User Management settings page.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $operator = Operator::findOrFail($id);

        $validated = $request->validate([
            'license_number'     => ['sometimes', 'string', Rule::unique('operators', 'license_number')->ignore($id)],
            'license_type'       => 'nullable|string|max:255',
            'license_expiry'     => 'sometimes|date',
            'certification'      => 'nullable|string|max:255',
            'total_hours'        => 'nullable|integer|min:0',
            'performance_rating' => 'nullable|numeric|min:0|max:5',
            'notes'              => 'nullable|string',
            'status'             => 'sometimes|in:Active,Inactive,On Leave',
        ]);

        $operator->update($validated);
        $operator->load('user');
        $operator->user_name  = $operator->user?->name  ?? 'Unknown';
        $operator->user_email = $operator->user?->email ?? null;

        return response()->json([
            'message'  => 'Operator updated successfully',
            'operator' => $operator,
        ]);
    }

    /**
     * DELETE /api/moms/operators/{id}
     * Deletes the operator profile only — preserves the user account
     * so the person can still log in with a different role if needed.
     */
    public function destroy($id): JsonResponse
    {
        $operator = Operator::with('user')->findOrFail($id);
        $operator->delete();

        return response()->json([
            'message' => 'Operator profile deleted successfully',
        ]);
    }
}