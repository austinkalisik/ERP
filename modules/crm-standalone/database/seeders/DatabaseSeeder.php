<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\CustomerSubscription;
use App\Models\DomainHostingRequest;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@nextgenpng.net'],
            [
                'name' => 'NextGen Admin',
                'password' => 'password',
                'role' => 'admin',
                'phone' => '+675 7000 0001',
                'is_active' => true,
            ],
        );

        $staff = User::updateOrCreate(
            ['email' => 'staff@nextgenpng.net'],
            [
                'name' => 'NextGen Staff',
                'password' => 'password',
                'role' => 'staff',
                'phone' => '+675 7000 0002',
                'is_active' => true,
            ],
        );

        $customers = collect([
            [
                'company_name' => 'NextGen PNG',
                'contact_name' => 'Customer Contact',
                'email' => 'customer@nextgenpng.net',
                'phone' => '+675 0000 0000',
                'industry' => 'ICT Services',
                'status' => 'active',
                'website' => 'nextgenpng.net',
                'address' => 'Port Moresby, Papua New Guinea',
                'notes' => 'Demo customer record for customer portal testing.',
                'next_follow_up_at' => '2026-06-01',
            ],
            [
                'company_name' => 'Austin Tech Services',
                'contact_name' => 'Austin Kalisik',
                'email' => 'austin@example.com',
                'phone' => '+675 7111 1111',
                'industry' => 'Technology',
                'status' => 'active',
                'website' => 'austintech.com.pg',
                'address' => 'Taurama Road',
                'notes' => 'Active domain hosting and ISP customer.',
                'next_follow_up_at' => '2026-05-30',
            ],
            [
                'company_name' => 'Coral Sea Logistics',
                'contact_name' => 'Maria Vele',
                'email' => 'accounts@coralsealogistics.com.pg',
                'phone' => '+675 7222 2222',
                'industry' => 'Logistics',
                'status' => 'suspended',
                'website' => 'coralsealogistics.com.pg',
                'address' => 'Lae, Morobe Province',
                'notes' => 'Suspended for overdue payment. Keep visible on dashboard.',
                'next_follow_up_at' => '2026-05-20',
            ],
            [
                'company_name' => 'Highlands Fleet Tracking',
                'contact_name' => 'Peter Nema',
                'email' => 'ops@highlandsfleet.com.pg',
                'phone' => '+675 7333 3333',
                'industry' => 'Transport',
                'status' => 'active',
                'website' => 'highlandsfleet.com.pg',
                'address' => 'Mt Hagen, Western Highlands',
                'notes' => 'GPS subscription test customer.',
                'next_follow_up_at' => '2026-07-10',
            ],
        ])->mapWithKeys(fn (array $data) => [
            $data['email'] => Customer::updateOrCreate(['email' => $data['email']], $data),
        ]);

        User::updateOrCreate(
            ['email' => 'customer@nextgenpng.net'],
            [
                'name' => 'Customer Login',
                'password' => 'password',
                'role' => 'customer',
                'customer_id' => $customers['customer@nextgenpng.net']->id,
                'phone' => '+675 7000 0003',
                'is_active' => true,
            ],
        );

        $requests = [
            [
                'customer' => 'customer@nextgenpng.net',
                'assigned_to' => $admin->id,
                'domain_name' => 'nextgenpng.net',
                'service_type' => 'domain_hosting',
                'plan' => 'value',
                'status' => 'completed',
                'requested_start_date' => '2026-01-01',
                'renewal_date' => '2026-12-31',
                'quoted_amount' => 1200,
                'requirements' => 'Domain hosting, SSL, business email, and renewal tracking.',
                'internal_notes' => 'Seeded completed domain hosting record.',
            ],
            [
                'customer' => 'austin@example.com',
                'assigned_to' => $staff->id,
                'domain_name' => 'austintech.com.pg',
                'service_type' => 'website_hosting',
                'plan' => 'business',
                'status' => 'provisioning',
                'requested_start_date' => '2026-02-01',
                'renewal_date' => '2027-01-31',
                'quoted_amount' => 1850,
                'requirements' => 'Business website hosting and mailbox setup.',
                'internal_notes' => 'Provisioning in progress.',
            ],
            [
                'customer' => 'accounts@coralsealogistics.com.pg',
                'assigned_to' => $admin->id,
                'domain_name' => 'coralsealogistics.com.pg',
                'service_type' => 'email_hosting',
                'plan' => 'standard',
                'status' => 'completed',
                'requested_start_date' => '2026-01-15',
                'renewal_date' => '2026-11-30',
                'quoted_amount' => 950,
                'requirements' => 'Email hosting renewal for logistics team.',
                'internal_notes' => 'Customer account is suspended but domain remains listed.',
            ],
            [
                'customer' => 'austin@example.com',
                'assigned_to' => $staff->id,
                'domain_name' => 'pngbusinesshub.com.pg',
                'service_type' => 'domain_registration',
                'plan' => 'basic',
                'status' => 'new',
                'requested_start_date' => '2026-05-10',
                'renewal_date' => null,
                'quoted_amount' => 250,
                'requirements' => 'New .com.pg domain registration.',
                'internal_notes' => 'Waiting on customer confirmation.',
            ],
            [
                'customer' => 'ops@highlandsfleet.com.pg',
                'assigned_to' => $staff->id,
                'domain_name' => 'highlandsfleet.com.pg',
                'service_type' => 'domain_registration',
                'plan' => 'standard',
                'status' => 'reviewing',
                'requested_start_date' => '2026-05-12',
                'renewal_date' => null,
                'quoted_amount' => 320,
                'requirements' => 'Register fleet tracking domain.',
                'internal_notes' => 'Checking registrar availability.',
            ],
            [
                'customer' => 'accounts@coralsealogistics.com.pg',
                'assigned_to' => $admin->id,
                'domain_name' => 'coralseaexpress.com.pg',
                'service_type' => 'domain_registration',
                'plan' => 'premium',
                'status' => 'quoted',
                'requested_start_date' => '2026-05-13',
                'renewal_date' => null,
                'quoted_amount' => 420,
                'requirements' => 'Register additional logistics brand domain.',
                'internal_notes' => 'Quote sent to accounts team.',
            ],
            [
                'customer' => 'austin@example.com',
                'assigned_to' => $staff->id,
                'domain_name' => 'Austin Tech ISP Link',
                'service_type' => 'isp_connectivity',
                'plan' => 'enterprise',
                'status' => 'new',
                'requested_start_date' => '2026-05-15',
                'renewal_date' => null,
                'quoted_amount' => 2400,
                'requirements' => 'Internet service intermittent. Check router and upstream link.',
                'internal_notes' => 'Open support request for dashboard testing.',
            ],
            [
                'customer' => 'ops@highlandsfleet.com.pg',
                'assigned_to' => $staff->id,
                'domain_name' => 'GPS Device Support',
                'service_type' => 'vehicle_tracking',
                'plan' => 'business',
                'status' => 'approved',
                'requested_start_date' => '2026-05-14',
                'renewal_date' => null,
                'quoted_amount' => 780,
                'requirements' => 'Three GPS units stopped reporting.',
                'internal_notes' => 'Dispatch technician.',
            ],
            [
                'customer' => 'customer@nextgenpng.net',
                'assigned_to' => $admin->id,
                'domain_name' => 'Support Contract Renewal',
                'service_type' => 'support_contract',
                'plan' => 'standard',
                'status' => 'reviewing',
                'requested_start_date' => '2026-05-11',
                'renewal_date' => null,
                'quoted_amount' => 1500,
                'requirements' => 'Review monthly managed support agreement.',
                'internal_notes' => 'Open managed support ticket.',
            ],
        ];

        foreach ($requests as $data) {
            $customer = $customers[$data['customer']];
            unset($data['customer']);

            DomainHostingRequest::updateOrCreate(
                [
                    'customer_id' => $customer->id,
                    'domain_name' => $data['domain_name'],
                    'service_type' => $data['service_type'],
                ],
                $data + ['customer_id' => $customer->id],
            );
        }

        $subscriptions = [
            [
                'customer' => 'customer@nextgenpng.net',
                'service_type' => 'domain_hosting',
                'service_name' => 'NextGen Domain Hosting',
                'reference' => 'nextgenpng.net',
                'status' => 'active',
                'starts_at' => '2026-01-01',
                'expires_at' => '2026-12-31',
                'renewal_cycle' => 'yearly',
                'amount' => 1200,
                'notes' => 'Annual domain hosting package.',
            ],
            [
                'customer' => 'austin@example.com',
                'service_type' => 'internet_service',
                'service_name' => 'Business Fibre 50 Mbps',
                'reference' => 'ISP-AUS-001',
                'status' => 'active',
                'starts_at' => '2026-01-01',
                'expires_at' => '2027-02-28',
                'renewal_cycle' => 'yearly',
                'amount' => 12000,
                'notes' => 'Includes 2 months credit for March-April 2026 outage.',
            ],
            [
                'customer' => 'ops@highlandsfleet.com.pg',
                'service_type' => 'gps',
                'service_name' => 'Fleet GPS Tracking',
                'reference' => 'GPS-HFT-009',
                'status' => 'active',
                'starts_at' => '2026-03-01',
                'expires_at' => '2027-03-31',
                'renewal_cycle' => 'yearly',
                'amount' => 9600,
                'notes' => 'Fleet device monitoring subscription.',
            ],
        ];

        foreach ($subscriptions as $index => $data) {
            $customer = $customers[$data['customer']];
            unset($data['customer']);

            $subscription = CustomerSubscription::updateOrCreate(
                [
                    'customer_id' => $customer->id,
                    'service_type' => $data['service_type'],
                    'reference' => $data['reference'],
                ],
                $data + ['customer_id' => $customer->id],
            );

            $invoicePath = "subscription-payments/demo-invoice-{$subscription->id}.pdf";
            $invoiceText = "Demo invoice for {$subscription->service_name}\nCustomer: {$customer->company_name}\nAmount: {$subscription->amount}\n";
            Storage::disk('public')->put($invoicePath, $invoiceText);

            $subscription->payments()->updateOrCreate(
                ['invoice_number' => 'INV-2026-'.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT)],
                [
                    'paid_at' => '2026-01-05',
                    'period_start' => $subscription->starts_at?->toDateString(),
                    'period_end' => $subscription->expires_at?->toDateString(),
                    'amount' => $subscription->amount,
                    'payment_reference' => 'PMT-2026-'.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT),
                    'document_type' => ['invoice', 'receipt', 'sla'][$index] ?? 'invoice',
                    'file_path' => $invoicePath,
                    'file_name' => basename($invoicePath),
                    'file_mime' => 'application/pdf',
                    'file_size' => strlen($invoiceText),
                    'notes' => 'Seeded payment and invoice attachment for testing.',
                ],
            );
        }

        $internetSubscription = CustomerSubscription::where('reference', 'ISP-AUS-001')->first();
        $internetSubscription?->credits()->updateOrCreate(
            [
                'starts_at' => '2026-03-01',
                'ends_at' => '2026-04-30',
            ],
            [
                'credit_type' => 'service_outage',
                'months' => 2,
                'amount' => 2000,
                'applied_to_expires_at' => '2027-02-28',
                'reason' => 'ISP outage from March to April 2026. Customer receives two months credit beyond December 2026.',
            ],
        );

        CustomerSubscription::where('reference', 'GPS-HFT-009')->first()?->credits()->updateOrCreate(
            [
                'starts_at' => '2026-05-01',
                'ends_at' => '2026-05-31',
            ],
            [
                'credit_type' => 'service_outage',
                'months' => 1,
                'amount' => 800,
                'applied_to_expires_at' => '2027-03-31',
                'reason' => 'One month GPS reporting credit for May 2026 device outage.',
            ],
        );
    }
}
