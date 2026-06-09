<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('items')) {
            return;
        }

        Schema::table('items', function (Blueprint $table) {
            if (! Schema::hasColumn('items', 'is_depreciable')) {
                $table->boolean('is_depreciable')->default(false)->after('unit_cost');
            }

            if (! Schema::hasColumn('items', 'depreciation_method')) {
                $table->string('depreciation_method')->nullable()->after('is_depreciable');
            }

            if (! Schema::hasColumn('items', 'useful_life_years')) {
                $table->unsignedInteger('useful_life_years')->nullable()->after('depreciation_method');
            }

            if (! Schema::hasColumn('items', 'salvage_value')) {
                $table->decimal('salvage_value', 12, 2)->nullable()->after('useful_life_years');
            }

            if (! Schema::hasColumn('items', 'depreciation_start_date')) {
                $table->date('depreciation_start_date')->nullable()->after('salvage_value');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('items')) {
            return;
        }

        Schema::table('items', function (Blueprint $table) {
            $columns = array_filter([
                Schema::hasColumn('items', 'depreciation_start_date') ? 'depreciation_start_date' : null,
                Schema::hasColumn('items', 'salvage_value') ? 'salvage_value' : null,
                Schema::hasColumn('items', 'useful_life_years') ? 'useful_life_years' : null,
                Schema::hasColumn('items', 'depreciation_method') ? 'depreciation_method' : null,
                Schema::hasColumn('items', 'is_depreciable') ? 'is_depreciable' : null,
            ]);

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
