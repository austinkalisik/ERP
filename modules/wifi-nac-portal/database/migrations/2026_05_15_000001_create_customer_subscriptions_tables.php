<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('service_type')->index();
            $table->string('service_name')->nullable();
            $table->string('reference')->nullable();
            $table->string('status')->default('active')->index();
            $table->date('starts_at')->nullable();
            $table->date('expires_at')->nullable()->index();
            $table->string('renewal_cycle')->default('yearly');
            $table->decimal('amount', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('subscription_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_subscription_id')->constrained()->cascadeOnDelete();
            $table->date('paid_at')->nullable();
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('payment_reference')->nullable();
            $table->string('invoice_number')->nullable();
            $table->string('file_path')->nullable();
            $table->string('file_name')->nullable();
            $table->string('file_mime')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('subscription_credits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_subscription_id')->constrained()->cascadeOnDelete();
            $table->string('credit_type')->default('service_outage');
            $table->date('starts_at');
            $table->date('ends_at');
            $table->unsignedInteger('months')->default(0);
            $table->decimal('amount', 12, 2)->nullable();
            $table->date('applied_to_expires_at')->nullable();
            $table->text('reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_credits');
        Schema::dropIfExists('subscription_payments');
        Schema::dropIfExists('customer_subscriptions');
    }
};
