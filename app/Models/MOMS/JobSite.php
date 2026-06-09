<?php

namespace App\Models\MOMS;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class JobSite extends Model
{
    use Auditable;

    protected $fillable = [
        'name',
        'location',
        'code',
        'description',
        'status',
    ];

    /**
     * Relationship to Assignments
     */
    public function assignments()
    {
        return $this->hasMany(Assignment::class, 'job_site', 'name');
    }
}