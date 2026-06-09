<?php

namespace App\Models\HRMS;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\Auditable;

class EmployeeContribution extends Model
{
    use HasFactory, SoftDeletes;
    use Auditable;

    protected $table = 'employee_contributions';

    protected $fillable = [
        'employee_id',
        'year',
        'contribution_type',
        'value_type',
        'value',
        'notes',
    ];

    protected $casts = [
        'year'       => 'integer',
        'value'      => 'decimal:6',
        'deleted_at' => 'datetime',
    ];

    // ── Relationships ─────────────────────────────────────────────────────────

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    // ── Accessors ─────────────────────────────────────────────────────────────

    public function getDisplayValueAttribute(): string
    {
        if ($this->value_type === 'percentage') {
            return number_format((float) $this->value * 100, 2) . '%';
        }

        return number_format((float) $this->value, 2);
    }

    public function getFrontendValueAttribute(): float
    {
        if ($this->value_type === 'percentage') {
            return round((float) $this->value * 100, 4);
        }

        return (float) $this->value;
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeForYear($query, int $year)
    {
        return $query->where('year', $year);
    }

    public function scopeForType($query, string $type)
    {
        return $query->where('contribution_type', $type);
    }
}