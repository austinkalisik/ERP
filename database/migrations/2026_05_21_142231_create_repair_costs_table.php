<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repair_costs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('machine_id')
                  ->constrained('machines')
                  ->cascadeOnDelete();
            $table->foreignId('maintenance_log_id')
                  ->nullable()
                  ->constrained('maintenance_logs')
                  ->nullOnDelete();

            $table->enum('cost_type', ['labour', 'parts', 'external_service', 'other']);
            $table->string('description');
            $table->decimal('amount', 14, 2);
            $table->string('currency', 10)->default('PGK');
            $table->string('supplier')->nullable();
            $table->string('invoice_ref')->nullable();
            $table->date('cost_date');

            $table->foreignId('recorded_by')->constrained('users');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repair_costs');
    }
};