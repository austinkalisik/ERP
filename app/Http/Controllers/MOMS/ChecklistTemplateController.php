<?php

namespace App\Http\Controllers\MOMS;

use App\Http\Controllers\Controller;
use App\Models\MOMS\ChecklistTemplate;
use Illuminate\Http\Request;

class ChecklistTemplateController extends Controller
{
    /**
     * GET /api/moms/checklist-templates
     * Optional ?category=Excavator to filter
     * Optional ?all=1 to include inactive (admin use)
     */
    public function index(Request $request)
    {
        $query = ChecklistTemplate::query();

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if (!$request->boolean('all')) {
            $query->where('is_active', true);
        }

        $items = $query->orderBy('category')
                       ->orderBy('sort_order')
                       ->orderBy('item_number')
                       ->get();

        // Group by category for convenience
        if ($request->boolean('grouped')) {
            return response()->json($items->groupBy('category'));
        }

        return response()->json($items);
    }

    /**
     * GET /api/moms/checklist-templates/by-category/{category}
     * Used by StartShift when a machine is selected
     */
    public function byCategory(string $category)
    {
        $items = ChecklistTemplate::forCategory($category);

        return response()->json([
            'category' => $category,
            'items'    => $items,
        ]);
    }

    /**
     * GET /api/moms/checklist-templates/categories
     * Returns list of supported categories
     */
    public function categories()
    {
        return response()->json(ChecklistTemplate::categories());
    }

    /**
     * POST /api/moms/checklist-templates
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category'    => 'required|string|in:' . implode(',', ChecklistTemplate::categories()),
            'item_number' => 'required|integer|min:1',
            'item_text'   => 'required|string|max:500',
            'is_active'   => 'boolean',
            'sort_order'  => 'integer|min:0',
        ]);

        // Default sort_order to item_number if not provided
        if (!isset($validated['sort_order'])) {
            $validated['sort_order'] = $validated['item_number'];
        }

        $item = ChecklistTemplate::create($validated);

        return response()->json([
            'message' => 'Checklist item created successfully',
            'data'    => $item,
        ], 201);
    }

    /**
     * PUT /api/moms/checklist-templates/{id}
     */
    public function update(Request $request, int $id)
    {
        $item = ChecklistTemplate::findOrFail($id);

        $validated = $request->validate([
            'category'    => 'sometimes|string|in:' . implode(',', ChecklistTemplate::categories()),
            'item_number' => 'sometimes|integer|min:1',
            'item_text'   => 'sometimes|string|max:500',
            'is_active'   => 'sometimes|boolean',
            'sort_order'  => 'sometimes|integer|min:0',
        ]);

        $item->update($validated);

        return response()->json([
            'message' => 'Checklist item updated successfully',
            'data'    => $item,
        ]);
    }

    /**
     * DELETE /api/moms/checklist-templates/{id}
     */
    public function destroy(int $id)
    {
        $item = ChecklistTemplate::findOrFail($id);
        $item->delete();

        return response()->json(['message' => 'Checklist item deleted successfully']);
    }

    /**
     * POST /api/moms/checklist-templates/bulk
     * Replace all items for a category in one call (used by Settings UI)
     */
    public function bulk(Request $request)
    {
        $request->validate([
            'category' => 'required|string|in:' . implode(',', ChecklistTemplate::categories()),
            'items'    => 'required|array|min:1',
            'items.*.item_number' => 'required|integer|min:1',
            'items.*.item_text'   => 'required|string|max:500',
            'items.*.is_active'   => 'boolean',
        ]);

        $category = $request->category;

        // Delete all existing items for this category
        ChecklistTemplate::where('category', $category)->delete();

        // Re-insert
        $created = [];
        foreach ($request->items as $i => $item) {
            $created[] = ChecklistTemplate::create([
                'category'    => $category,
                'item_number' => $item['item_number'],
                'item_text'   => $item['item_text'],
                'is_active'   => $item['is_active'] ?? true,
                'sort_order'  => $item['item_number'],
            ]);
        }

        $count = count($created);

        return response()->json([
            'message' => "Checklist for {$category} updated ({$count} items)",
            'data'    => $created,
        ]);
    }
}