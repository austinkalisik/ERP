<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->isStaff(), 403);

        $status = $request->string('status')->toString();
        $allowedStatuses = ['lead', 'active', 'inactive', 'suspended'];

        return Inertia::render('customers/index', [
            'customers' => Customer::query()
                ->when(in_array($status, $allowedStatuses, true), fn ($query) => $query->where('status', $status))
                ->withCount('domainHostingRequests')
                ->latest()
                ->get(),
            'statusFilter' => in_array($status, $allowedStatuses, true) ? $status : null,
        ]);
    }

    public function create(Request $request): Response
    {
        abort_unless($request->user()->isStaff(), 403);

        return Inertia::render('customers/create');
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->isStaff(), 403);

        Customer::create($this->validated($request));

        return back()->with('success', 'Customer created.');
    }

    public function update(Request $request, Customer $customer): RedirectResponse
    {
        abort_unless($request->user()->isStaff(), 403);

        $customer->update($this->validated($request, $customer));

        return back()->with('success', 'Customer updated.');
    }

    public function destroy(Request $request, Customer $customer): RedirectResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $customer->delete();

        return back()->with('success', 'Customer deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Customer $customer = null): array
    {
        return $request->validate([
            'company_name' => ['required', 'string', 'max:255'],
            'contact_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('customers')->ignore($customer)],
            'phone' => ['nullable', 'string', 'max:50'],
            'industry' => ['nullable', 'string', 'max:120'],
            'status' => ['required', Rule::in(['lead', 'active', 'inactive', 'suspended'])],
            'website' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'next_follow_up_at' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:2000-01-01', 'before_or_equal:2099-12-31'],
        ]);
    }
}
