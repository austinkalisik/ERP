<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Mail\BulkEmailMessage;
use App\Models\Customer;
use App\Models\CustomerSubscription;
use App\Models\DomainHostingRequest;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $user = request()->user();

        if ($user->isStaff()) {
            $customers = Customer::with([
                'domainHostingRequests' => fn ($query) => $query
                    ->whereIn('service_type', [
                        ...DomainHostingRequest::DOMAIN_SERVICE_TYPES,
                        'domain_registration',
                    ])
                    ->latest()
                    ->limit(1),
            ])
                ->withCount('domainHostingRequests')
                ->latest()
                ->limit(25)
                ->get()
                ->map(function (Customer $customer) {
                    $domainRequest = $customer->domainHostingRequests->first();

                    return [
                        'id' => $customer->id,
                        'company_name' => $customer->company_name,
                        'contact_name' => $customer->contact_name,
                        'email' => $customer->email,
                        'phone' => $customer->phone,
                        'industry' => $domainRequest ? str($domainRequest->plan)->headline()->toString() : $customer->industry,
                        'status' => $customer->status,
                        'website' => $domainRequest?->domain_name ?? $customer->website,
                        'address' => $customer->address,
                        'notes' => $customer->notes,
                        'next_follow_up_at' => optional($customer->next_follow_up_at)->toDateString(),
                        'domain_hosting_requests_count' => $customer->domain_hosting_requests_count,
                        'created_at' => $customer->created_at,
                        'updated_at' => $customer->updated_at,
                    ];
                });

            return Inertia::render('dashboard', [
                'metrics' => [
                    'customers' => Customer::count(),
                    'domains' => DomainHostingRequest::query()
                        ->whereIn('service_type', [
                            ...DomainHostingRequest::DOMAIN_SERVICE_TYPES,
                            'domain_registration',
                        ])
                        ->where('status', '!=', 'cancelled')
                        ->count(),
                    'suspendedCustomers' => Customer::where('status', 'suspended')->count(),
                    'supportRequests' => DomainHostingRequest::supportServices()->open()->count(),
                    'domainRegistrations' => DomainHostingRequest::domainRegistrations()->open()->count(),
                ],
                'customers' => $customers,
                'recentRequests' => DomainHostingRequest::with('customer:id,company_name')
                    ->latest()
                    ->limit(8)
                    ->get(),
            ]);
        }

        $customerId = $user->customer_id;

        return Inertia::render('portal/index', [
            'customer' => $user->customer,
            'requests' => DomainHostingRequest::where('customer_id', $customerId)
                ->latest()
                ->get(),
        ]);
    }

    public function renewals(Request $request): Response
    {
        abort_unless($request->user()->isStaff(), 403);

        $month = $request->string('month', now()->format('Y-m'))->toString();

        try {
            $date = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        } catch (\Throwable) {
            $date = now()->startOfMonth();
        }

        $hostingRenewals = DomainHostingRequest::with('customer:id,company_name')
                ->whereNotNull('renewal_date')
                ->whereBetween('renewal_date', [$date->copy()->startOfMonth(), $date->copy()->endOfMonth()])
                ->orderBy('renewal_date')
                ->get()
                ->map(fn (DomainHostingRequest $request) => [
                    'id' => "hosting:{$request->id}",
                    'record_type' => 'hosting_request',
                    'customer_name' => $request->customer?->company_name ?? 'Unknown Customer',
                    'current_renewal_date' => optional($request->renewal_date)->toDateString(),
                    'next_renewal_date' => optional($request->renewal_date?->copy()->addYear())->toDateString(),
                    'renewal_cycle' => 'Yearly',
                    'renewal_item' => str_contains($request->service_type, 'hosting') ? 'Hosting' : 'Domain',
                ]);

        $subscriptionRenewals = CustomerSubscription::with('customer:id,company_name')
            ->whereNotNull('expires_at')
            ->whereBetween('expires_at', [$date->copy()->startOfMonth(), $date->copy()->endOfMonth()])
            ->orderBy('expires_at')
            ->get()
            ->map(fn (CustomerSubscription $subscription) => [
                'id' => "subscription:{$subscription->id}",
                'record_type' => 'subscription',
                'customer_name' => $subscription->customer?->company_name ?? 'Unknown Customer',
                'current_renewal_date' => optional($subscription->expires_at)->toDateString(),
                'next_renewal_date' => optional($subscription->expires_at?->copy()->addYear())->toDateString(),
                'renewal_cycle' => str($subscription->renewal_cycle)->headline()->toString(),
                'renewal_item' => $subscription->serviceLabel(),
            ]);

        return Inertia::render('renewals/index', [
            'renewals' => $hostingRenewals
                ->concat($subscriptionRenewals)
                ->sortBy('current_renewal_date')
                ->values(),
            'month' => $date->format('Y-m'),
            'monthLabel' => $date->format('F Y'),
        ]);
    }

    public function domains(Request $request): Response
    {
        abort_unless($request->user()->isStaff(), 403);

        $requestRows = DomainHostingRequest::with('customer:id,company_name,contact_name,email,address,status,industry,website')
            ->whereIn('service_type', [
                ...DomainHostingRequest::DOMAIN_SERVICE_TYPES,
                'domain_registration',
            ])
            ->where('status', '!=', 'cancelled')
            ->orderBy('domain_name')
            ->get()
            ->map(fn (DomainHostingRequest $request) => [
                'id' => "request-{$request->id}",
                'customer_name' => $request->customer?->company_name ?? 'Unknown Customer',
                'customer_contact' => $request->customer?->contact_name ?? '-',
                'domain' => $request->domain_name,
                'host_location' => $request->customer?->address ?? 'Port Moresby',
                'plan' => str($request->plan)->headline()->toString(),
                'status' => $request->status === 'completed'
                    ? ($request->customer?->status ?? 'active')
                    : $request->status,
            ]);

        $customerRows = Customer::query()
            ->whereNotNull('website')
            ->orderBy('company_name')
            ->get(['id', 'company_name', 'contact_name', 'email', 'address', 'status', 'industry', 'website'])
            ->map(fn (Customer $customer) => [
                'id' => "customer-{$customer->id}",
                'customer_name' => $customer->company_name,
                'customer_contact' => $customer->contact_name,
                'domain' => $customer->website,
                'host_location' => $customer->address ?? 'Port Moresby',
                'plan' => $customer->industry ?? 'Hosting',
                'status' => $customer->status,
            ]);

        return Inertia::render('domains/index', [
            'domains' => $requestRows
                ->concat($customerRows)
                ->unique('domain')
                ->sortBy('customer_name')
                ->values(),
        ]);
    }

    public function updateRenewals(Request $request): RedirectResponse
    {
        abort_unless($request->user()->isStaff(), 403);

        $data = $request->validate([
            'renewals' => ['required', 'array'],
            'renewals.*.id' => ['required', 'string'],
            'renewals.*.selected' => ['boolean'],
            'renewals.*.next_renewal_date' => ['required', 'date'],
        ]);

        $updated = 0;

        foreach ($data['renewals'] as $renewal) {
            if (! ($renewal['selected'] ?? false)) {
                continue;
            }

            [$type, $id] = array_pad(explode(':', $renewal['id'], 2), 2, null);

            match ($type) {
                'hosting' => DomainHostingRequest::whereKey($id)->update([
                    'renewal_date' => $renewal['next_renewal_date'],
                ]),
                'subscription' => CustomerSubscription::whereKey($id)->update([
                    'expires_at' => $renewal['next_renewal_date'],
                ]),
                default => 0,
            };

            $updated++;
        }

        return back()->with('success', "{$updated} renewal record(s) updated.");
    }

    public function bulkEmailValidator(Request $request): Response
    {
        abort_unless($request->user()->isStaff(), 403);

        return Inertia::render('tools/bulk-email-validator', [
            'results' => session('email_validation_results', []),
            'input' => session('email_validation_input', ''),
            'subject' => session('bulk_email_subject', ''),
            'message' => session('bulk_email_message', ''),
            'sendSummary' => session('bulk_email_send_summary'),
        ]);
    }

    public function validateEmails(Request $request)
    {
        abort_unless($request->user()->isStaff(), 403);

        $input = $request->string('emails')->toString();
        $results = collect(preg_split('/\R+/', $input) ?: [])
            ->map(fn (string $email) => trim($email))
            ->filter()
            ->map(fn (string $email) => [
                'email' => $email,
                'valid' => filter_var($email, FILTER_VALIDATE_EMAIL) !== false,
            ])
            ->values()
            ->all();

        return back()
            ->with('email_validation_results', $results)
            ->with('email_validation_input', $input);
    }

    public function sendBulkEmails(Request $request): RedirectResponse
    {
        abort_unless($request->user()->isStaff(), 403);

        $data = $request->validate([
            'emails' => ['required', 'string'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:10000'],
        ]);

        $emails = collect(preg_split('/\R+/', $data['emails']) ?: [])
            ->map(fn (string $email) => trim($email))
            ->filter()
            ->unique()
            ->values();

        $validEmails = $emails
            ->filter(fn (string $email) => filter_var($email, FILTER_VALIDATE_EMAIL) !== false)
            ->values();

        if ($validEmails->isEmpty()) {
            return back()
                ->withErrors(['emails' => 'Enter at least one valid email address before sending.'])
                ->with('email_validation_input', $data['emails'])
                ->with('bulk_email_subject', $data['subject'])
                ->with('bulk_email_message', $data['message']);
        }

        if (blank(config('mail.mailers.smtp.username')) || blank(config('mail.mailers.smtp.password'))) {
            return back()
                ->withErrors(['emails' => 'SMTP authentication is required. Go to Admin Settings and enter the real SMTP username and password for support@nextgenpng.net before sending emails.'])
                ->with('email_validation_input', $data['emails'])
                ->with('bulk_email_subject', $data['subject'])
                ->with('bulk_email_message', $data['message']);
        }

        try {
            foreach ($validEmails as $email) {
                Mail::to($email)->send(new BulkEmailMessage($data['subject'], $data['message']));
            }
        } catch (\Throwable $exception) {
            return back()
                ->withErrors(['emails' => "Email sending failed: {$exception->getMessage()}"])
                ->with('email_validation_input', $data['emails'])
                ->with('bulk_email_subject', $data['subject'])
                ->with('bulk_email_message', $data['message']);
        }

        return back()
            ->with('email_validation_input', $data['emails'])
            ->with('bulk_email_subject', $data['subject'])
            ->with('bulk_email_message', $data['message'])
            ->with('bulk_email_send_summary', [
                'sent' => $validEmails->count(),
                'skipped' => $emails->count() - $validEmails->count(),
            ]);
    }
}
