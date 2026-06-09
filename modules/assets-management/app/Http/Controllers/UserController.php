<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    protected function ensureAdmin(): void
    {
        abort_unless(
            Auth::check() && Auth::user()->role === 'admin',
            403,
            'Only administrators can manage users.'
        );
    }

    protected function impersonationAllowed(): bool
    {
        $value = DB::table('settings')
            ->where('key', 'allow_user_impersonation')
            ->value('value');

        if ($value === null) {
            return true;
        }

        return (string) $value === '1';
    }

    public function index(Request $request)
    {
        $this->ensureAdmin();

        $perPage = max(5, min((int) $request->integer('per_page', 10), 50));

        $query = User::query()
            ->withCount(['assignments', 'activeAssignments', 'assetLogs'])
            ->latest();

        if ($request->filled('search')) {
            $search = trim((string) $request->search);

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('role', 'like', "%{$search}%");
            });
        }

        $roleCounts = User::query()
            ->select('role', DB::raw('count(*) as total'))
            ->groupBy('role')
            ->pluck('total', 'role');

        $users = $query->paginate($perPage)->withQueryString();

        return response()->json(array_merge($users->toArray(), [
            'role_counts' => $roleCounts,
        ]));
    }

    public function store(Request $request)
    {
        $this->ensureAdmin();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::in(User::ROLE_VALUES)],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['email_verified_at'] = now();

        $user = User::create($validated);

        return response()->json($user, 201);
    }

    public function show(User $user)
    {
        $this->ensureAdmin();

        $user->load([
            'assignments.item',
            'activeAssignments.item',
            'assetLogs.item',
        ]);

        return response()->json($user);
    }

    public function update(Request $request, User $user)
    {
        $this->ensureAdmin();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'role' => ['required', Rule::in(User::ROLE_VALUES)],
            'password' => ['nullable', 'confirmed', Password::min(8)],
        ]);

        if ((int) Auth::id() === (int) $user->id && $validated['role'] !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'You cannot remove the administrator role from your own account.'], 422);
        }

        if ($user->role === User::ROLE_ADMIN && $validated['role'] !== User::ROLE_ADMIN && User::where('role', User::ROLE_ADMIN)->count() <= 1) {
            return response()->json(['message' => 'At least one administrator account is required.'], 422);
        }

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json($user);
    }

    public function destroy(User $user)
    {
        $this->ensureAdmin();

        if ((int) Auth::id() === (int) $user->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        if ($user->activeAssignments()->exists()) {
            return response()->json(['message' => 'Cannot delete user with active assignments.'], 422);
        }

        if ($user->assignments()->exists()) {
            return response()->json(['message' => 'Cannot delete user with assignment history.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }

    public function impersonate(User $user)
    {
        $this->ensureAdmin();

        if (! $this->impersonationAllowed()) {
            return response()->json(['message' => 'User impersonation is disabled by system settings.'], 403);
        }

        if ((int) $user->id === (int) Auth::id()) {
            return response()->json(['message' => 'You cannot impersonate yourself.'], 422);
        }

        session([
            'impersonator_id' => Auth::id(),
        ]);

        Auth::login($user);

        return response()->json([
            'message' => 'Now impersonating '.$user->name,
        ]);
    }

    public function stopImpersonation()
    {
        if (! session()->has('impersonator_id')) {
            return response()->json(['message' => 'No impersonation session found.'], 422);
        }

        $impersonatorId = (int) session('impersonator_id');

        session()->forget('impersonator_id');

        Auth::loginUsingId($impersonatorId);
        session()->regenerate();

        return response()->json([
            'message' => 'Returned to administrator account.',
            'user' => array_merge(Auth::user()->fresh()->toArray(), [
                'is_impersonating' => false,
                'impersonator_id' => null,
            ]),
        ]);
    }
}
