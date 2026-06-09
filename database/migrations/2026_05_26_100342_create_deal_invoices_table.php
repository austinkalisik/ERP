<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deal_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deal_id')->constrained('deals')->cascadeOnDelete();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('invoice_number');
            $table->decimal('amount', 14, 2);
            $table->string('currency', 10)->default('PGK');
            $table->enum('status', ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'])->default('Draft');
            $table->date('issue_date');
            $table->date('due_date')->nullable();
            $table->date('paid_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deal_invoices');
    }
};