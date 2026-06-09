<?php
// ── App\Models\AIMS\StocktakeSession.php ──────────────────────────────────

namespace App\Models\AIMS;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class StocktakeSession extends Model
{
    use Auditable;

    protected $fillable = [
        'reference', 'type', 'location', 'category',
        'status', 'count_date', 'created_by', 'approved_by',
        'approved_at', 'notes',
    ];

    protected $casts = [
        'count_date'  => 'date',
        'approved_at' => 'datetime',
    ];

    // ── Relationships ────────────────────────────────────────────────────────

    public function lines()
    {
        return $this->hasMany(StocktakeLine::class, 'stocktake_session_id');
    }

    public function creator()
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(\App\Models\User::class, 'approved_by');
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Generate the next ST reference, e.g. ST-2026-0042 */
    public static function generateReference(): string
    {
        $year = now()->year;
        $last = static::whereYear('created_at', $year)
            ->orderByDesc('id')
            ->value('reference');

        $seq = $last ? ((int) substr($last, -4)) + 1 : 1;

        return 'ST-' . $year . '-' . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }

    /** Summary variance counts for the session */
    public function varianceSummary(): array
    {
        $lines = $this->lines()->whereNotNull('counted_qty')->get();

        return [
            'total'     => $lines->count(),
            'over'      => $lines->filter(fn($l) => $l->variance > 0)->count(),
            'under'     => $lines->filter(fn($l) => $l->variance < 0)->count(),
            'matched'   => $lines->filter(fn($l) => $l->variance == 0)->count(),
            'uncounted' => $this->lines()->whereNull('counted_qty')->count(),
        ];
    }
}