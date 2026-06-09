<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('ticket_number')->unique();
            $table->string('title');
            $table->text('description');
            $table->foreignUuid('client_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUuid('service_id')->nullable()->constrained()->nullOnDelete();
            $table->string('requester_name');
            $table->string('requester_email');
            $table->string('assignee_name')->nullable();
            $table->string('team')->nullable();
            $table->string('department')->nullable();
            $table->string('category')->default('General');
            $table->string('priority')->default('medium');
            $table->string('status')->default('open');
            $table->date('due_date')->nullable();
            $table->timestamp('reported_at')->nullable();
            $table->timestamp('due_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->unsignedInteger('sla_minutes')->default(1440);
            $table->json('internal_notes')->nullable();
            $table->timestamps();

            $table->index(['status', 'priority']);
            $table->index('due_date');
            $table->index('due_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
