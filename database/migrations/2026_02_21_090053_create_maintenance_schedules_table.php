<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('machine_id')->constrained('machines')->onDelete('cascade');
            $table->string('title');
            $table->text('description');
            $table->enum('frequency', ['Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom'])->default('Monthly');
            $table->integer('interval_value')->default(1);
            $table->integer('hour_interval')->nullable();      // PMS every X engine hours
            $table->integer('last_engine_hours')->nullable();  // engine hours when last PMS was done
            $table->integer('next_due_hours')->nullable();     // auto-calculated: last_engine_hours + hour_interval
            $table->date('next_due_date')->nullable();
            $table->date('last_performed_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('machine_id');
            $table->index('next_due_date');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_schedules');
    }
};