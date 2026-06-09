<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\DomainHostingRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DomainHostingRequestController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->isStaff(), 403);

        return Inertia::render('hosting-requests/index', [
            'requests' => DomainHostingRequest::with(['customer:id,company_name', 'assignee:id,name'])
                ->latest()
                ->get(),
            'customers' => Customer::orderBy('company_name')->get(['id', 'company_name']),
            'staff' => User::whereIn('role', ['admin', 'staff'])->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function support(Request $request): Response
    {
        abort_unless($request->user()->isStaff(), 403);

        $requests = DomainHostingRequest::with(['customer:id,company_name,contact_name', 'assignee:id,name'])
            ->supportServices()
            ->latest()
            ->get()
            ->map(fn (DomainHostingRequest $request) => [
                'id' => $request->id,
                'sr_number' => now()->format('ymd').str_pad((string) $request->id, 3, '0', STR_PAD_LEFT),
                'date_received' => optional($request->created_at)->format('d/m/Y'),
                'subject' => str_replace('_', ' ', $request->service_type),
                'domain_name' => $request->domain_name,
                'contact_name' => $request->customer?->contact_name ?? 'Jerome Natividad',
                'assignee_name' => $request->assignee?->name ?? 'Unassigned',
                'status' => match ($request->status) {
                    'completed' => 'Resolved',
                    'cancelled' => 'Rejected',
                    default => 'Open',
                },
                'read' => 'Yes',
                'href' => route('support-requests.show', $request),
            ]);

        return Inertia::render('support/index', [
            'requests' => $requests,
        ]);
    }

    public function registrations(Request $request): Response
    {
        abort_unless($request->user()->isStaff(), 403);

        $registrations = DomainHostingRequest::with('customer:id,company_name,contact_name')
            ->domainRegistrations()
            ->latest()
            ->get()
            ->map(fn (DomainHostingRequest $request) => [
                'id' => $request->id,
                'domain_name' => $request->domain_name,
                'company_name' => $request->customer?->company_name ?? 'Unknown',
                'contact_name' => $request->customer?->contact_name ?? 'Unknown',
                'status' => match ($request->status) {
                    'completed' => 'Closed',
                    'cancelled' => 'Cancelled',
                    default => 'Open',
                },
                'read' => 'Yes',
                'href' => route('domain-registrations.show', $request),
            ]);

        return Inertia::render('registrations/index', [
            'registrations' => $registrations,
        ]);
    }

    public function show(Request $request, DomainHostingRequest $hostingRequest): Response
    {
        abort_unless($request->user()->isStaff(), 403);

        $hostingRequest->load(['customer', 'assignee:id,name,email']);

        return Inertia::render('support/show', [
            'request' => $hostingRequest,
            'srNumber' => now()->format('ymd').str_pad((string) $hostingRequest->id, 3, '0', STR_PAD_LEFT),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        if (! $request->user()->isStaff()) {
            abort_if($request->user()->customer_id !== (int) $data['customer_id'], 403);
            $data['status'] = 'new';
            $data['assigned_to'] = null;
            $data['quoted_amount'] = null;
            $data['internal_notes'] = null;
        }

        DomainHostingRequest::create($data);

        return back()->with('success', 'Domain hosting request saved.');
    }

    public function update(Request $request, DomainHostingRequest $hostingRequest): RedirectResponse
    {
        abort_unless($request->user()->isStaff(), 403);

        $hostingRequest->update($this->validated($request));

        return back()->with('success', 'Domain hosting request updated.');
    }

    public function destroy(Request $request, DomainHostingRequest $hostingRequest): RedirectResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $hostingRequest->delete();

        return back()->with('success', 'Domain hosting request deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'customer_id' => ['required', 'exists:customers,id'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'domain_name' => ['required', 'string', 'max:255'],
            'service_type' => ['required', Rule::in(['domain_registration', 'website_hosting', 'email_hosting', 'email_antispam', 'domain_hosting', 'ssl', 'domain_transfer', 'isp_connectivity', 'network_infrastructure', 'cctv_security', 'document_management', 'vehicle_tracking', 'audio_visual', 'web_app_development', 'support_contract'])],
            'plan' => ['required', Rule::in(['basic', 'standard', 'value', 'premium', 'starter', 'business', 'enterprise', 'custom'])],
            'status' => ['required', Rule::in(['new', 'reviewing', 'quoted', 'approved', 'provisioning', 'completed', 'cancelled'])],
            'requested_start_date' => ['nullable', 'date'],
            'renewal_date' => ['nullable', 'date'],
            'quoted_amount' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'requirements' => ['nullable', 'string', 'max:5000'],
            'internal_notes' => ['nullable', 'string', 'max:5000'],
        ]);
    }
}
