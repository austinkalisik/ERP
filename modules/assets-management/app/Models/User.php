<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory;
    use Notifiable;

    public const ROLE_ADMIN = 'admin';

    public const ROLE_MANAGER = 'manager';

    public const ROLE_ASSET_OFFICER = 'asset_officer';

    public const ROLE_PROCUREMENT_OFFICER = 'procurement_officer';

    public const ROLE_AUDITOR = 'auditor';

    public const ROLE_STAFF = 'staff';

    public const ROLE_VALUES = [
        self::ROLE_ADMIN,
        self::ROLE_MANAGER,
        self::ROLE_ASSET_OFFICER,
        self::ROLE_PROCUREMENT_OFFICER,
        self::ROLE_AUDITOR,
        self::ROLE_STAFF,
    ];

    protected $fillable = [
        'name',
        'email',
        'email_verified_at',
        'password',
        'role',
        'profile_photo',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    protected $appends = [
        'profile_photo_url',
    ];

    public function assignments()
    {
        return $this->hasMany(Assignment::class);
    }

    public function activeAssignments()
    {
        return $this->hasMany(Assignment::class)->whereNull('returned_at');
    }

    public function assetLogs()
    {
        return $this->hasMany(AssetLog::class);
    }

    public function notifications()
    {
        return $this->hasMany(SystemNotification::class);
    }

    public function getProfilePhotoUrlAttribute(): ?string
    {
        if (! $this->profile_photo) {
            return null;
        }

        return route('profile.photo.show', [
            'user' => $this->id,
            'v' => optional($this->updated_at)?->timestamp,
        ]);
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }
}
