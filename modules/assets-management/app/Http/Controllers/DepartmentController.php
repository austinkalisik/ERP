<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = max(5, min((int) $request->integer('per_page', 10), 50));

        $query = Department::query()
            ->withCount([
                'assignments',
                'activeAssignments',
            ])
            ->latest();

        if ($request->filled('search')) {
            $search = trim((string) $request->search);

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate($perPage)->withQueryString());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:departments,name'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $department = Department::create($validated);

        return response()->json($department, 201);
    }

    public function show(Department $department): JsonResponse
    {
        $department->loadCount([
            'assignments',
            'activeAssignments',
        ]);

        return response()->json($department);
    }

    public function update(Request $request, Department $department): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:departments,name,'.$department->id],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $department->update($validated);

        return response()->json(
            $department->refresh()->loadCount([
                'assignments',
                'activeAssignments',
            ])
        );
    }

    public function destroy(Department $department): JsonResponse
    {
        if ($department->assignments()->exists()) {
            return response()->json([
                'message' => 'Cannot delete department with linked assignments.',
            ], 422);
        }

        if ($department->receivers()->exists()) {
            return response()->json([
                'message' => 'Cannot delete department with linked receivers.',
            ], 422);
        }

        $department->delete();

        return response()->json([
            'message' => 'Department deleted successfully',
        ]);
    }
}
