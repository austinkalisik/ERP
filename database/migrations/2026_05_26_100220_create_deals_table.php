<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('crm_clients')->cascadeOnDelete();
            $table->foreignId('service_id')->nullable()->constrained('crm_services')->nullOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();

            $table->string('title');
            $table->string('category')->nullable();
            $table->enum('priority', ['Low', 'Medium', 'High'])->default('Medium');
            $table->enum('stage', [
                'Lead',
                'Qualified',
                'Proposal',
                'Negotiation',
                'Closed Won',
                'Closed Lost',
            ])->default('Lead');

            $table->decimal('value', 14, 2)->nullable();
            $table->string('currency', 10)->default('PGK');
            $table->date('expected_close_date')->nullable();
            $table->date('actual_close_date')->nullable();
            $table->text('description')->nullable();
            $table->text('notes')->nullable();
            $table->string('project_status')->nullable(); // Active, On Hold, Completed, Cancelled
            $table->timestamps();

            $table->index('client_id');
            $table->index('stage');
            $table->index('priority');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deals');
    }
};