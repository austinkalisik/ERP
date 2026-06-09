<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->string('biometric_id');
            $table->string('application_type');
            $table->string('leave_type')->nullable();
            $table->string('leave_duration')->default('Full Day');
            $table->string('half_day_period')->nullable();
            $table->string('overtime_type')->nullable();
            $table->string('status')->default('Pending Supervisor');
            $table->string('created_by_role')->default('employee');
            $table->date('date_from');
            $table->date('date_to');
            $table->time('time_from')->nullable();
            $table->time('time_to')->nullable();
            $table->text('purpose');
            $table->timestamps();

            $table->foreign('biometric_id')
                  ->references('biometric_id')
                  ->on('employees')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};