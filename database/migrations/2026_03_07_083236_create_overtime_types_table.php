<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('overtime_types', function (Blueprint $table) {
            $table->id();
            $table->string('overtime_type');          // e.g. "Regular OT"
            $table->string('overtime_code');          // e.g. "REGOT"
            $table->decimal('multiplier', 4, 2);      // e.g. 1.50
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('overtime_types');
    }
};