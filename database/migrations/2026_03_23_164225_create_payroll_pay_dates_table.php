<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_pay_dates', function (Blueprint $table) {
            $table->id();
            $table->date('pay_date');
            $table->date('cutoff_start_date');
            $table->date('cutoff_end_date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_pay_dates');
    }
};