<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use App\Traits\Auditable;

class Attachment extends Model
{
    use Auditable;

    protected $fillable = [
        'attachable_type',
        'attachable_id',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
        'uploaded_by',
    ];

    protected $appends = ['url', 'size_formatted'];

    // ── Polymorphic parent ─────────────────────────────────────────────────
    public function attachable()
    {
        return $this->morphTo();
    }

    public function uploadedBy()
    {
        return $this->belongsTo(\App\Models\User::class, 'uploaded_by');
    }

    // ── Accessors ──────────────────────────────────────────────────────────
    public function getUrlAttribute(): string
    {
        return Storage::url($this->file_path);
    }

    public function getSizeFormattedAttribute(): string
    {
        $bytes = $this->file_size;
        if ($bytes >= 1048576) return round($bytes / 1048576, 2) . ' MB';
        if ($bytes >= 1024)    return round($bytes / 1024, 2)    . ' KB';
        return $bytes . ' B';
    }
}