<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            
            // Who did it
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('user_name')->nullable();
            $table->string('user_role')->nullable();
            
            // What was affected (✅ FIXED: nullable)
            $table->string('model_type')->nullable();
            $table->unsignedBigInteger('model_id')->nullable();
            
            // What happened
            $table->enum('action', [
                'created',
                'updated',
                'deleted',
                'restored',
                'approved',
                'rejected',
                'fulfilled',
                'cancelled',
                'stock_in',
                'stock_out',
                'login',
                'logout',
                'other'
            ]);
            
            // Details
            $table->string('description')->nullable();
            $table->text('old_values')->nullable();
            $table->text('new_values')->nullable();
            $table->json('changes')->nullable();
            
            // Context
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('module')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index('user_id');
            $table->index('model_type');
            $table->index('model_id');
            $table->index('action');
            $table->index('module');
            $table->index('created_at');
            $table->index(['model_type', 'model_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};