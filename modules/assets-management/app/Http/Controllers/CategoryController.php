<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max(5, min((int) $request->integer('per_page', 10), 50));

        $query = Category::withCount('items')->latest();

        if ($request->filled('search')) {
            $search = trim((string) $request->search);

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('default_useful_life_years', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate($perPage)->withQueryString());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:categories,name'],
            'description' => ['nullable', 'string', 'max:1000'],
            'default_useful_life_years' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $category = Category::create($validated);

        return response()->json($category, 201);
    }

    public function show(Category $category)
    {
        return response()->json($category);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:categories,name,'.$category->id],
            'description' => ['nullable', 'string', 'max:1000'],
            'default_useful_life_years' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $category->update($validated);

        return response()->json($category->fresh());
    }

    public function destroy(Category $category)
    {
        if ($category->items()->exists()) {
            return response()->json(['message' => 'Cannot delete category with linked items.'], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted successfully']);
    }
}
