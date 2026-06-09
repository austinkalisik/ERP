<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PersonalAccessToken extends Model
{
    protected $fillable = ['user_id', 'name', 'token', 'last_used_at'];
    protected $hidden = ['token'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
