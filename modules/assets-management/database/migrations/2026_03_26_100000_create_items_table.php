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
            $table->string('name');
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained('suppliers')->cascadeOnDelete();
            $table->string('asset_tag')->nullable()->unique();
            $table->string('serial_number')->nullable()->unique();
            $table->unsignedInteger('quantity')->default(1);
            $table->enum('status', ['available', 'maintenance', 'lost', 'retired'])->default('available');
            $table->string('location')->nullable();
            $table->date('purchase_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
