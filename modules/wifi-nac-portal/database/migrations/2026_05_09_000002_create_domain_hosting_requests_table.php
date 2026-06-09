<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('domain_hosting_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('domain_name');
            $table->string('service_type')->default('domain_hosting')->index();
            $table->string('plan')->default('business');
            $table->string('status')->default('new')->index();
            $table->date('requested_start_date')->nullable();
            $table->date('renewal_date')->nullable();
            $table->decimal('quoted_amount', 10, 2)->nullable();
            $table->text('requirements')->nullable();
            $table->text('internal_notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('domain_hosting_requests');
    }
};
