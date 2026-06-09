<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_advances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');

            $table->decimal('amount', 10, 2);                      // Requested amount (max 4,000)
            $table->decimal('interest_rate', 5, 2)->default(0);    // Interest % e.g. 5.00 = 5%
            $table->decimal('total_amount', 10, 2);                // amount + interest
            $table->decimal('installment_amount', 10, 2);          // Deducted per payroll run
            $table->decimal('total_deducted', 10, 2)->default(0);  // Running total already deducted
            $table->decimal('remaining_balance', 10, 2);           // total_amount - total_deducted

            $table->date('start_date');                            // First payroll to deduct from
            $table->date('end_date')->nullable();                  // Auto-calculated based on installments
            $table->string('purpose')->nullable();                 // Reason for advance
            $table->string('status')->default('Pending');          // Pending / Approved / Rejected / Fully Paid

            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_advances');
    }
};