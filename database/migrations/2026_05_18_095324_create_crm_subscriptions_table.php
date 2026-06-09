<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')
                  ->constrained('crm_clients')
                  ->onDelete('cascade');
            $table->foreignId('service_id')
                  ->constrained('crm_services')
                  ->onDelete('restrict');
            $table->enum('billing_cycle', ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'])
                  ->default('Monthly');
            $table->decimal('amount', 15, 2);
            $table->date('start_date');
            $table->date('expiry_date');
            $table->enum('status', ['Active', 'Expiring', 'Expired', 'Suspended'])
                  ->default('Active');
            $table->integer('credit_days')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_subscriptions');
    }
};