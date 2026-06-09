<?php

namespace App\Models\AIMS;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class Category extends Model
{
    use Auditable;

    protected $table    = 'aims_categories';
    protected $fillable = ['name', 'description'];
}