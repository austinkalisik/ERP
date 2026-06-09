<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_statuses', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('status')->default('operational');
            $table->string('region')->default('Port Moresby');
            $table->timestamp('checked_at')->nullable();
            $table->text('message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_statuses');
    }
};
