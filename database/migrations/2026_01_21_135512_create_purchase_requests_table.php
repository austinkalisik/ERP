<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('purchase_requests', function (Blueprint $table) {
    $table->id();

    $table->string('pr_number')->unique();
    $table->date('request_date');
    $table->text('notes')->nullable();

    $table->enum('status', ['Pending', 'Approved', 'Rejected'])
          ->default('Pending');

    $table->foreignId('requested_by')->nullable()->constrained('users');
    $table->foreignId('approved_by')->nullable()->constrained('users');
    $table->timestamp('approved_at')->nullable();

    $table->timestamps();
});

    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_requests');
    }
};
