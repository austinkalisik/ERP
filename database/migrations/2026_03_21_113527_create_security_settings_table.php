<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('security_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('session_timeout')->default(30);
            $table->unsignedTinyInteger('max_login_attempts')->default(5);
            $table->unsignedSmallInteger('lockout_duration')->default(15);
            $table->unsignedSmallInteger('password_expiry_days')->default(90);
            $table->unsignedTinyInteger('min_password_length')->default(8);
            $table->boolean('require_strong_password')->default(true);
            // 0 = keep forever, otherwise auto-purge logs older than N days
            $table->unsignedSmallInteger('audit_log_retention_days')->default(90);
            $table->boolean('two_factor_enabled')->default(false);
            $table->timestamps();
        });

        // Seed the single singleton row so the app always has defaults
        DB::table('security_settings')->insert([
            'session_timeout'          => 30,
            'max_login_attempts'       => 5,
            'lockout_duration'         => 15,
            'password_expiry_days'     => 90,
            'min_password_length'      => 8,
            'require_strong_password'  => true,
            'audit_log_retention_days' => 90,
            'two_factor_enabled'       => false,
            'created_at'               => now(),
            'updated_at'               => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('security_settings');
    }
};