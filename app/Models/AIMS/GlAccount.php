<?php

namespace App\Models\AIMS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GlAccount extends Model
{
    use HasFactory;

    protected $table = 'gl_accounts';
    protected $primaryKey = 'id';

    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'gl_code',
        'gl_name',
        'account_type',
        'parent_gl_id',
        'level_no',
        'is_postable',
        'currency_code',
        'status',
        'created_by'
    ];

    protected $casts = [
        'is_postable' => 'boolean',
    ];

    /**
     * Parent GL Account (Self Reference)
     */
    public function parent()
    {
        return $this->belongsTo(GlAccount::class, 'parent_gl_id', 'id');
    }

    /**
     * Child GL Accounts
     */
    public function children()
    {
        return $this->hasMany(GlAccount::class, 'parent_gl_id', 'id');
    }
}