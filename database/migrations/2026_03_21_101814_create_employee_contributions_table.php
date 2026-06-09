<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_contributions', function (Blueprint $table) {
            $table->id();

            // FK to employees table — integer PK, not biometric_id string
            // onDelete cascade: removing an employee removes all their contributions
            $table->unsignedBigInteger('employee_id');
            $table->foreign('employee_id')
                  ->references('id')
                  ->on('employees')
                  ->onDelete('cascade');

            // The year this contribution applies to (e.g. 2025)
            $table->unsignedSmallInteger('year');

            // Contribution type label (e.g. "NASFUND", "Income Tax")
            // Using string not FK so it stays flexible until a contribution_types
            // settings table is added later
            $table->string('contribution_type', 100);

            // "percentage" or "amount"
            $table->enum('value_type', ['percentage', 'amount'])->default('percentage');

            // The contribution value:
            //   percentage → stored as decimal  (e.g. 6% = 0.060000)
            //   amount     → stored as currency  (e.g. PGK 150.00)
            // precision 10, scale 6 handles both cases cleanly
            $table->decimal('value', 10, 6);

            // Optional free-text notes (e.g. "Employee elected opt-in")
            $table->string('notes', 255)->nullable();

            // Soft deletes — lets HR "remove" a contribution without losing history
            $table->softDeletes();

            $table->timestamps();

            // Unique constraint: one contribution type per employee per year
            // Prevents accidental duplicates while allowing historical records
            $table->unique(['employee_id', 'year', 'contribution_type'], 'unique_contribution_per_year');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_contributions');
    }
};