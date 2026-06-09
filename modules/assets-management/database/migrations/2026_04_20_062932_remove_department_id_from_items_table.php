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

        if (Schema::hasColumn('items', 'department_id')) {
            Schema::table('items', function (Blueprint $table) {
                try {
                    $table->dropForeign(['department_id']);
                } catch (Throwable $e) {
                }

                $table->dropColumn('department_id');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('items')) {
            return;
        }

        if (! Schema::hasColumn('items', 'department_id')) {
            Schema::table('items', function (Blueprint $table) {
                $table->foreignId('department_id')->nullable()->after('category_id')->constrained('departments')->nullOnDelete();
            });
        }
    }
};
