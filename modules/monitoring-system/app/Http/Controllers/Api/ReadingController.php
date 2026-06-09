<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeviceReading;
use Illuminate\Http\Request;

class ReadingController extends Controller
{
    public function index(Request $request)
    {
        return DeviceReading::with('device:id,name,type')
            ->when($request->device_id, fn ($q, $id) => $q->where('device_id', $id))
            ->latest('recorded_at')->paginate(100);
    }
}
