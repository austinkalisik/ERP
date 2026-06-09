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
      Schema::create('payments', function (Blueprint $table) {
        $table->id();
        $table->string('payment_number')->unique(); // unique payment reference
        $table->foreignId('supplier_id')->constrained('suppliers'); // which supplier is paid
        $table->date('payment_date');
        $table->decimal('amount', 15, 2); // total payment amount
        $table->enum('payment_method', ['bank_transfer', 'cash', 'cheque', 'other'])->default('bank_transfer');
        $table->text('remarks')->nullable(); // optional notes
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
