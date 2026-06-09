<?php

namespace App\Models\AIMS;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JournalEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference_no',
        'supplier_id',
        'entry_date',
        'description',
        'created_by',
    ];

    protected $casts = [
        'entry_date' => 'date',
    ];

   /**
     * Supplier
     */
 
  public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
   /**
     * Creator of the journal entry
     */

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Journal entry lines
     */
    public function lines()
    {
        return $this->hasMany(JournalEntryLine::class);
    }
}
