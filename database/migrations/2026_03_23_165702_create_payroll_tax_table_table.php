<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_tax_table', function (Blueprint $table) {
            $table->id();
            $table->decimal('compensation_from', 12, 2);
            $table->decimal('compensation_to',   12, 2);
            $table->enum('tax_type', ['W/ Declaration', 'No Declaration', 'Non-Resident']);
            $table->unsignedTinyInteger('no_of_dependents')->default(0);
            $table->decimal('amount', 10, 2)->comment('Withholding tax amount for this bracket');
            $table->unsignedSmallInteger('year_applied');
            $table->timestamps();
            $table->unique(
                ['compensation_from', 'compensation_to', 'tax_type', 'no_of_dependents', 'year_applied'],
                'unique_tax_bracket'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_tax_table');
    }
};