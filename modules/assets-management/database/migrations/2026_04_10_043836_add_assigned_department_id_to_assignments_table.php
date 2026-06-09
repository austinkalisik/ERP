<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('assignments')) {
            return;
        }

        if (Schema::hasColumn('assignments', 'assigned_department_id')) {
            DB::table('assignments')
                ->whereNull('department_id')
                ->whereNotNull('assigned_department_id')
                ->update([
                    'department_id' => DB::raw('assigned_department_id'),
                ]);

            Schema::table('assignments', function (Blueprint $table) {
                try {
                    $table->dropForeign(['assigned_department_id']);
                } catch (Throwable $e) {
                }

                $table->dropColumn('assigned_department_id');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('assignments')) {
            return;
        }

        if (! Schema::hasColumn('assignments', 'assigned_department_id')) {
            Schema::table('assignments', function (Blueprint $table) {
                $table->unsignedBigInteger('assigned_department_id')->nullable()->after('user_id');
            });
        }
    }
};
