<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fuel_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('machine_id')->constrained('machines')->onDelete('cascade');
            $table->enum('fuel_type', ['Diesel', 'Petrol', 'LPG', 'CNG']);
            $table->decimal('volume', 10, 2);       // Liters
            $table->decimal('engine_hours', 8, 2)->nullable()->default(0); // ✅ NEW - for efficiency tracking
            $table->decimal('unit_price', 10, 2);   // Price per liter
            $table->decimal('total_cost', 10, 2);   // Total cost
            $table->date('transaction_date');
            $table->foreignId('logged_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('transaction_date');
            $table->index('machine_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fuel_transactions');
    }
};