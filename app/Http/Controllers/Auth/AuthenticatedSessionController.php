<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use App\Services\AuditService;

class AuthenticatedSessionController extends Controller
{
    /**
     * Handle an incoming authentication request (SPA / React).
     */
    public function store(Request $request): Response
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (!Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Prevent session fixation
       $request->session()->regenerate();

        AuditService::login();

        $user = Auth::user();

        /** @var User $user */
        $user->load('employee');

        return response([
            'user' => $user,
        ], 200);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): Response
    {
        AuditService::logout();


        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response([
            'message' => 'Logged out successfully',
        ], 200);
    }
}
