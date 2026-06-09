<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
{
   Schema::create('system_settings', function (Blueprint $table) {
    $table->id();

    // Company
    $table->string('company_name')->nullable();
    $table->string('company_address')->nullable();
    $table->string('email')->nullable();
    $table->string('phone')->nullable();

    // System defaults
    $table->string('country')->default('Papua New Guinea');
    $table->string('timezone')->default('Pacific/Port_Moresby');
    $table->string('currency')->default('USD');
    $table->string('date_format')->default('MM/DD/YYYY');
    $table->string('language')->default('en');   
    $table->string('theme')->default('light');  

    $table->timestamps();
});
}

};
