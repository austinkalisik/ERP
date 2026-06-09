<?php

namespace App\Models\HRMS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\HRMS\Employee;
use App\Traits\Auditable;

class Deminimis extends Model
{
    use HasFactory;
    use Auditable;

    protected $table = 'deminimis';

    protected $fillable = [
        'employee_id',
        'type',
        'amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
