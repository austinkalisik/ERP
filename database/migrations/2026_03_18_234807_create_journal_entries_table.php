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
    Schema::create('journal_entries', function (Blueprint $table) {
    $table->id();
    $table->string('reference_no'); // invoice_number
    $table->foreignId('supplier_id')->nullable()->constrained('suppliers');
    $table->date('entry_date');
    $table->text('description')->nullable();
    $table->foreignId('created_by')->constrained('users');
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('journal_entries');
    }
};
