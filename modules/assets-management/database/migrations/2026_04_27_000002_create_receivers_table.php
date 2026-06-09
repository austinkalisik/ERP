<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('receivers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained('departments')->cascadeOnDelete();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['department_id', 'name']);
        });

        Schema::table('assignments', function (Blueprint $table) {
            $table->foreignId('receiver_id')
                ->nullable()
                ->after('user_id')
                ->constrained('receivers')
                ->nullOnDelete();
        });

        DB::table('assignments')
            ->leftJoin('users', 'assignments.user_id', '=', 'users.id')
            ->whereNotNull('assignments.department_id')
            ->select([
                'assignments.id',
                'assignments.department_id',
                'assignments.receiver_name',
                'users.name as user_name',
            ])
            ->orderBy('assignments.id')
            ->get()
            ->each(function ($assignment) {
                $receiverName = trim((string) ($assignment->receiver_name ?: $assignment->user_name));

                if ($receiverName === '') {
                    return;
                }

                $receiver = DB::table('receivers')
                    ->where('department_id', $assignment->department_id)
                    ->where('name', $receiverName)
                    ->first();

                if (! $receiver) {
                    $receiverId = DB::table('receivers')->insertGetId([
                        'department_id' => $assignment->department_id,
                        'name' => $receiverName,
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $receiverId = $receiver->id;
                }

                DB::table('assignments')
                    ->where('id', $assignment->id)
                    ->update([
                        'receiver_id' => $receiverId,
                        'receiver_name' => $receiverName,
                    ]);
            });
    }

    public function down(): void
    {
        Schema::table('assignments', function (Blueprint $table) {
            $table->dropForeign(['receiver_id']);
            $table->dropColumn('receiver_id');
        });

        Schema::dropIfExists('receivers');
    }
};
