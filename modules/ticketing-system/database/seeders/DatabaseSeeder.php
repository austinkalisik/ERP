<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\Client;
use App\Models\FinanceRecord;
use App\Models\KnowledgeBaseArticle;
use App\Models\Service;
use App\Models\SlaContract;
use App\Models\SystemSetting;
use App\Models\SystemStatus;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'test@example.com'],
            ['name' => 'Admin User', 'password' => Hash::make('password')]
        );

        collect([
            'company_name' => 'NextGen Technology Limited',
            'website_url' => 'https://nextgenpng.net/',
            'support_email' => 'support@nextgenpng.net',
            'support_phone' => '+675 7999 8999',
            'office_address' => 'Port Moresby, PNG',
            'profile_name' => 'NextGen Operations Centre',
            'profile_role' => 'Port Moresby, PNG',
            'profile_photo' => '',
            'default_sla_minutes' => '1440',
            'notifications_enabled' => '1',
        ])->each(fn (string $value, string $key): SystemSetting => SystemSetting::updateOrCreate(['key' => $key], ['value' => $value]));

        $clients = collect([
            ['name' => 'Nextgen Finance Ltd', 'contact_person' => 'Ila Manager', 'email' => 'it.manager@nextgenfinance.com.pg', 'phone' => '+675 321 4455', 'location' => 'Port Moresby', 'company_type' => 'Financial Services'],
            ['name' => 'PNG Aid Partners', 'contact_person' => 'Sarah Wari', 'email' => 'sarah.wari@pnga id.org', 'phone' => '+675 7100 2211', 'location' => 'Gordons, NCD', 'company_type' => 'NGO'],
            ['name' => 'Highlands Retail Ltd', 'contact_person' => 'James Kila', 'email' => 'james.kila@highlandsretail.pg', 'phone' => '+675 7350 8844', 'location' => 'Mt Hagen', 'company_type' => 'Retail'],
            ['name' => 'City Pharmacy', 'contact_person' => 'Maria Santos', 'email' => 'maria.santos@citypharmacy.pg', 'phone' => '+675 7991 3344', 'location' => 'Port Moresby', 'company_type' => 'Healthcare Retail'],
            ['name' => 'Solomon Sea Logistics', 'contact_person' => 'Noah Kari', 'email' => 'noah.kari@solomonsea.pg', 'phone' => '+675 7622 0101', 'location' => 'Lae', 'company_type' => 'Logistics'],
            ['name' => 'Morobe Mining Co.', 'contact_person' => 'Leah Wong', 'email' => 'leah.wong@morobemining.pg', 'phone' => '+675 7311 7744', 'location' => 'Morobe', 'company_type' => 'Mining'],
            ['name' => 'NCDC', 'contact_person' => 'Peter Manu', 'email' => 'peter.manu@ncdc.gov.pg', 'phone' => '+675 324 0700', 'location' => 'Waigani', 'company_type' => 'Government'],
            ['name' => 'Wantok Store', 'contact_person' => 'Anna Muri', 'email' => 'anna.muri@wantokstore.pg', 'phone' => '+675 7902 4420', 'location' => 'Boroko', 'company_type' => 'SME Retail'],
        ])->mapWithKeys(fn (array $data): array => [
            $data['name'] => Client::updateOrCreate(['name' => $data['name']], $data + ['status' => 'active']),
        ]);

        $services = collect([
            ['name' => 'Domain & Hosting', 'category' => 'Domain & Hosting', 'owner_team' => 'Hosting Team', 'default_sla_minutes' => 1440, 'description' => 'Domains, DNS, SSL, website hosting, and registrar support.'],
            ['name' => 'Email Support', 'category' => 'Email Delivery', 'owner_team' => 'Email Platform Team', 'default_sla_minutes' => 480, 'description' => 'Mailbox, spam, DKIM/SPF, delivery, and email client support.'],
            ['name' => 'ISP / Fiber', 'category' => 'Connectivity', 'owner_team' => 'Network Team', 'default_sla_minutes' => 240, 'description' => 'Fiber internet, routing, gateway, and last-mile support.'],
            ['name' => 'VSAT / Connectivity', 'category' => 'Connectivity', 'owner_team' => 'NOC Team', 'default_sla_minutes' => 180, 'description' => 'Remote branch VSAT, latency, availability, and link support.'],
            ['name' => 'AI CCTV / Security', 'category' => 'Security', 'owner_team' => 'Security Solutions', 'default_sla_minutes' => 720, 'description' => 'AI CCTV, recording, mobile viewing, and security alerts.'],
            ['name' => 'Document Management', 'category' => 'Document Management', 'owner_team' => 'Document Solutions', 'default_sla_minutes' => 1440, 'description' => 'Document workflow, indexing, archive, and approval systems.'],
            ['name' => 'Software Engineering', 'category' => 'Software Engineering', 'owner_team' => 'Software Engineering', 'default_sla_minutes' => 2880, 'description' => 'Custom portal, app support, bug fixes, and deployments.'],
            ['name' => 'Other Services', 'category' => 'General IT Support', 'owner_team' => 'Service Desk', 'default_sla_minutes' => 1440, 'description' => 'General IT support and service desk triage.'],
        ])->mapWithKeys(fn (array $data): array => [
            $data['name'] => Service::updateOrCreate(['name' => $data['name']], $data + ['status' => 'operational']),
        ]);

        foreach ($clients as $client) {
            foreach ($services->take(3) as $service) {
                SlaContract::updateOrCreate(
                    ['client_id' => $client->id, 'service_id' => $service->id],
                    [
                        'name' => "{$client->name} {$service->name} SLA",
                        'response_minutes' => 60,
                        'resolution_minutes' => $service->default_sla_minutes,
                        'status' => 'active',
                        'starts_at' => now()->subMonths(3)->toDateString(),
                        'ends_at' => now()->addYear()->toDateString(),
                    ]
                );
            }
        }

        $titles = [
            ['Email delivery failure', 'Users are not receiving external emails. Affects multiple departments.', 'Nextgen Finance Ltd', 'Email Support', 'high', 'in_progress', -45],
            ['Website not loading', 'Public site intermittently returns timeout from Port Moresby clients.', 'PNG Aid Partners', 'Domain & Hosting', 'high', 'open', 70],
            ['ISP connection intermittent', 'Fiber service drops every 15 minutes during business hours.', 'Highlands Retail Ltd', 'ISP / Fiber', 'medium', 'in_progress', 150],
            ['CCTV AI alerts not working', 'Motion and face alerts are no longer pushing to mobile devices.', 'City Pharmacy', 'AI CCTV / Security', 'high', 'open', 30],
            ['VSAT link down', 'Remote branch reports complete VSAT outage after heavy rain.', 'Solomon Sea Logistics', 'VSAT / Connectivity', 'critical', 'in_progress', 15],
            ['Document access issue', 'Approvers cannot access invoice workflow documents.', 'Morobe Mining Co.', 'Document Management', 'low', 'waiting_client', 220],
            ['Software bug on portal', 'Customer portal invoice filter returns an error.', 'NCDC', 'Software Engineering', 'medium', 'in_progress', 85],
            ['New domain registration', 'Register and configure DNS for new campaign domain.', 'Wantok Store', 'Domain & Hosting', 'low', 'open', 310],
            ['Mailbox migration plan', 'Prepare migration checklist for executive mailboxes.', 'Nextgen Finance Ltd', 'Email Support', 'medium', 'open', 420],
            ['Gateway packet loss', 'Internet gateway showing elevated packet loss since morning.', 'PNG Aid Partners', 'ISP / Fiber', 'critical', 'in_progress', -90],
            ['VSAT latency review', 'Latency above contract threshold for remote warehouse.', 'Highlands Retail Ltd', 'VSAT / Connectivity', 'high', 'waiting_client', 180],
            ['Camera retention audit', 'Confirm CCTV cloud retention policy for compliance audit.', 'City Pharmacy', 'AI CCTV / Security', 'medium', 'resolved', -240],
            ['Document workflow rule', 'Update invoice approval routing for legal team.', 'Solomon Sea Logistics', 'Document Management', 'medium', 'open', 960],
            ['Portal deployment check', 'Run QA before production handover for new portal release.', 'Morobe Mining Co.', 'Software Engineering', 'high', 'in_progress', 360],
            ['SSL certificate renewal', 'Renew SSL certificate before expiry window.', 'NCDC', 'Domain & Hosting', 'high', 'open', 125],
            ['Spam filtering tuning', 'Too many supplier invoices are landing in quarantine.', 'Wantok Store', 'Email Support', 'medium', 'open', 640],
            ['Core switch monitoring', 'Add SNMP monitoring for newly installed core switch.', 'Nextgen Finance Ltd', 'Other Services', 'low', 'resolved', -1440],
            ['Data center access request', 'Need scheduled onsite access for server inspection.', 'PNG Aid Partners', 'Other Services', 'low', 'closed', -2880],
            ['Fiber failover test', 'Test backup link and document failover behavior.', 'Highlands Retail Ltd', 'ISP / Fiber', 'medium', 'open', 780],
            ['CCTV camera offline', 'Warehouse camera 04 offline after power maintenance.', 'City Pharmacy', 'AI CCTV / Security', 'high', 'in_progress', 95],
            ['Search indexing failed', 'Document management search index is stale.', 'Morobe Mining Co.', 'Document Management', 'critical', 'open', -30],
            ['API timeout investigation', 'Customer portal API times out during report export.', 'NCDC', 'Software Engineering', 'high', 'in_progress', 240],
            ['DNS propagation query', 'Client needs confirmation of DNS propagation status.', 'Wantok Store', 'Domain & Hosting', 'low', 'waiting_client', 720],
            ['Email client setup', 'Configure Outlook profiles for new finance team devices.', 'Solomon Sea Logistics', 'Email Support', 'low', 'resolved', -360],
        ];

        foreach ($titles as $index => [$title, $description, $clientName, $serviceName, $priority, $status, $minutesUntilDue]) {
            $client = $clients[$clientName];
            $service = $services[$serviceName];
            $reportedAt = Carbon::now()->subMinutes(90 + ($index * 37));
            $dueAt = Carbon::now()->addMinutes($minutesUntilDue);
            $resolvedAt = in_array($status, ['resolved', 'closed'], true) ? Carbon::now()->subMinutes(abs($minutesUntilDue) + 30) : null;

            $ticket = Ticket::updateOrCreate(
                ['ticket_number' => 'NGT-'.now()->format('Y').'-'.str_pad((string) (1024 + $index), 4, '0', STR_PAD_LEFT)],
                [
                    'title' => $title,
                    'description' => $description,
                    'client_id' => $client->id,
                    'service_id' => $service->id,
                    'requester_name' => $client->contact_person,
                    'requester_email' => $client->email,
                    'assignee_name' => $service->owner_team,
                    'team' => $service->owner_team,
                    'department' => $client->name,
                    'category' => $service->category,
                    'priority' => $priority,
                    'status' => $status,
                    'reported_at' => $reportedAt,
                    'due_at' => $dueAt,
                    'due_date' => $dueAt->toDateString(),
                    'resolved_at' => $resolvedAt,
                    'sla_minutes' => $service->default_sla_minutes,
                    'internal_notes' => [],
                ]
            );

            $ticket->comments()->updateOrCreate(
                ['event_type' => 'created', 'author_name' => 'Admin User'],
                ['body' => 'Ticket created via portal.', 'visibility' => 'public']
            );
            $ticket->comments()->updateOrCreate(
                ['event_type' => 'comment', 'author_name' => $service->owner_team],
                ['body' => 'Initial investigation is underway and client has been notified.', 'visibility' => 'internal']
            );
            $ticket->activities()->updateOrCreate(
                ['type' => 'created', 'actor' => 'Admin User'],
                ['description' => 'Created this ticket via portal.']
            );
            $ticket->activities()->updateOrCreate(
                ['type' => 'status', 'actor' => $service->owner_team],
                ['description' => "Updated status to {$status}."]
            );
        }

        collect(['Core Network', 'Internet Gateways', 'Email Platform', 'CCTV Cloud', 'VSAT Network', 'Data Center', 'Website'])
            ->each(fn (string $name): SystemStatus => SystemStatus::updateOrCreate(
                ['name' => $name],
                ['status' => 'operational', 'region' => 'PNG', 'checked_at' => now(), 'message' => 'All systems operational']
            ));

        foreach ($clients->values()->take(5) as $index => $client) {
            Asset::updateOrCreate(
                ['asset_tag' => 'NGT-ASSET-'.str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT)],
                ['client_id' => $client->id, 'name' => "{$client->name} managed gateway", 'type' => 'Network Device', 'status' => 'active', 'location' => $client->location]
            );
            FinanceRecord::updateOrCreate(
                ['invoice_number' => 'INV-2026-'.str_pad((string) ($index + 101), 4, '0', STR_PAD_LEFT)],
                ['client_id' => $client->id, 'amount' => 1800 + ($index * 375), 'status' => $index % 2 === 0 ? 'sent' : 'paid', 'issued_at' => now()->subDays(10), 'due_at' => now()->addDays(20)]
            );
        }

        collect([
            ['title' => 'Email SPF and DKIM troubleshooting', 'category' => 'Email Support', 'summary' => 'Checklist for delivery failures and authentication issues.'],
            ['title' => 'VSAT outage triage guide', 'category' => 'Connectivity', 'summary' => 'Steps for checking modem, weather, and NOC escalation.'],
            ['title' => 'Domain DNS propagation checklist', 'category' => 'Domain & Hosting', 'summary' => 'How to verify nameservers, zone records, TTL, and SSL.'],
        ])->each(fn (array $article): KnowledgeBaseArticle => KnowledgeBaseArticle::updateOrCreate(
            ['title' => $article['title']],
            $article + ['body' => $article['summary'].' Follow the standard NextGen escalation path and document the ticket activity.', 'status' => 'published']
        ));
    }
}
