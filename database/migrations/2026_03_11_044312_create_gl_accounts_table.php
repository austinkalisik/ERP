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
        Schema::create('gl_accounts', function (Blueprint $table) {
            $table->id(); // Primary Key
            $table->string('gl_code', 20)->unique(); // GL Code
            $table->string('gl_name', 150); // GL Name
            $table->string('account_type', 50); // Asset, Liability, Equity, Revenue, Expense
            $table->unsignedBigInteger('parent_gl_id')->nullable(); // Parent account
            $table->integer('level_no')->default(1); // Hierarchy level
            $table->boolean('is_postable')->default(true); // Postable flag
            $table->string('currency_code', 10)->nullable(); // Default currency
            $table->string('status', 20)->default('ACTIVE'); // Status
            $table->timestamps(); // created_at & updated_at
            $table->unsignedBigInteger('created_by')->nullable(); // User who created the record

            // Foreign Key for parent account (self-reference)
            $table->foreign('parent_gl_id')
                  ->references('id')
                  ->on('gl_accounts')
                  ->onDelete('set null')
                  ->onUpdate('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gl_accounts');
    }
};
