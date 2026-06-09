<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignment_time_entries', function (Blueprint $table) {
            $table->id();

            // Old flow — time entries added inline from AssignmentView
            $table->foreignId('assignment_id')
                  ->nullable()
                  ->constrained('assignments')
                  ->onDelete('cascade');

            // New flow — time entries added from TimeEntries page (StartShift)
            $table->foreignId('operation_id')
                  ->nullable()
                  ->constrained('shift_operations')
                  ->onDelete('cascade');

            $table->string('time_category')->nullable();
            $table->string('activity')->nullable();
            $table->datetime('start_time');
            $table->datetime('end_time')->nullable();
            $table->decimal('duration_hours', 8, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignment_time_entries');
    }
};