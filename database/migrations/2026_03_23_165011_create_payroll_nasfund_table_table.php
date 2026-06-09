<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_nasfund_table', function (Blueprint $table) {
            $table->id();
            $table->decimal('compensation_from', 12, 2);
            $table->decimal('compensation_to',   12, 2);
            $table->decimal('employee_rate',      8, 6)->comment('Employee contribution rate e.g. 0.06 = 6%');
            $table->decimal('employer_rate',      8, 6)->comment('Employer contribution rate e.g. 0.085 = 8.5%');
            $table->unsignedSmallInteger('year');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_nasfund_table');
    }
};