<?php
// ── App\Models\AIMS\StocktakeLine.php ─────────────────────────────────────

namespace App\Models\AIMS;

use Illuminate\Database\Eloquent\Model;

class StocktakeLine extends Model
{
    protected $fillable = [
        'stocktake_session_id', 'item_id',
        'system_qty', 'counted_qty',
        'variance_reason', 'status',
        'counted_by', 'counted_at',
    ];

    protected $casts = [
        'system_qty'  => 'decimal:2',
        'counted_qty' => 'decimal:2',
        'counted_at'  => 'datetime',
    ];

    // virtual column is computed by MySQL; expose it for serialisation
    protected $appends = ['variance'];

    public function getVarianceAttribute(): ?float
    {
        if (is_null($this->counted_qty)) return null;
        return (float) $this->counted_qty - (float) $this->system_qty;
    }

    public function session()
    {
        return $this->belongsTo(StocktakeSession::class, 'stocktake_session_id');
    }

    public function item()
    {
        return $this->belongsTo(\App\Models\AIMS\Item::class);
    }

    public function counter()
    {
        return $this->belongsTo(\App\Models\User::class, 'counted_by');
    }
}