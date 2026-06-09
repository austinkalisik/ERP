<?php

namespace App\Http\Controllers\AIMS;

use App\Http\Controllers\Controller;
use App\Models\AIMS\Supplier;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index()
{
    return response()->json([
        'data' => Supplier::orderBy('name')->get()
    ]);
}

   public function store(Request $request)
{
    $request->validate([
        'name' => 'required|string|max:255',
    ]);

    return response()->json([
        'data' => Supplier::create($request->all())
    ], 201);
}
}
