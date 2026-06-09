<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('machine_id')->constrained('machines')->onDelete('cascade');
            $table->foreignId('operator_id')->constrained('operators')->onDelete('cascade');
            $table->string('job_site')->nullable();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('status', ['Pending', 'Active', 'Completed', 'Cancelled'])->default('Pending');
            $table->enum('shift_type', ['Day', 'Night', 'Full Day'])->default('Day');
            $table->string('time_category')->nullable();
            $table->string('activity')->nullable();
            $table->decimal('reading_start', 10, 2)->nullable();
            $table->decimal('reading_end', 10, 2)->nullable();
            $table->dateTime('start_time');
            $table->dateTime('end_time')->nullable();
            $table->decimal('duration_hours', 8, 2)->nullable();
            $table->text('task_description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assignments');
    }
};