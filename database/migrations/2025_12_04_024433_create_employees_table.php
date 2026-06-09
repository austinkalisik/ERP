<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();

            // 🔗 Optional link to user account
            $table->foreignId('user_id')
                  ->nullable()
                  ->constrained('users')
                  ->onDelete('set null');

            // 🧬 Biometrics (HR identity)
            $table->string('biometric_id')->unique();

            // Employee Number
            $table->string('employee_number')->nullable()->unique();

            // Full Name
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');

            // Profile Picture
            $table->string('profile_picture')->nullable();

            // QR Code
            $table->text('qr_code')->nullable();

            // Shift (nullable because employees might not be assigned yet)
            $table->foreignId('shift_id')
                  ->nullable()
                  ->constrained('shifts')
                  ->onDelete('set null');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
