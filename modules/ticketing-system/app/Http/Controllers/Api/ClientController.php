<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $clients = Client::query()
            ->withCount([
                'tickets',
                'tickets as open_tickets_count' => fn ($query) => $query->whereIn('status', ['open', 'in_progress', 'waiting_client']),
            ])
            ->when($request->string('search')->isNotEmpty(), function ($query) use ($request): void {
                $search = $request->string('search')->toString();
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('contact_person', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->get();

        return response()->json($clients);
    }

    public function store(Request $request): JsonResponse
    {
        $client = Client::create($this->validated($request));

        return response()->json($client, 201);
    }

    public function show(Client $client): JsonResponse
    {
        return response()->json($client->load('tickets.service'));
    }

    public function update(Request $request, Client $client): JsonResponse
    {
        $client->update($this->validated($request, true));

        return response()->json($client);
    }

    public function destroy(Client $client): JsonResponse
    {
        $client->delete();

        return response()->json(['deleted' => true]);
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$required, 'string', 'max:255'],
            'contact_person' => [$required, 'string', 'max:255'],
            'email' => [$required, 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'location' => ['nullable', 'string', 'max:255'],
            'company_type' => ['nullable', 'string', 'max:255'],
            'status' => [$required, Rule::in(['active', 'inactive', 'on_hold'])],
        ]);
    }
}
