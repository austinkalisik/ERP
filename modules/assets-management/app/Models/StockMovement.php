<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMovement extends Model
{
    public const TYPE_IN = 'IN';

    public const TYPE_OUT = 'OUT';

    public const TYPE_ADJUSTMENT = 'ADJUSTMENT';

    public const TYPE_RETURN = 'RETURN';

    public const TYPE_TRANSFER = 'TRANSFER';

    public const TYPES = [
        self::TYPE_IN,
        self::TYPE_OUT,
        self::TYPE_ADJUSTMENT,
        self::TYPE_RETURN,
        self::TYPE_TRANSFER,
    ];

    protected $fillable = [
        'item_id',
        'type',
        'quantity',
        'reference_no',
        'supplier_id',
        'notes',
        'user_id',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = [
        'signed_quantity',
    ];

    protected $hidden = [
        'updated_at',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getSignedQuantityAttribute(): int
    {
        if ($this->type === self::TYPE_ADJUSTMENT) {
            return (int) $this->quantity;
        }

        if (in_array($this->type, [self::TYPE_OUT, self::TYPE_TRANSFER], true)) {
            return -abs((int) $this->quantity);
        }

        return abs((int) $this->quantity);
    }

    public function isInbound(): bool
    {
        return in_array($this->type, [self::TYPE_IN, self::TYPE_RETURN], true);
    }

    public function isOutbound(): bool
    {
        return in_array($this->type, [self::TYPE_OUT, self::TYPE_TRANSFER], true);
    }

    public function isAdjustment(): bool
    {
        return $this->type === self::TYPE_ADJUSTMENT;
    }
}
