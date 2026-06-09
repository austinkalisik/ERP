<?php

namespace App\Models\AIMS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class GeneralLedger extends Model
{
     use HasFactory;

    // Specify the table name if it doesn't follow Laravel's naming convention
    protected $table = 'general_ledger';

    // Specify the primary key if it is not 'id'
    protected $primaryKey = 'gl_entry_id';

    // If your primary key is not an incrementing integer, adjust these
    public $incrementing = true;
    protected $keyType = 'int';

    // Allow mass assignment on these fields
    protected $fillable = [
        'gl_id',
        'supplier_id',
        'entry_date',
        'reference_type',
        'reference_id',
        'debit',
        'credit',
        'description',
    ];

    /**
     * Define relationship to GL Account
     */
    public function account()
    {
        return $this->belongsTo(GLAccount::class, 'gl_id', 'gl_id');
    }

      // Supplier relationship
    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
}
