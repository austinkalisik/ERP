<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Unified notifications endpoint for ALL modules.
 *
 * Reads from Laravel's built-in `notifications` table.
 * Every module stores to the same table — MOMS, HRMS, AIMS, Payroll.
 *
 * Routes (add to api.php inside auth:sanctum group):
 *   GET  /api/notifications
 *   POST /api/notifications/{id}/read
 *   POST /api/notifications/read-all
 */
class NotificationsController extends Controller
{
    public function index()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $unread = $user->unreadNotifications()
            ->latest()
            ->take(30)
            ->get();

        $notifications = $unread->map(fn($n) => [
            'id'         => $n->id,
            // Fallback: if old notification has no 'module', guess from 'type'
            'module'     => $n->data['module'] ?? $this->guessModule($n->data['type'] ?? ''),
            'type'       => $n->data['type']    ?? 'general',
            'title'      => $n->data['title']   ?? 'Notification',
            'message'    => $n->data['message'] ?? '',
            'url'        => $n->data['url']     ?? '/',
            'created_at' => $n->created_at->diffForHumans(),
            'read'       => false,
        ]);

        return response()->json([
            'notifications' => $notifications,
            'unread_count'  => $unread->count(),
        ]);
    }

    public function markAsRead($id)
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $user->unreadNotifications()
            ->where('id', $id)
            ->first()
            ?->markAsRead();

        return response()->json(['message' => 'Marked as read']);
    }

    public function markAllAsRead()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $user->unreadNotifications()->update(['read_at' => now()]);

        return response()->json(['message' => 'All marked as read']);
    }

    /**
     * Guess the module from the notification type string
     * for old notifications that don't have a 'module' field yet.
     */
    private function guessModule(string $type): string
    {
        if (str_contains($type, 'maintenance') ||
            str_contains($type, 'assignment')  ||
            str_contains($type, 'breakdown')   ||
            str_contains($type, 'fuel')        ||
            str_contains($type, 'operation')) {
            return 'moms';
        }
        if (str_contains($type, 'application') ||
            str_contains($type, 'employee')    ||
            str_contains($type, 'leave')       ||
            str_contains($type, 'overtime')) {
            return 'hrms';
        }
        if (str_contains($type, 'stock')   ||
            str_contains($type, 'purchase') ||
            str_contains($type, 'request_order')) {
            return 'aims';
        }
        if (str_contains($type, 'payroll') ||
            str_contains($type, 'payslip') ||
            str_contains($type, 'cash_advance')) {
            return 'payroll';
        }
        return 'system';
    }
}