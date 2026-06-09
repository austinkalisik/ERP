<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sla_contracts', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('client_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('service_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->unsignedInteger('response_minutes')->default(60);
            $table->unsignedInteger('resolution_minutes')->default(1440);
            $table->string('status')->default('active');
            $table->date('starts_at')->nullable();
            $table->date('ends_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sla_contracts');
    }
};
