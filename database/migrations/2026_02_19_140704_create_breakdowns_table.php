<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('breakdowns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('machine_id')->constrained('machines')->onDelete('cascade');
            $table->string('breakdown_type'); // e.g., "Engine failure", "Hydraulic leak"
            $table->enum('severity', ['Minor', 'Moderate', 'Critical'])->default('Minor');
            $table->dateTime('incident_time');
            $table->text('description');
            $table->text('diagnostics')->nullable();
            $table->integer('downtime_minutes')->nullable();
            $table->decimal('repair_cost', 10, 2)->nullable();
            $table->enum('status', ['Reported', 'Under Repair', 'Resolved', 'Pending Parts'])->default('Reported');
            $table->foreignId('reported_by')->nullable()->constrained('users')->onDelete('set null');
            $table->dateTime('resolved_at')->nullable();
            $table->timestamps();

            $table->index('machine_id');
            $table->index('incident_time');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('breakdowns');
    }
};