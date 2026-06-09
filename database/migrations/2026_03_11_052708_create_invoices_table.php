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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->string('po_number');
            $table->foreignId('request_order_id')->constrained();
            $table->date('invoice_date');
            $table->foreignId('payment_term_id')->nullable()->constrained('payment_terms');
            $table->date('due_date')->nullable();
            $table->foreignId('supplier_id')->constrained('suppliers');
            $table->decimal('subtotal_amount', 15, 2); // sum of line items before tax/discount
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2); // subtotal + tax - discount
            $table->enum('status', ['pending', 'approved','cancelled', 'paid', 'partially_paid','posted'])->default('pending');
            //$table->foreignId('currency_id')->constrained('currencies');
            //$table->foreignId('payment_term_id')->constrained('payment_terms');

            $table->text('remarks')->nullable(); // approver comments
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users');
            $table->string('attachment')->nullable(); // invoice file (PDF/image)


            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice');
    }


       /*
    |--------------------------------------------------------------------------
    | Helper Methods (Optional)
    |--------------------------------------------------------------------------
    */

    public function isPaid()
    {
        return $this->status === 'paid';
    }

    public function isPending()
    {
        return $this->status === 'pending';
    }

    public function isOverdue()
    {
        return $this->due_date && $this->due_date->isPast() && $this->status !== 'paid';
    }
};
