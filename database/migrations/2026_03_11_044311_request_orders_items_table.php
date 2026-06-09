<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('request_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items');
            $table->integer('quantity');
            $table->decimal('unit_cost', 12, 2);
            $table->decimal('subtotal', 12, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('request_order_items');
    }
};