<?php

use App\Models\Item;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('items')
            ->where('is_depreciable', false)
            ->update([
                'depreciation_method' => Item::DEPRECIATION_METHOD_NONE,
                'useful_life_years' => null,
                'salvage_value' => null,
                'depreciation_start_date' => null,
            ]);
    }

    public function down(): void
    {
        // No rollback needed; this migration normalizes invalid non-depreciable item data.
    }
};
