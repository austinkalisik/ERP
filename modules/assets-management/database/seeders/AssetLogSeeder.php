<?php

namespace Database\Seeders;

use App\Models\AssetLog;
use App\Models\Item;
use App\Models\User;
use Illuminate\Database\Seeder;

class AssetLogSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@nextgen.local')->first();

        foreach (Item::all() as $item) {
            AssetLog::firstOrCreate([
                'item_id' => $item->id,
                'user_id' => $admin?->id ?? 1,
                'action' => 'created',
            ]);
        }
    }
}
