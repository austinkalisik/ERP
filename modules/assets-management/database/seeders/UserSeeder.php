<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('users')->delete();

        $admin = [
            'name' => 'System Administrator',
            'email' => 'admin@nextgen.net',
            'role' => 'admin',
            'password' => Hash::make('password'),
        ];

        $attrs = $admin;
        if (! Schema::hasColumn('users', 'role')) {
            unset($attrs['role']);
        }

        User::create($attrs);
    }
}
