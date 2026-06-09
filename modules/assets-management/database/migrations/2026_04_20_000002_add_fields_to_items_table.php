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

        if (! Schema::hasColumn('items', 'brand')) {
            Schema::table('items', function (Blueprint $table) {
                $table->string('brand')->nullable()->after('name');
            });
        }

        if (! Schema::hasColumn('items', 'description')) {
            Schema::table('items', function (Blueprint $table) {
                $table->text('description')->nullable()->after('brand');
            });
        }

        if (! Schema::hasColumn('items', 'reorder_level')) {
            Schema::table('items', function (Blueprint $table) {
                $table->unsignedInteger('reorder_level')->default(5)->after('quantity');
            });
        }

        if (! Schema::hasColumn('items', 'unit_cost')) {
            Schema::table('items', function (Blueprint $table) {
                $table->decimal('unit_cost', 12, 2)->nullable()->after('reorder_level');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('items')) {
            return;
        }

        if (Schema::hasColumn('items', 'unit_cost')) {
            Schema::table('items', function (Blueprint $table) {
                $table->dropColumn('unit_cost');
            });
        }

        if (Schema::hasColumn('items', 'reorder_level')) {
            Schema::table('items', function (Blueprint $table) {
                $table->dropColumn('reorder_level');
            });
        }

        if (Schema::hasColumn('items', 'description')) {
            Schema::table('items', function (Blueprint $table) {
                $table->dropColumn('description');
            });
        }

        if (Schema::hasColumn('items', 'brand')) {
            Schema::table('items', function (Blueprint $table) {
                $table->dropColumn('brand');
            });
        }
    }
};
