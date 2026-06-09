<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();

            // Link to employee
            $table->foreignId('employee_id')
                  ->constrained('employees')
                  ->onDelete('cascade');

            // ✅ Shift tracking
            $table->foreignId('shift_id')
                  ->nullable()
                  ->constrained('shifts')
                  ->nullOnDelete();
            $table->string('shift_type', 20)
                  ->nullable()
                  ->comment('Day Shift or Night Shift');

            // Attendance date
            $table->date('date');

            // Morning attendance
            $table->time('am_time_in')->nullable();
            $table->time('am_time_out')->nullable();

            // Afternoon/PM attendance
            $table->time('pm_time_in')->nullable();
            $table->time('pm_time_out')->nullable();

            // Status
            $table->enum('status', ['Present', 'Late', 'Absent', 'On Leave', 'Holiday', 'Public Holiday'])
                  ->default('Present');

            $table->timestamps();

            // Prevent duplicate attendance per day
            $table->unique(['employee_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};