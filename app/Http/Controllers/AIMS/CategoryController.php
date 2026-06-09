<?php

namespace App\Http\Controllers\AIMS;

use App\Http\Controllers\Controller;
use App\Models\AIMS\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(Category::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'        => 'required|string|max:100|unique:aims_categories,name',
            'description' => 'nullable|string|max:255',
        ]);

        $category = Category::create($request->only('name', 'description'));
        return response()->json($category, 201);
    }

    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        $request->validate([
            'name'        => 'required|string|max:100|unique:aims_categories,name,' . $id,
            'description' => 'nullable|string|max:255',
        ]);

        $category->update($request->only('name', 'description'));
        return response()->json($category);
    }

    public function destroy($id)
    {
        Category::findOrFail($id)->delete();
        return response()->json(['message' => 'Category deleted successfully']);
    }
}