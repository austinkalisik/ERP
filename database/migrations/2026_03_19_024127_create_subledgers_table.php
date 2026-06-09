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
       Schema::create('subledgers', function (Blueprint $table) {
            $table->id();
            $table->string('subledger_number')->unique();
            $table->morphs('transactionable'); // creates transactionable_id & transactionable_type
            $table->date('entry_date');

            $table->decimal('subtotal_amount', 15, 2); // sum of line items before tax/discount
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2); // subtotal + tax - discount

            $table->enum('status', ['pending','approved','cancelled','posted'])->default('pending');
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers'); 
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subledgers');
    }
};
