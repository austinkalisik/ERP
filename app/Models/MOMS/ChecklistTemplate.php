<?php

namespace App\Models\MOMS;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class ChecklistTemplate extends Model
{
    use Auditable;

    protected $fillable = [
        'category',
        'item_number',
        'item_text',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active'   => 'boolean',
        'item_number' => 'integer',
        'sort_order'  => 'integer',
    ];

    /**
     * Get all active items for a given category, ordered by sort_order then item_number.
     */
    public static function forCategory(string $category)
    {
        return static::where('category', $category)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('item_number')
            ->get();
    }

    /**
     * All supported machine categories.
     */
    public static function categories(): array
    {
        return [
            'Excavator',
            'Bulldozer',
            'Dozer',
            'OHT Truck',
            'Dump Truck',
            'Light Vehicle',
            'Loader',
            'Grader',
        ];
    }
}