<?php

namespace App\Http\Controllers;

use App\Models\Receiver;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReceiverController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max(5, min((int) $request->integer('per_page', 100), 100));

        $query = Receiver::query()
            ->with('department')
            ->withCount(['assignments'])
            ->orderBy('name');

        if ($request->has('active_only') && $request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->search);

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhereHas('department', function ($sub) use ($search) {
                        $sub->where('name', 'like', "%{$search}%");
                    });
            });
        }

        return response()->json($query->paginate($perPage)->withQueryString());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('receivers', 'name')->where(fn ($query) => $query->where('department_id', $request->integer('department_id'))),
            ],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $receiver = Receiver::create($validated)->load('department');

        return response()->json($receiver, 201);
    }

    public function show(Receiver $receiver)
    {
        return response()->json($receiver->load('department')->loadCount('assignments'));
    }

    public function update(Request $request, Receiver $receiver)
    {
        $validated = $request->validate([
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('receivers', 'name')
                    ->ignore($receiver->id)
                    ->where(fn ($query) => $query->where('department_id', $request->integer('department_id'))),
            ],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $receiver->update($validated);

        return response()->json($receiver->fresh()->load('department')->loadCount('assignments'));
    }

    public function destroy(Receiver $receiver)
    {
        if ($receiver->assignments()->exists()) {
            return response()->json([
                'message' => 'Cannot delete receiver with assignment history.',
            ], 422);
        }

        $receiver->delete();

        return response()->json([
            'message' => 'Receiver deleted successfully',
        ]);
    }
}
