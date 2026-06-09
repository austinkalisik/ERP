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
        Schema::create('operators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('license_number')->unique();
            $table->string('license_type')->nullable();
            $table->date('license_expiry');
            $table->string('certification')->nullable();
            $table->integer('total_hours')->default(0);
            $table->decimal('performance_rating', 3, 2)->default(0.00); // 0-5 rating
            $table->text('notes')->nullable();
            $table->enum('status', ['Active', 'Inactive', 'On Leave'])->default('Active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('operators');
    }
};