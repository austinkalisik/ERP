<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            
            // Period Information
            $table->date('pay_period_start');
            $table->date('pay_period_end');
            $table->date('payment_date');
            $table->string('pay_type'); // Monthly, Semi-Monthly, Bi-Weekly, Weekly
            
            // Salary Information
            $table->decimal('base_salary', 10, 2)->default(0);
            
            // Hours & Attendance
            $table->decimal('total_hours', 8, 2)->default(0);
            $table->decimal('overtime_hours', 8, 2)->default(0);
            $table->integer('days_worked')->default(0); 
            $table->integer('days_absent')->default(0); 
            $table->integer('days_late')->default(0);
            $table->decimal('leave_days', 8, 2)->default(0);
            
            // Pay Breakdown
            $table->decimal('gross_pay', 10, 2)->default(0);
            $table->decimal('overtime_pay', 10, 2)->default(0);
            $table->decimal('leave_pay', 10, 2)->default(0);
            $table->decimal('bonuses', 10, 2)->default(0); 
            
            // Deductions
            $table->decimal('deductions', 10, 2)->default(0);
            $table->decimal('tax', 10, 2)->default(0);
            $table->decimal('nasfund', 10, 2)->default(0);
            $table->decimal('other_deductions', 10, 2)->default(0);
            $table->decimal('late_deduction', 10, 2)->default(0);
            $table->decimal('lwop', 10, 2)->default(0);
            $table->decimal('cash_advance_deduction', 10, 2)->default(0); // ✅ added
            
            // Final Amount
            $table->decimal('net_pay', 10, 2)->default(0);
            
            // Status & Notes
            $table->enum('status', ['Pending', 'Approved', 'Paid', 'Rejected'])->default('Pending');
            $table->text('notes')->nullable(); 
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};