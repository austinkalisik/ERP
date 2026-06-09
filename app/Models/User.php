<?php

namespace App\Models;

use App\Models\Permission;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Collection;
use App\Models\HRMS\Employee;
use App\Traits\Auditable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;
    use Auditable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
        ];
    }

    /* =====================================================
     | ROLE HELPERS
     |===================================================== */

    public function isSystemAdmin(): bool
    {
        return $this->role === 'system_admin';
    }

    public function isHR(): bool
    {
        return $this->role === 'hr';
    }

    public function isDeptHead(): bool
    {
        return $this->role === 'dept_head';
    }

    public function isEmployee(): bool
    {
        return $this->role === 'employee';
    }

    /* =====================================================
     | PERMISSIONS
     |===================================================== */

    protected ?Collection $cachedPermissions = null;

    /**
     * User permissions relationship
     */
    public function permissions()
    {
        return $this->belongsToMany(Permission::class);
    }

    /**
     * Get permission slugs (cached per request)
     */
    public function getPermissionSlugs(): Collection
    {
        if ($this->cachedPermissions === null) {
            $this->cachedPermissions = $this->permissions
                ->pluck('slug')
                ->values();
        }

        return $this->cachedPermissions;
    }

    /**
     * Check permission (role-aware)
     */
    public function hasPermission(string $permission): bool
    {
        // System Admin bypass
        if ($this->isSystemAdmin()) {
            return true;
        }

        return $this->getPermissionSlugs()->contains($permission);
    }

    public function employee()
    {
        return $this->hasOne(Employee::class, 'user_id', 'id');
    }
}