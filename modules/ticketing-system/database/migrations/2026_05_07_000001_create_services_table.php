<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('category');
            $table->string('owner_team')->default('Service Desk');
            $table->unsignedInteger('default_sla_minutes')->default(1440);
            $table->string('status')->default('operational');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index(['status', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
