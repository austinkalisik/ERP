<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
       
        Schema::create('payroll_ncsl_table', function (Blueprint $table) {
            $table->id();
            $table->decimal('compensation_from', 12, 2);
            $table->decimal('compensation_to',   12, 2);
            $table->decimal('deduction_amount',  10, 2)->comment('Fixed deduction amount per period');
            $table->unsignedSmallInteger('year');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_ncsl_table');
    }
};