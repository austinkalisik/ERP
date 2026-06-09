<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('system_notifications', function (Blueprint $table) {
            $table->string('priority', 20)->default('normal')->after('type');
            $table->json('data')->nullable()->after('source_id');

            $table->index(['user_id', 'priority', 'read_at']);
            $table->index(['user_id', 'type', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::table('system_notifications', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'priority', 'read_at']);
            $table->dropIndex(['user_id', 'type', 'read_at']);
            $table->dropColumn(['priority', 'data']);
        });
    }
};
