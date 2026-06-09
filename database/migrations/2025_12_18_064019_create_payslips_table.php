<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payslips', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')
                ->constrained('employees')
                ->onDelete('cascade');

            $table->foreignId('payroll_id')
                ->constrained('payrolls')
                ->onDelete('cascade');

            $table->string('period');
            $table->decimal('net_pay', 10, 2);
            $table->string('pdf_path')->nullable();
            $table->timestamp('generated_at');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payslips');
    }
};
