<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('items', 'unit_of_measurement')) {
            Schema::table('items', function (Blueprint $table) {
                $table->string('unit_of_measurement', 50)->default('unit')->after('quantity');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('items', 'unit_of_measurement')) {
            Schema::table('items', function (Blueprint $table) {
                $table->dropColumn('unit_of_measurement');
            });
        }
    }
};
