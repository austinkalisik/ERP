<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Stocktake Sessions ────────────────────────────────────────────────
        Schema::create('stocktake_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->enum('type', ['full', 'cyclic']);
            $table->string('location')->nullable();
            $table->string('category')->nullable();
            $table->enum('status', ['draft', 'in_progress', 'completed', 'cancelled'])
                  ->default('draft');
            $table->date('count_date');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // ── Stocktake Lines ───────────────────────────────────────────────────
        Schema::create('stocktake_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stocktake_session_id')
                  ->constrained('stocktake_sessions')
                  ->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items');
            $table->decimal('system_qty',  12, 2)->default(0);
            $table->decimal('counted_qty', 12, 2)->nullable();
            // variance is computed by PHP accessor, not a DB virtual column
            $table->string('variance_reason')->nullable();
            $table->enum('status', ['pending', 'counted', 'approved', 'adjusted'])
                  ->default('pending');
            $table->foreignId('counted_by')->nullable()->constrained('users');
            $table->timestamp('counted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stocktake_lines');
        Schema::dropIfExists('stocktake_sessions');
    }
};