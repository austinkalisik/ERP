<?php

namespace App\Models\AIMS;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Warehouse extends Model
{
    use Auditable;

    protected $table    = 'aims_warehouses';
    protected $fillable = ['name', 'location', 'description'];
}