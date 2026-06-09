<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employment_information', function (Blueprint $table) {
            $table->id();

            // FK to employees
            $table->foreignId('employee_id')
                ->constrained('employees')
                ->onDelete('cascade');

            // New department relationship (FK)
            $table->foreignId('department_id')
                ->nullable()
                ->constrained('departments')
                ->nullOnDelete();

            // Other fields
            $table->string('position')->nullable();
            $table->string('department_head')->nullable();
            $table->string('supervisor')->nullable();
            $table->string('job_location')->nullable();

            $table->string('employee_type');        
            $table->string('employment_status');    

           $table->foreignId('employment_classification')
      ->nullable()
      ->constrained('employment_classifications')
      ->nullOnDelete();


            $table->string('company_email')->nullable();
            $table->decimal('rate', 10, 2)->nullable();
            $table->string('rate_type')->nullable();

            $table->date('date_started')->nullable();
            $table->date('date_ended')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employment_information');
    }
};
