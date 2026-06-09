<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('request_orders', function (Blueprint $table) {
            $table->id();

            /*
            |----------------------------------------------------------------------
            | LINK TO PURCHASE REQUEST (ENTERPRISE FLOW)
            |----------------------------------------------------------------------
            | Nullable: PO can be generated from PR or created manually.
            */
            $table->foreignId('purchase_request_id')
                  ->nullable()
                  ->constrained('purchase_requests')
                  ->nullOnDelete();

            /*
            |----------------------------------------------------------------------
            | BASIC PO INFO
            |----------------------------------------------------------------------
            */
            $table->string('po_number')->unique();

            $table->foreignId('supplier_id')
                  ->constrained('suppliers')
                  ->cascadeOnDelete();

            $table->date('order_date');

            /*
            |----------------------------------------------------------------------
            | STATUS FLOW
            |----------------------------------------------------------------------
            | pending → approved → received → cancelled
            */
            $table->enum('status', [
                'pending',
                'approved',
                'received',
                'cancelled',
            ])->default('pending');

            /*
            |----------------------------------------------------------------------
            | FINANCIAL — LOCAL CURRENCY
            |----------------------------------------------------------------------
            */
            $table->decimal('total_amount', 14, 2)->default(0);

            /*
            |----------------------------------------------------------------------
            | FINANCIAL — FOREIGN CURRENCY (OVERSEAS ORDERS)
            |----------------------------------------------------------------------
            | All nullable so existing local orders are completely unaffected.
            |
            | foreign_currency  — ISO 4217 code of the invoice currency, e.g. "AUD"
            | exchange_rate     — rate at time of receipt: 1 foreign = X local (PGK)
            | foreign_amount    — invoice total in the foreign currency
            | local_amount      — foreign_amount × exchange_rate → PGK equivalent
            | currency_note     — free-text note, e.g. "Rate sourced from ANZ bank"
            */
            $table->string('foreign_currency', 10)->nullable();
            $table->decimal('exchange_rate',   12, 6)->nullable();
            $table->decimal('foreign_amount',  14, 2)->nullable();
            $table->decimal('local_amount',    14, 2)->nullable();
            $table->string('currency_note')->nullable();

            /*
            |----------------------------------------------------------------------
            | RECEIVE META
            |----------------------------------------------------------------------
            */
            $table->text('receive_notes')->nullable();
            $table->foreignId('received_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->timestamp('received_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('request_orders');
    }
};