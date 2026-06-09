<?php

namespace App\Models\AIMS;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Unit extends Model
{
    use Auditable;

    protected $table    = 'aims_units';
    protected $fillable = ['name', 'abbreviation'];
}