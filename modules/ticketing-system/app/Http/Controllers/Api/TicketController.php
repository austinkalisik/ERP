<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Service;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class TicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tickets = Ticket::query()
            ->with(['client', 'service'])
            ->withCount(['comments', 'attachments'])
            ->when($request->string('search')->isNotEmpty(), function ($query) use ($request): void {
                $search = $request->string('search')->toString();
                $query->where(function ($query) use ($search): void {
                    $query->where('ticket_number', 'like', "%{$search}%")
                        ->orWhere('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('requester_name', 'like', "%{$search}%")
                        ->orWhere('requester_email', 'like', "%{$search}%")
                        ->orWhereHas('client', fn ($client) => $client->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('service', fn ($service) => $service->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($request->filled('status') && $request->status !== 'all', fn ($query) => $query->where('status', $request->status))
            ->when($request->filled('priority') && $request->priority !== 'all', fn ($query) => $query->where('priority', $request->priority))
            ->when($request->filled('client_id') && $request->client_id !== 'all', fn ($query) => $query->where('client_id', $request->client_id))
            ->when($request->filled('service_id') && $request->service_id !== 'all', fn ($query) => $query->where('service_id', $request->service_id))
            ->orderByRaw("case when status in ('resolved', 'closed') then 1 else 0 end")
            ->orderBy('due_at')
            ->latest('created_at')
            ->paginate(50);

        return response()->json($tickets);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedTicket($request);
        $data = $this->hydrateTicketData($data);
        $data['ticket_number'] = $this->nextTicketNumber();
        $data['reported_at'] = $data['reported_at'] ?? now();
        $data['due_at'] = $data['due_at'] ?? Carbon::parse($data['reported_at'])->addMinutes((int) ($data['sla_minutes'] ?? 1440));
        $data['due_date'] = $data['due_date'] ?? Carbon::parse($data['due_at'])->toDateString();
        $data['resolved_at'] = in_array($data['status'] ?? 'open', ['resolved', 'closed'], true) ? now() : null;

        $ticket = Ticket::create($data);
        $ticket->comments()->create([
            'author_name' => 'System',
            'body' => 'Ticket created.',
            'event_type' => 'created',
        ]);
        $ticket->activities()->create([
            'actor' => 'System',
            'type' => 'created',
            'description' => 'Ticket created through the service desk.',
        ]);

        return response()->json($ticket->load(['client', 'service', 'comments', 'activities', 'attachments']), 201);
    }

    public function show(Ticket $ticket): JsonResponse
    {
        return response()->json($ticket->load(['client', 'service', 'comments', 'activities', 'attachments']));
    }

    public function update(Request $request, Ticket $ticket): JsonResponse
    {
        $oldStatus = $ticket->status;
        $oldPriority = $ticket->priority;
        $data = $this->validatedTicket($request, true);
        $data = $this->hydrateTicketData($data, $ticket);

        if (array_key_exists('status', $data) && in_array($data['status'], ['resolved', 'closed'], true) && ! $ticket->resolved_at) {
            $data['resolved_at'] = now();
        }

        if (array_key_exists('status', $data) && ! in_array($data['status'], ['resolved', 'closed'], true)) {
            $data['resolved_at'] = null;
        }

        $ticket->update($data);

        if (($data['status'] ?? $oldStatus) !== $oldStatus) {
            $ticket->comments()->create([
                'author_name' => $request->string('updated_by', 'System')->toString(),
                'body' => "Status changed from {$oldStatus} to {$ticket->status}.",
                'event_type' => 'status_change',
                'visibility' => 'internal',
            ]);
            $ticket->activities()->create([
                'actor' => $request->string('updated_by', 'System')->toString(),
                'type' => 'status_change',
                'description' => "Status changed from {$oldStatus} to {$ticket->status}.",
            ]);
        }

        if (($data['priority'] ?? $oldPriority) !== $oldPriority) {
            $ticket->activities()->create([
                'actor' => $request->string('updated_by', 'System')->toString(),
                'type' => 'priority_change',
                'description' => "Priority changed from {$oldPriority} to {$ticket->priority}.",
            ]);
        }

        return response()->json($ticket->load(['client', 'service', 'comments', 'activities', 'attachments']));
    }

    public function destroy(Ticket $ticket): JsonResponse
    {
        $ticket->delete();

        return response()->json(['deleted' => true]);
    }

    public function comment(Request $request, Ticket $ticket): JsonResponse
    {
        $data = $request->validate([
            'author_name' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'visibility' => ['nullable', Rule::in(['public', 'internal'])],
        ]);

        $comment = $ticket->comments()->create($data + ['event_type' => 'comment', 'visibility' => $data['visibility'] ?? 'public']);
        $ticket->activities()->create([
            'actor' => $data['author_name'],
            'type' => $data['visibility'] ?? 'public',
            'description' => ($data['visibility'] ?? 'public') === 'internal' ? 'Added an internal note.' : 'Added a public comment.',
        ]);

        return response()->json($comment, 201);
    }

    public function attach(Request $request, Ticket $ticket): JsonResponse
    {
        $data = $request->validate([
            'filename' => ['required', 'string', 'max:255'],
            'path' => ['nullable', 'string', 'max:500'],
            'mime_type' => ['nullable', 'string', 'max:100'],
            'size' => ['nullable', 'integer', 'min:0'],
        ]);

        $attachment = $ticket->attachments()->create($data + ['size' => $data['size'] ?? 0]);
        $ticket->activities()->create([
            'actor' => $request->string('actor', 'Support Desk')->toString(),
            'type' => 'attachment',
            'description' => "Attached {$attachment->filename}.",
        ]);

        return response()->json($attachment, 201);
    }

    private function validatedTicket(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'title' => [$required, 'string', 'max:255'],
            'description' => [$required, 'string'],
            'client_id' => ['nullable', 'uuid', 'exists:clients,id'],
            'service_id' => ['nullable', 'uuid', 'exists:services,id'],
            'requester_name' => [$required, 'string', 'max:255'],
            'requester_email' => [$required, 'email', 'max:255'],
            'assignee_name' => ['nullable', 'string', 'max:255'],
            'team' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'category' => [$required, 'string', 'max:255'],
            'priority' => [$required, Rule::in(['low', 'medium', 'high', 'critical', 'urgent'])],
            'status' => [$required, Rule::in(['open', 'in_progress', 'waiting_client', 'waiting', 'resolved', 'closed'])],
            'due_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:1900-01-01', 'before_or_equal:9999-12-31'],
            'reported_at' => ['nullable', 'date'],
            'due_at' => ['nullable', 'date'],
            'sla_minutes' => ['nullable', 'integer', 'min:15', 'max:525600'],
            'internal_notes' => ['nullable', 'array'],
        ]);
    }

    private function hydrateTicketData(array $data, ?Ticket $ticket = null): array
    {
        if (($data['status'] ?? null) === 'waiting') {
            $data['status'] = 'waiting_client';
        }

        if (($data['priority'] ?? null) === 'urgent') {
            $data['priority'] = 'critical';
        }

        $client = isset($data['client_id']) ? Client::find($data['client_id']) : null;
        $service = isset($data['service_id']) ? Service::find($data['service_id']) : null;

        if ($client) {
            $data['requester_name'] = $data['requester_name'] ?? $client->contact_person;
            $data['requester_email'] = $data['requester_email'] ?? $client->email;
            $data['department'] = $data['department'] ?? $client->name;
        }

        if ($service) {
            $data['category'] = $data['category'] ?? $service->category;
            $data['team'] = $data['team'] ?? $service->owner_team;
            $data['assignee_name'] = $data['assignee_name'] ?? $service->owner_team;
            $data['sla_minutes'] = $data['sla_minutes'] ?? $service->default_sla_minutes;
        }

        if ((isset($data['reported_at']) || isset($data['sla_minutes'])) && ! isset($data['due_at'])) {
            $reported = Carbon::parse($data['reported_at'] ?? $ticket?->reported_at ?? now());
            $slaMinutes = (int) ($data['sla_minutes'] ?? $ticket?->sla_minutes ?? 1440);
            $data['due_at'] = $reported->copy()->addMinutes($slaMinutes);
            $data['due_date'] = $data['due_date'] ?? $data['due_at']->toDateString();
        }

        return $data;
    }

    private function nextTicketNumber(): string
    {
        $year = now()->format('Y');
        $latest = Ticket::query()
            ->where('ticket_number', 'like', "NGT-{$year}-%")
            ->orderByDesc('ticket_number')
            ->value('ticket_number');

        $count = $latest ? ((int) substr($latest, -4)) + 1 : 1;

        return "NGT-{$year}-".str_pad((string) $count, 4, '0', STR_PAD_LEFT);
    }
}
