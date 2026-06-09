<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('company_name');
            $table->string('contact_name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('industry')->nullable();
            $table->string('status')->default('lead')->index();
            $table->string('website')->nullable();
            $table->text('address')->nullable();
            $table->text('notes')->nullable();
            $table->date('next_follow_up_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
