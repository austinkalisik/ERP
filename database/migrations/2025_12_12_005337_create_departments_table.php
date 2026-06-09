<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('prefix')->nullable(); // For employee-number generation
            $table->unsignedBigInteger('department_head_id')->nullable(); // references employees.id
            $table->timestamps();

            $table->foreign('department_head_id')
                ->references('id')
                ->on('employees')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};
