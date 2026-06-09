<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_parts', function (Blueprint $table) {
            $table->id();
            $table->string('part_number')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category')->nullable();    // Engine Parts, Hydraulic Parts, etc.
            $table->unsignedInteger('quantity')->default(0);
            $table->unsignedInteger('reorder_level')->default(5);
            $table->decimal('unit_cost', 15, 2);
            $table->string('supplier')->nullable();
            $table->string('status')->default('In Stock'); // In Stock, Low Stock, Out of Stock, On Order
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_parts');
    }
};