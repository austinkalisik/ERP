<?php

namespace App\Models\MOMS;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Fleet extends Model
{
    use Auditable;

    protected $fillable = [
        'fleet_number',
        'asset_number',
        'fleet_type',
        'make_brand',
        'model',
        'registration_number',
        'year_of_manufacture',
        'vin',
        'color',
        'purchase_price',
        'date_of_acquisition',
        'description',
        'status',
        'stickers',
    ];

    protected $casts = [
        'date_of_acquisition' => 'date',
        'purchase_price'      => 'decimal:2',
        'year_of_manufacture' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (Fleet $fleet) {
            // Auto-generate fleet_number: FL-YYYY-XXXX
            if (empty($fleet->fleet_number)) {
                $year  = date('Y');
                $count = self::whereYear('created_at', $year)->count() + 1;
                $fleet->fleet_number = 'FL-' . $year . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
            }

            // Auto-generate asset_number: AST-XXXXXX
            if (empty($fleet->asset_number)) {
                $count = self::count() + 1;
                $fleet->asset_number = 'AST-' . str_pad($count, 6, '0', STR_PAD_LEFT);
            }
        });
    }
}