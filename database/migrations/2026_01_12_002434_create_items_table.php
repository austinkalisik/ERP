<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();

            /* ============================
               Classification
            ============================ */
            $table->string('item_type')->default('Inventory Item');
            $table->string('status')->default('Active');
            $table->string('location')->default('Main Warehouse');

            /* ============================
               Basic Information
            ============================ */
            $table->string('name');
            $table->string('sku')->unique();
            $table->string('barcode')->nullable();
            $table->string('category');
            $table->string('brand')->nullable();
            $table->string('unit');

            /* ============================
               Supplier & Procurement
            ============================ */
            $table->foreignId('supplier_id')
                  ->nullable()
                  ->constrained('suppliers')
                  ->nullOnDelete();

            $table->integer('lead_time')->nullable()->comment('Lead time in days');
            $table->integer('preferred_purchase_qty')->nullable();

            /* ============================
               Pricing
            ============================ */
            $table->decimal('cost_price', 12, 2)->default(0);
            $table->decimal('selling_price', 12, 2)->default(0);
            $table->string('valuation_method')->default('FIFO');

            /* ============================
               Stock Control (AUTO-MANAGED)
            ============================ */
            $table->integer('current_stock')->default(0);
            $table->integer('minimum_stock')->default(0);
            $table->integer('maximum_stock')->default(0);
            $table->integer('reorder_quantity')->default(0);

            /* ============================
               Additional Information
            ============================ */
            $table->text('notes')->nullable();

            $table->timestamps();

            /* ============================
               Indexes
            ============================ */
            $table->index('sku');
            $table->index('category');
            $table->index('status');
            $table->index('current_stock');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
