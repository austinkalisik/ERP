<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Table: crm_renewal_reminders
     *
     * Tracks which reminders have already been sent so the daily
     * scheduler never sends duplicates.
     *
     * Each row = one reminder sent for one subscription at one threshold.
     * If a row exists for (subscription_id, days_before=30), the 30-day
     * reminder will not fire again for that subscription cycle.
     * Rows are pruned when a subscription is renewed (expiry_date extends).
     */
    public function up(): void
    {
        Schema::create('crm_renewal_reminders', function (Blueprint $table) {
            $table->id();

            $table->foreignId('subscription_id')
                ->constrained('crm_subscriptions')
                ->cascadeOnDelete();

            // Which threshold triggered this: 30, 14, or 7
            $table->unsignedTinyInteger('days_before');

            // The expiry_date that was current when this was sent.
            // Used to detect when a subscription has been renewed
            // (new expiry_date differs → old reminder rows are stale).
            $table->date('expiry_date_at_send');

            // Delivery channel: email | notification | both
            $table->string('channel', 20)->default('both');

            // Whether each channel succeeded
            $table->boolean('email_sent')->default(false);
            $table->boolean('notification_sent')->default(false);

            $table->timestamps();

            // Unique: one reminder per subscription + threshold + expiry cycle
            $table->unique(
                ['subscription_id', 'days_before', 'expiry_date_at_send'],
                'crm_reminders_unique'
            );

            $table->index('subscription_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_renewal_reminders');
    }
};