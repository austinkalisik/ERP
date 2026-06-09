<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fleets', function (Blueprint $table) {
            $table->id();
            $table->string('fleet_number')->nullable();
            $table->string('asset_number')->nullable();
            $table->string('fleet_type');                         // Excavator, Dozer, etc.
            $table->string('make_brand');
            $table->string('model');
            $table->string('registration_number')->nullable();
            $table->unsignedSmallInteger('year_of_manufacture')->nullable();
            $table->string('vin')->nullable();
            $table->string('color')->nullable();
            $table->decimal('purchase_price', 15, 2)->nullable();
            $table->date('date_of_acquisition')->nullable();
            $table->text('description')->nullable();
            $table->string('status')->default('Active');          // Active, Inactive, Under Maintenance, Retired
            $table->string('stickers')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fleets');
    }
};