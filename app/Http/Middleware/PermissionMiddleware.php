<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PermissionMiddleware
{
    public function handle(Request $request, Closure $next, string $permission)
    {
        $user = $request->user();

        if (! $user?->hasPermission($permission)) {
            abort(Response::HTTP_FORBIDDEN, 'Permission denied');
        }

        return $next($request);
    }
}
