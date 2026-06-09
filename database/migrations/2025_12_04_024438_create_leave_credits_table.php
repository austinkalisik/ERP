<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('leave_credits');

        Schema::create('leave_credit_details', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                  ->constrained('employees')
                  ->onDelete('cascade');

            $table->foreignId('leave_type_id')
                  ->constrained('leave_types')
                  ->onDelete('cascade');

            $table->year('year')->nullable();
            $table->decimal('total_days', 8, 2)->default(0);
            $table->decimal('used_days',  8, 2)->default(0);
            $table->decimal('remaining_days', 8, 2)->default(0);

            $table->timestamps();

            // One row per employee per leave type per year
            $table->unique(['employee_id', 'leave_type_id', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_credit_details');
    }
};