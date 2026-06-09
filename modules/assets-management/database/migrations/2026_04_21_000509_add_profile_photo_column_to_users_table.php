<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // No-op: profile_photo is already managed by
        // 2026_04_13_032128_add_profile_photo_to_users_table.php.
    }

    public function down(): void
    {
        // No-op to avoid dropping an existing column on rollback.
    }
};
