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

        Schema::table('assignments', function (Blueprint $table) {
            if (! Schema::hasColumn('assignments', 'receiver_name')) {
                $table->string('receiver_name')->nullable()->after('user_id');
            }

            if (! Schema::hasColumn('assignments', 'quantity')) {
                $table->unsignedInteger('quantity')->default(1)->after('department_id');
            }
        });

        if (Schema::hasColumn('assignments', 'quantity')) {
            DB::table('assignments')
                ->whereNull('quantity')
                ->update(['quantity' => 1]);
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('assignments')) {
            return;
        }

        Schema::table('assignments', function (Blueprint $table) {
            if (Schema::hasColumn('assignments', 'receiver_name')) {
                $table->dropColumn('receiver_name');
            }

            if (Schema::hasColumn('assignments', 'quantity')) {
                $table->dropColumn('quantity');
            }
        });
    }
};
