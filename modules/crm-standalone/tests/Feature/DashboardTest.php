<?php

namespace Tests\Feature;

use App\Mail\BulkEmailMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }

    public function test_staff_can_send_bulk_email_to_valid_addresses()
    {
        Mail::fake();

        $staff = User::factory()->create(['role' => 'staff']);

        config([
            'mail.mailers.smtp.username' => 'support@nextgenpng.net',
            'mail.mailers.smtp.password' => 'secret',
        ]);

        $this->actingAs($staff)
            ->post('/bulk-email-validator/send', [
                'emails' => "one@example.com\ninvalid-address\ntwo@example.com",
                'subject' => 'Service notice',
                'message' => 'This is a test notice.',
            ])
            ->assertRedirect()
            ->assertSessionHas('bulk_email_send_summary', [
                'sent' => 2,
                'skipped' => 1,
            ]);

        Mail::assertSentCount(2);
        Mail::assertSent(BulkEmailMessage::class, 2);
    }

    public function test_bulk_email_requires_smtp_authentication()
    {
        Mail::fake();

        $staff = User::factory()->create(['role' => 'staff']);

        config([
            'mail.mailers.smtp.username' => null,
            'mail.mailers.smtp.password' => null,
        ]);

        $this->actingAs($staff)
            ->post('/bulk-email-validator/send', [
                'emails' => 'one@example.com',
                'subject' => 'Service notice',
                'message' => 'This is a test notice.',
            ])
            ->assertRedirect()
            ->assertSessionHasErrors('emails');

        Mail::assertNothingSent();
    }
}
