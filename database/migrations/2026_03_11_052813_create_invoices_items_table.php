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
        Schema::create('invoice_items', function (Blueprint $table) {
         $table->id();
        $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
        $table->foreignId('request_order_item_id')->constrained('request_order_items')->cascadeOnDelete();
        $table->foreignId('gl_account_id')->constrained('gl_accounts')->cascadeOnDelete(); // link to GL chart of accounts
        $table->string('description')->nullable();
        $table->integer('quantity');
        $table->decimal('unit_price', 15, 2);
        $table->decimal('discount', 12, 2)->default(0);
        $table->decimal('tax', 12, 2)->default(0);
        $table->decimal('subtotal', 15, 2); // (quantity * unit_price) - discount + tax


        $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
    }
};
