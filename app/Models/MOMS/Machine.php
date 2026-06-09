<?php

namespace App\Models\MOMS;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Machine extends Model
{
    use Auditable;

    protected $fillable = [
        'machine_id',
        'category',
        'make',
        'model',
        'engine_hours',
        'fuel_capacity',
        'status',
        'location',
        'last_maintenance',
        'next_maintenance',
    ];

    protected $casts = [
        'engine_hours'     => 'integer',
        'fuel_capacity'    => 'decimal:2',
        'last_maintenance' => 'date',
        'next_maintenance' => 'date',
    ];

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

    /**
     * Get the machine_id prefix for a given category.
     */
    public static function getCategoryPrefix(string $category): string
    {
        $prefixes = [
            'Excavator'     => 'EXC',
            'Bulldozer'     => 'BUL',
            'Dozer'         => 'DOZ',
            'OHT Truck'     => 'OHT',
            'Dump Truck'    => 'DMP',
            'Light Vehicle' => 'LV',
            'Loader'        => 'LOD',
            'Grader'        => 'GRD',
        ];

        return $prefixes[$category] ?? 'MCH';
    }
}