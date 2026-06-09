<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\CustomerSubscription;
use App\Models\DomainHostingRequest;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CrmTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_customer(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post('/customers', [
                'company_name' => 'Acme PNG',
                'contact_name' => 'Ada Customer',
                'email' => 'ada@example.com',
                'phone' => '+675 1234 5678',
                'industry' => 'Retail',
                'status' => 'active',
                'website' => 'https://example.com',
                'address' => 'Port Moresby',
                'notes' => 'Priority customer',
                'next_follow_up_at' => now()->addDay()->toDateString(),
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('customers', [
            'company_name' => 'Acme PNG',
            'email' => 'ada@example.com',
            'status' => 'active',
        ]);
    }

    public function test_customer_renewal_date_rejects_invalid_years(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post('/customers', [
                'company_name' => 'Invalid Date Client',
                'contact_name' => 'Invalid Date Contact',
                'email' => 'invalid-date@example.com',
                'status' => 'active',
                'next_follow_up_at' => '222222-02-01',
            ])
            ->assertSessionHasErrors('next_follow_up_at');
    }

    public function test_customer_can_create_own_hosting_request(): void
    {
        $customer = Customer::create([
            'company_name' => 'Client PNG',
            'contact_name' => 'Client User',
            'email' => 'client@example.com',
            'status' => 'active',
        ]);

        $user = User::factory()->create([
            'role' => 'customer',
            'customer_id' => $customer->id,
        ]);

        $this->actingAs($user)
            ->post('/hosting-requests', [
                'customer_id' => $customer->id,
                'domain_name' => 'clientpng.com',
                'service_type' => 'domain_hosting',
                'plan' => 'value',
                'status' => 'approved',
                'requested_start_date' => now()->toDateString(),
                'requirements' => 'Hosting and email setup',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('domain_hosting_requests', [
            'customer_id' => $customer->id,
            'domain_name' => 'clientpng.com',
            'status' => 'new',
            'assigned_to' => null,
        ]);
    }

    public function test_staff_cannot_access_user_management(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);

        $this->actingAs($staff)
            ->get('/users')
            ->assertForbidden();
    }

    public function test_admin_can_create_customer_login_user(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = Customer::create([
            'company_name' => 'Portal Client',
            'contact_name' => 'Portal Contact',
            'email' => 'portal@example.com',
            'status' => 'active',
        ]);

        $this->actingAs($admin)
            ->post('/users', [
                'name' => 'Portal Login',
                'email' => 'login@example.com',
                'phone' => '+675 7000 0000',
                'role' => 'customer',
                'customer_id' => $customer->id,
                'is_active' => true,
                'password' => 'password123',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('users', [
            'email' => 'login@example.com',
            'role' => 'customer',
            'customer_id' => $customer->id,
        ]);
    }

    public function test_admin_can_create_staff_user_and_assign_role(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post('/users', [
                'name' => 'Service Staff',
                'email' => 'staff-login@example.com',
                'phone' => '+675 7000 0001',
                'role' => 'staff',
                'customer_id' => null,
                'is_active' => true,
                'password' => 'password123',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('users', [
            'email' => 'staff-login@example.com',
            'role' => 'staff',
            'customer_id' => null,
        ]);
    }

    public function test_admin_can_update_branding_settings(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin)
            ->post('/admin-settings', [
                '_method' => 'patch',
                'email_from_address' => 'support@nextgenpng.net',
                'email_from_name' => 'NextGen Support',
                'mail_host' => 'mail.nextgenpng.net',
                'mail_port' => 25,
                'send_email_user_ids' => [$admin->id],
                'brand_name' => 'NextGen Service Desk',
                'brand_logo' => UploadedFile::fake()->create('logo.png', 10, 'image/png'),
            ])
            ->assertRedirect();

        $this->assertSame('NextGen Service Desk', SystemSetting::getValue('brand_name'));
        $this->assertStringContainsString('/storage/branding/', SystemSetting::getValue('brand_logo_url'));
    }

    public function test_staff_can_open_support_request_detail(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $customer = Customer::create([
            'company_name' => 'Support Client',
            'contact_name' => 'Support Contact',
            'email' => 'support-client@example.com',
            'status' => 'active',
        ]);
        $request = DomainHostingRequest::create([
            'customer_id' => $customer->id,
            'domain_name' => 'support-client.com',
            'service_type' => 'support_contract',
            'plan' => 'business',
            'status' => 'new',
            'requirements' => 'Help desk support',
        ]);

        $this->actingAs($staff)
            ->get("/support-requests/{$request->id}")
            ->assertOk();
    }

    public function test_admin_can_update_hosting_request(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $customer = Customer::create([
            'company_name' => 'Hosting Client',
            'contact_name' => 'Hosting Contact',
            'email' => 'hosting@example.com',
            'status' => 'active',
        ]);
        $request = DomainHostingRequest::create([
            'customer_id' => $customer->id,
            'domain_name' => 'old-domain.com',
            'service_type' => 'website_hosting',
            'plan' => 'starter',
            'status' => 'new',
        ]);

        $this->actingAs($admin)
            ->put("/hosting-requests/{$request->id}", [
                'customer_id' => $customer->id,
                'domain_name' => 'new-domain.com',
                'service_type' => 'domain_hosting',
                'plan' => 'enterprise',
                'status' => 'completed',
                'quoted_amount' => 2500,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('domain_hosting_requests', [
            'id' => $request->id,
            'domain_name' => 'new-domain.com',
            'status' => 'completed',
            'quoted_amount' => 2500,
        ]);
    }

    public function test_staff_can_view_domain_listing(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $customer = Customer::create([
            'company_name' => 'Domain Client',
            'contact_name' => 'Domain Contact',
            'email' => 'domain-client@example.com',
            'status' => 'active',
            'address' => 'Port Moresby',
        ]);
        DomainHostingRequest::create([
            'customer_id' => $customer->id,
            'domain_name' => 'domain-client.com.pg',
            'service_type' => 'domain_hosting',
            'plan' => 'basic',
            'status' => 'completed',
        ]);

        $this->actingAs($staff)
            ->get('/domains')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('domains/index')
                ->where('domains.0.domain', 'domain-client.com.pg')
                ->where('domains.0.customer_name', 'Domain Client')
            );
    }

    public function test_staff_can_create_client_subscription(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $customer = Customer::create([
            'company_name' => 'ISP Client',
            'contact_name' => 'ISP Contact',
            'email' => 'isp-client@example.com',
            'status' => 'active',
        ]);

        $this->actingAs($staff)
            ->post('/subscriptions', [
                'customer_id' => $customer->id,
                'service_type' => 'internet_service',
                'service_name' => 'Business Fibre',
                'reference' => 'CIR-1001',
                'status' => 'active',
                'starts_at' => '2026-01-01',
                'expires_at' => '2026-12-31',
                'renewal_cycle' => 'yearly',
                'amount' => 12000,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('customer_subscriptions', [
            'customer_id' => $customer->id,
            'service_type' => 'internet_service',
            'reference' => 'CIR-1001',
        ]);
        $this->assertSame('2026-12-31', CustomerSubscription::firstOrFail()->expires_at->toDateString());
    }

    public function test_staff_can_attach_payment_invoice_file_to_subscription(): void
    {
        Storage::fake('public');

        $staff = User::factory()->create(['role' => 'staff']);
        $customer = Customer::create([
            'company_name' => 'Invoice Client',
            'contact_name' => 'Invoice Contact',
            'email' => 'invoice-client@example.com',
            'status' => 'active',
        ]);
        $subscription = CustomerSubscription::create([
            'customer_id' => $customer->id,
            'service_type' => 'domain_hosting',
            'status' => 'active',
            'starts_at' => '2026-01-01',
            'expires_at' => '2026-12-31',
            'renewal_cycle' => 'yearly',
            'amount' => 450,
        ]);

        $this->actingAs($staff)
            ->post("/subscriptions/{$subscription->id}/payments", [
                'paid_at' => '2026-01-05',
                'period_start' => '2026-01-01',
                'period_end' => '2026-12-31',
                'amount' => 450,
                'payment_reference' => 'PMT-100',
                'invoice_number' => 'INV-100',
                'attachment' => UploadedFile::fake()->create('invoice.pdf', 10, 'application/pdf'),
            ])
            ->assertRedirect();

        $payment = $subscription->payments()->firstOrFail();

        $this->assertDatabaseHas('subscription_payments', [
            'customer_subscription_id' => $subscription->id,
            'invoice_number' => 'INV-100',
            'file_name' => 'invoice.pdf',
        ]);
        Storage::disk('public')->assertExists($payment->file_path);
    }

    public function test_service_credit_extends_subscription_expiry(): void
    {
        $staff = User::factory()->create(['role' => 'staff']);
        $customer = Customer::create([
            'company_name' => 'Credit Client',
            'contact_name' => 'Credit Contact',
            'email' => 'credit-client@example.com',
            'status' => 'active',
        ]);
        $subscription = CustomerSubscription::create([
            'customer_id' => $customer->id,
            'service_type' => 'internet_service',
            'status' => 'active',
            'starts_at' => '2026-01-01',
            'expires_at' => '2026-12-31',
            'renewal_cycle' => 'yearly',
            'amount' => 12000,
        ]);

        $this->actingAs($staff)
            ->post("/subscriptions/{$subscription->id}/credits", [
                'starts_at' => '2026-03-01',
                'ends_at' => '2026-04-30',
                'reason' => 'ISP outage from March to April 2026',
            ])
            ->assertRedirect();

        $subscription->refresh();

        $this->assertSame('2027-02-28', $subscription->expires_at->toDateString());
        $this->assertDatabaseHas('subscription_credits', [
            'customer_subscription_id' => $subscription->id,
            'months' => 2,
        ]);
        $this->assertSame('2027-02-28', $subscription->credits()->firstOrFail()->applied_to_expires_at->toDateString());
    }
}
