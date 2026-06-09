<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'profile_photo')) {
            Schema::table('users', function (Blueprint $table) {
                // Avoid using ->after('role') because older databases may not have
                // a `role` column. Adding without positioning is more portable.
                $table->string('profile_photo')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'profile_photo')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('profile_photo');
            });
        }
    }
};
