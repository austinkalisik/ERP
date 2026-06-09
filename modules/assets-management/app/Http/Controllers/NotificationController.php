<?php

namespace App\Http\Controllers;

use App\Models\SystemNotification;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function apiIndex(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $perPage = max(5, min((int) $request->integer('per_page', 10), 50));

        $notifications = $this->filteredQuery($request)
            ->orderByRaw("CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END")
            ->latest()
            ->paginate($perPage);

        $notifications->getCollection()->transform(function (SystemNotification $notification) {
            return $this->transformNotification($notification);
        });

        return response()->json($notifications);
    }

    public function stats(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return response()->json([
            'total' => $user->notifications()->count(),
            'unread' => $user->notifications()->whereNull('read_at')->count(),
            'read' => $user->notifications()->whereNotNull('read_at')->count(),
            'high_priority_unread' => $user->notifications()
                ->where('priority', 'high')
                ->whereNull('read_at')
                ->count(),
            'by_priority' => $user->notifications()
                ->selectRaw('priority, count(*) as total')
                ->groupBy('priority')
                ->pluck('total', 'priority'),
            'by_type' => $user->notifications()
                ->selectRaw('type, count(*) as total')
                ->groupBy('type')
                ->orderBy('type')
                ->pluck('total', 'type'),
        ]);
    }

    public function unreadCount(): JsonResponse
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return response()->json([
            'count' => $user->notifications()->whereNull('read_at')->count(),
        ]);
    }

    public function markRead(int|string $id): JsonResponse
    {
        $notification = $this->findUserNotification($id);

        if (! $notification->read_at) {
            $notification->update([
                'read_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Notification marked as read.',
            'notification' => $this->transformNotification($notification->fresh()),
        ]);
    }

    public function markUnread(int|string $id): JsonResponse
    {
        $notification = $this->findUserNotification($id);

        $notification->update([
            'read_at' => null,
        ]);

        return response()->json([
            'message' => 'Notification marked as unread.',
            'notification' => $this->transformNotification($notification->fresh()),
        ]);
    }

    public function markAllRead(): JsonResponse
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $user->notifications()
            ->whereNull('read_at')
            ->update([
                'read_at' => now(),
            ]);

        return response()->json([
            'message' => 'All notifications marked as read.',
        ]);
    }

    public function destroy(int|string $id): JsonResponse
    {
        $notification = $this->findUserNotification($id);
        $notification->delete();

        return response()->json([
            'message' => 'Notification deleted.',
        ]);
    }

    public function clearRead(): JsonResponse
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $deleted = $user->notifications()
            ->whereNotNull('read_at')
            ->delete();

        return response()->json([
            'message' => 'Read notifications cleared.',
            'deleted' => $deleted,
        ]);
    }

    protected function findUserNotification(int|string $id): SystemNotification
    {
        $user = $this->authenticatedUserOrAbort();

        return $user->notifications()->findOrFail($id);
    }

    /**
     * @return array<string, mixed>
     */
    protected function transformNotification(SystemNotification $notification): array
    {
        return [
            'id' => $notification->id,
            'title' => $notification->title,
            'message' => $notification->message,
            'type' => $notification->type,
            'priority' => $notification->priority ?? 'normal',
            'url' => $this->resolveNotificationUrl($notification),
            'source_type' => $notification->source_type,
            'source_id' => $notification->source_id,
            'data' => $notification->data ?? [],
            'read_at' => $notification->read_at,
            'created_at' => $notification->created_at,
            'is_read' => $notification->is_read,
        ];
    }

    /**
     * @return HasMany<SystemNotification, User>
     */
    protected function filteredQuery(Request $request): HasMany
    {
        $query = $this->authenticatedUserOrAbort()->notifications();

        if ($request->filled('status')) {
            if ($request->status === 'unread') {
                $query->whereNull('read_at');
            } elseif ($request->status === 'read') {
                $query->whereNotNull('read_at');
            }
        }

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->string('type')->toString());
        }

        if ($request->filled('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->string('priority')->toString());
        }

        if ($request->filled('source_type')) {
            $query->where('source_type', $request->string('source_type')->toString());
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->search);

            $query->where(function ($sub) use ($search) {
                $sub->where('title', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%");
            });
        }

        return $query;
    }

    protected function authenticatedUserOrAbort(): User
    {
        $user = Auth::user();

        if (! $user instanceof User) {
            abort(401, 'Unauthenticated');
        }

        return $user;
    }

    protected function resolveNotificationUrl(SystemNotification $notification): string
    {
        if (! empty($notification->url)) {
            return $notification->url;
        }

        return match ($notification->type) {
            'asset_created',
            'asset_updated',
            'asset_deleted',
            'maintenance_due' => '/items',
            'low_stock',
            'inventory_alert' => '/inventory',
            'assignment_created',
            'assignment_returned',
            'assignment_overdue' => '/assignments',
            'user_created',
            'user_updated' => '/users',
            'settings_updated' => '/settings',
            default => '/notifications',
        };
    }
}
