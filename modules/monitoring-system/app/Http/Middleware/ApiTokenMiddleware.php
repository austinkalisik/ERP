<?php

namespace App\Http\Middleware;

use App\Models\PersonalAccessToken;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ApiTokenMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $plain = $request->bearerToken();
        $token = $plain ? PersonalAccessToken::where('token', hash('sha256', $plain))->first() : null;

        if (! $token) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $token->forceFill(['last_used_at' => now()])->save();
        Auth::setUser($token->user);
        $request->setUserResolver(fn () => $token->user);

        return $next($request);
    }
}
