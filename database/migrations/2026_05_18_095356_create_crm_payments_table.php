<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')
                  ->constrained('crm_subscriptions')
                  ->onDelete('cascade');
            $table->decimal('amount', 15, 2);
            $table->date('payment_date');
            $table->date('period_from')->nullable();
            $table->date('period_to')->nullable();
            $table->string('notes')->nullable();
            $table->foreignId('recorded_by')
                  ->nullable()
                  ->constrained('users')
                  ->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_payments');
    }
};