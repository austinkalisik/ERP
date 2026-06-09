<?php

namespace App\Models\AIMS;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JournalEntryLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'journal_entry_id',
        'gl_account_id',
        'debit',
        'credit',
        'remarks',
    ];

    protected $casts = [
        'debit' => 'decimal:2',
        'credit' => 'decimal:2',
    ];

    /**
     * The parent journal entry
     */
    public function journalEntry()
    {
        return $this->belongsTo(JournalEntry::class);
    }

    /**
     * Related GL account
     */
    public function glAccount()
    {
        return $this->belongsTo(GlAccount::class);
    }
}
