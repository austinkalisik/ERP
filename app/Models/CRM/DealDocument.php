<?php

namespace App\Models\CRM;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class DealDocument extends Model
{
    protected $table = 'deal_documents';

    protected $fillable = [
        'deal_id', 'uploaded_by', 'name', 'type',
        'file_path', 'file_name', 'mime_type', 'file_size', 'notes',
    ];

    public function deal()
    {
        return $this->belongsTo(Deal::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}