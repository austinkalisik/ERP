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
      Schema::create('subledger_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subledger_id')->constrained('subledgers')->cascadeOnDelete();
            // Polymorphic for any transaction item
            $table->morphs('transaction_itemable','txn_item_idx'); // transaction_itemable_id & transaction_itemable_type
            $table->integer('quantity');
            $table->decimal('unit_amount', 15, 2);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('tax', 12, 2)->default(0);
            $table->decimal('subtotal', 15, 2); // (quantity * unit_amount) - discount + tax
            $table->foreignId('gl_account_id')->constrained('gl_accounts'); // link to GL chart of accounts
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subledger_items');
    }
};
