<?php

namespace App\Models\MOMS;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class InventoryPart extends Model
{
    use Auditable;

    protected $table = 'inventory_parts';

    protected $fillable = [
        'part_number',
        'name',
        'description',
        'category',
        'quantity',
        'reorder_level',
        'unit_cost',
        'supplier',
        'status',
    ];

    protected $casts = [
        'quantity'      => 'integer',
        'reorder_level' => 'integer',
        'unit_cost'     => 'decimal:2',
    ];
}