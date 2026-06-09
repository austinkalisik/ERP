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
        Schema::create('account_information', function (Blueprint $table) {
            $table->id();

            // Relationship to employees
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');

            // NASFUND "Yes / No" boolean flag
            $table->boolean('nasfund')->default(false);

            // Existing fields
            $table->string('nasfund_number')->nullable();
            $table->string('tin_number')->nullable();
            $table->string('work_permit_number')->nullable();
            $table->date('work_permit_expiry')->nullable();
            $table->string('visa_number')->nullable();
            $table->date('visa_expiry')->nullable();

            // Bank info
            $table->string('bsb_code')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('account_number')->nullable();
            $table->string('account_name')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('account_information');
    }
};