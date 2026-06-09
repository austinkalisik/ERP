<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

class AssetLog extends Model
{
    public const ACTION_CREATED = 'created';

    public const ACTION_UPDATED = 'updated';

    public const ACTION_DELETED = 'deleted';

    public const ACTION_ASSIGNED = 'assigned';

    public const ACTION_RETURNED = 'returned';

    public const ACTION_STOCK_IN = 'stock_in';

    public const ACTION_STOCK_OUT = 'stock_out';

    public const ACTION_RETIRED = 'retired';

    protected $fillable = [
        'item_id',
        'user_id',
        'action',
        'notes',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public static function log(int $itemId, string $action, ?string $notes = null): void
    {
        $userId = Auth::id() ?? User::query()->value('id');

        if (! $userId) {
            return;
        }

        self::create([
            'item_id' => $itemId,
            'user_id' => $userId,
            'action' => $action,
            'notes' => $notes,
        ]);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
