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
    Schema::create('general_ledger', function (Blueprint $table) {
            $table->id('gl_entry_id');   // unique GL row ID
            $table->unsignedBigInteger('gl_id'); // links to gl_accounts
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers');
            $table->date('entry_date');  // date of the transaction
            $table->string('reference_type'); // e.g., 'Invoice', 'Payment'
            $table->unsignedBigInteger('reference_id'); // invoice_id, payment_id, etc.
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->text('description')->nullable(); // memo
            $table->timestamps();

            $table->foreign('gl_id')->references('id')->on('gl_accounts');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('general_ledger');
    }
};
