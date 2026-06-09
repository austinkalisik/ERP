<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('maintenance_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('machine_id')->constrained('machines')->onDelete('cascade');
            $table->foreignId('maintenance_schedule_id')->nullable()->constrained('maintenance_schedules')->onDelete('set null');
            $table->enum('maintenance_type', ['Preventive', 'Corrective', 'Predictive', 'Emergency', 'Routine Check'])->default('Preventive');
            $table->enum('status', ['Scheduled', 'In Progress', 'Completed', 'Cancelled'])->default('Scheduled');
            $table->dateTime('start_time');
            $table->dateTime('end_time')->nullable();
            $table->decimal('cost', 10, 2)->nullable();
            $table->text('description');

            // AIMS integration: structured parts used during maintenance
            // Each entry: { item_id, name, sku, qty, unit, unit_cost, total }
            $table->json('parts_used')->nullable();

            // Auto-calculated total cost from parts_used
            $table->decimal('parts_cost', 10, 2)->nullable()->default(0);

            $table->foreignId('performed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index('machine_id');
            $table->index('maintenance_schedule_id');
            $table->index('status');
            $table->index('start_time');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_logs');
    }
};