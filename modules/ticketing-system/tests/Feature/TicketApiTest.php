<?php

namespace Tests\Feature;

use App\Models\Ticket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TicketApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_ticket_can_be_created_listed_and_commented_on(): void
    {
        $payload = [
            'title' => 'Email outage',
            'description' => 'Shared mailbox is not receiving new mail.',
            'requester_name' => 'Ari Tuma',
            'requester_email' => 'ari.tuma@example.com',
            'assignee_name' => 'Support Desk',
            'department' => 'Administration',
            'category' => 'Email',
            'priority' => 'high',
            'status' => 'open',
            'due_date' => now()->addDays(2)->toDateString(),
        ];

        $created = $this->postJson('/api/tickets', $payload)
            ->assertCreated()
            ->assertJsonPath('title', 'Email outage')
            ->assertJsonPath('ticket_number', 'NGT-'.now()->format('Y').'-0001')
            ->json();

        $this->getJson('/api/tickets?search=mailbox')
            ->assertOk()
            ->assertJsonPath('data.0.id', $created['id']);

        $this->postJson("/api/tickets/{$created['id']}/comments", [
            'author_name' => 'Support Desk',
            'body' => 'Issue acknowledged and assigned.',
        ])
            ->assertCreated()
            ->assertJsonPath('body', 'Issue acknowledged and assigned.');

        $this->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('open', 1);
    }

    public function test_ticket_status_sets_resolved_timestamp(): void
    {
        $ticket = Ticket::create([
            'ticket_number' => 'NGT-2026-0100',
            'title' => 'Printer offline',
            'description' => 'Front desk printer is offline.',
            'requester_name' => 'Kai Moa',
            'requester_email' => 'kai.moa@example.com',
            'category' => 'Hardware',
            'priority' => 'medium',
            'status' => 'open',
        ]);

        $this->putJson("/api/tickets/{$ticket->id}", [
            'status' => 'resolved',
        ])
            ->assertOk()
            ->assertJsonPath('status', 'resolved')
            ->assertJsonPath('comments.0.event_type', 'status_change');

        $this->assertNotNull($ticket->refresh()->resolved_at);
    }

    public function test_ticket_due_date_requires_four_digit_year(): void
    {
        $this->postJson('/api/tickets', [
            'title' => 'Bad due date',
            'description' => 'Date has too many year digits.',
            'requester_name' => 'Ari Tuma',
            'requester_email' => 'ari.tuma@example.com',
            'category' => 'Email Support',
            'priority' => 'high',
            'status' => 'open',
            'due_date' => '111111-11-11',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('due_date');
    }

    public function test_ticket_number_continues_after_deleted_ticket(): void
    {
        Ticket::create([
            'ticket_number' => 'NGT-'.now()->format('Y').'-0006',
            'title' => 'Existing ticket',
            'description' => 'Ticket that should remain.',
            'requester_name' => 'Kai Moa',
            'requester_email' => 'kai.moa@example.com',
            'category' => 'Domain Hosting',
            'priority' => 'medium',
            'status' => 'open',
        ]);

        $ticket = Ticket::create([
            'ticket_number' => 'NGT-'.now()->format('Y').'-0007',
            'title' => 'Old ticket',
            'description' => 'Ticket that will be deleted.',
            'requester_name' => 'Kai Moa',
            'requester_email' => 'kai.moa@example.com',
            'category' => 'Domain Hosting',
            'priority' => 'medium',
            'status' => 'open',
        ]);

        $ticket->delete();

        $this->postJson('/api/tickets', [
            'title' => 'New ticket',
            'description' => 'Ticket should use the next available number.',
            'requester_name' => 'Ari Tuma',
            'requester_email' => 'ari.tuma@example.com',
            'category' => 'Email Support',
            'priority' => 'high',
            'status' => 'open',
        ])
            ->assertCreated()
            ->assertJsonPath('ticket_number', 'NGT-'.now()->format('Y').'-0007');
    }
}
