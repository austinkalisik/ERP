<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('categories') && ! Schema::hasColumn('categories', 'default_useful_life_years')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->unsignedInteger('default_useful_life_years')->nullable()->after('description');
            });
        }

        if (! Schema::hasTable('items')) {
            return;
        }

        Schema::table('items', function (Blueprint $table) {
            if (! Schema::hasColumn('items', 'retired_at')) {
                $table->timestamp('retired_at')->nullable()->after('status');
            }

            if (! Schema::hasColumn('items', 'disposal_value')) {
                $table->decimal('disposal_value', 12, 2)->nullable()->after('retired_at');
            }

            if (! Schema::hasColumn('items', 'disposal_reason')) {
                $table->string('disposal_reason', 1000)->nullable()->after('disposal_value');
            }
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('items')) {
            Schema::table('items', function (Blueprint $table) {
                $columns = array_filter([
                    Schema::hasColumn('items', 'disposal_reason') ? 'disposal_reason' : null,
                    Schema::hasColumn('items', 'disposal_value') ? 'disposal_value' : null,
                    Schema::hasColumn('items', 'retired_at') ? 'retired_at' : null,
                ]);

                if ($columns !== []) {
                    $table->dropColumn($columns);
                }
            });
        }

        if (Schema::hasTable('categories') && Schema::hasColumn('categories', 'default_useful_life_years')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->dropColumn('default_useful_life_years');
            });
        }
    }
};
