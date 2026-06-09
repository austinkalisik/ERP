<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_service_interruptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')
                  ->constrained('crm_subscriptions')
                  ->onDelete('cascade');
            $table->date('from_date');
            $table->date('to_date');
            $table->integer('credit_days');
            $table->string('reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_service_interruptions');
    }
};