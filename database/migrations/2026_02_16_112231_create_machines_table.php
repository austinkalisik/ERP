<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('machines', function (Blueprint $table) {
            $table->id();
            $table->string('machine_id')->unique(); // e.g., EXC-0001
            $table->string('category'); // Excavator, Dozer, etc.
            $table->string('make');
            $table->string('model');
            $table->integer('engine_hours')->default(0);
            $table->decimal('fuel_capacity', 10, 2); // Liters
            $table->enum('status', ['Active', 'Maintenance', 'Inactive'])->default('Active');
            $table->string('location');
            $table->date('last_maintenance')->nullable();
            $table->date('next_maintenance')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('machines');
    }
};