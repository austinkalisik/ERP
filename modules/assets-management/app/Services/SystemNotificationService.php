<?php

namespace App\Services;

use App\Mail\SystemNotificationMail;
use App\Models\SystemNotification;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class SystemNotificationService
{
    public function notifyAdmins(
        string $type,
        string $title,
        string $message,
        ?string $url = null,
        ?string $sourceType = null,
        ?int $sourceId = null,
        ?int $excludeUserId = null,
        ?string $priority = null,
        ?array $data = null
    ): void {
        if (! $this->shouldDeliver($type)) {
            return;
        }

        $excludeUserId = $excludeUserId ?? Auth::id();
        $admins = User::where('role', 'admin')->get();

        foreach ($admins as $admin) {
            if ($excludeUserId && (int) $admin->id === (int) $excludeUserId) {
                continue;
            }

            SystemNotification::create([
                'user_id' => $admin->id,
                'type' => $type,
                'priority' => $priority ?? $this->priorityForType($type),
                'title' => $title,
                'message' => $message,
                'url' => $url,
                'source_type' => $sourceType,
                'source_id' => $sourceId,
                'data' => $data,
            ]);

            $this->sendEmailNotification($admin, $title, $message, $url);
        }
    }

    public function notifyUser(
        int $userId,
        string $type,
        string $title,
        string $message,
        ?string $url = null,
        ?string $sourceType = null,
        ?int $sourceId = null,
        ?int $excludeUserId = null,
        ?string $priority = null,
        ?array $data = null
    ): void {
        if (! $this->shouldDeliver($type)) {
            return;
        }

        $excludeUserId = $excludeUserId ?? Auth::id();

        if ($excludeUserId && $userId === $excludeUserId) {
            return;
        }

        SystemNotification::create([
            'user_id' => $userId,
            'type' => $type,
            'priority' => $priority ?? $this->priorityForType($type),
            'title' => $title,
            'message' => $message,
            'url' => $url,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'data' => $data,
        ]);

        $user = User::find($userId);

        if ($user) {
            $this->sendEmailNotification($user, $title, $message, $url);
        }
    }

    public function notifyUsers(
        Collection|array $userIds,
        string $type,
        string $title,
        string $message,
        ?string $url = null,
        ?string $sourceType = null,
        ?int $sourceId = null,
        ?int $excludeUserId = null,
        ?string $priority = null,
        ?array $data = null
    ): void {
        foreach (collect($userIds)->unique() as $userId) {
            $this->notifyUser(
                (int) $userId,
                $type,
                $title,
                $message,
                $url,
                $sourceType,
                $sourceId,
                $excludeUserId,
                $priority,
                $data
            );
        }
    }

    protected function priorityForType(string $type): string
    {
        return match ($type) {
            'assignment_overdue',
            'asset_deleted',
            'inventory_alert' => 'high',
            'low_stock',
            'maintenance_due' => 'medium',
            'assignment_created',
            'assignment_returned',
            'asset_created',
            'asset_updated',
            'settings_updated',
            'user_created',
            'user_updated' => 'normal',
            default => 'low',
        };
    }

    protected function shouldDeliver(string $type): bool
    {
        if ($type === 'maintenance_due' && ! $this->isSettingEnabled('maintenance_alerts_enabled', true)) {
            return false;
        }

        return true;
    }

    protected function sendEmailNotification(User $user, string $title, string $message, ?string $url = null): void
    {
        if (! $this->isSettingEnabled('email_notifications_enabled', true)) {
            return;
        }

        if (blank($user->email)) {
            return;
        }

        Mail::to($user->email)->send(new SystemNotificationMail(
            $title,
            $message,
            $this->qualifyUrl($url)
        ));
    }

    protected function qualifyUrl(?string $url): ?string
    {
        if (blank($url)) {
            return null;
        }

        $url = trim((string) $url);

        if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://')) {
            return $url;
        }

        return rtrim((string) config('app.url'), '/').'/'.ltrim($url, '/');
    }

    protected function isSettingEnabled(string $key, bool $default = false): bool
    {
        $value = DB::table('settings')->where('key', $key)->value('value');

        if ($value === null) {
            return $default;
        }

        return (string) $value === '1';
    }
}
