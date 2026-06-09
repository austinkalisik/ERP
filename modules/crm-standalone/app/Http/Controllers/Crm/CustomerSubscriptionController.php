<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerSubscription;
use App\Models\SubscriptionPayment;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CustomerSubscriptionController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->isStaff(), 403);

        $subscriptions = CustomerSubscription::query()
            ->with([
                'customer:id,company_name,contact_name,email,phone,status',
                'payments' => fn ($query) => $query->latest()->limit(5),
                'credits' => fn ($query) => $query->latest()->limit(5),
            ])
            ->orderByRaw('expires_at is null')
            ->orderBy('expires_at')
            ->latest()
            ->get()
            ->map(fn (CustomerSubscription $subscription) => $this->serializeSubscription($subscription));

        return Inertia::render('subscriptions/index', [
            'customers' => Customer::query()
                ->orderBy('company_name')
                ->get(['id', 'company_name', 'contact_name', 'email']),
            'serviceTypes' => CustomerSubscription::SERVICE_TYPES,
            'subscriptions' => $subscriptions,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->isStaff(), 403);

        CustomerSubscription::create($this->validatedSubscription($request));

        return back()->with('success', 'Subscription created.');
    }

    public function update(Request $request, CustomerSubscription $subscription): RedirectResponse
    {
        abort_unless($request->user()->isStaff(), 403);

        $subscription->update($this->validatedSubscription($request));

        return back()->with('success', 'Subscription updated.');
    }

    public function destroy(Request $request, CustomerSubscription $subscription): RedirectResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $subscription->delete();

        return back()->with('success', 'Subscription deleted.');
    }

    public function storePayment(Request $request, CustomerSubscription $subscription): RedirectResponse
    {
        abort_unless($request->user()->isStaff(), 403);

        $data = $request->validate([
            'paid_at' => ['nullable', 'date_format:Y-m-d'],
            'period_start' => ['nullable', 'date_format:Y-m-d'],
            'period_end' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:period_start'],
            'amount' => ['required', 'numeric', 'min:0', 'max:999999999.99'],
            'payment_reference' => ['nullable', 'string', 'max:255'],
            'invoice_number' => ['nullable', 'string', 'max:255'],
            'document_type' => ['required', Rule::in(['invoice', 'receipt', 'contract', 'sla', 'purchase_order', 'payment_proof', 'other'])],
            'attachment' => [
                'nullable',
                'file',
                'max:10240',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $extension = strtolower((string) $value?->getClientOriginalExtension());

                    if (! in_array($extension, ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'], true)) {
                        $fail('The attachment must be a PDF, image, Word, or Excel file.');
                    }
                },
            ],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $data['file_path'] = $file->store('subscription-payments', 'public');
            $data['file_name'] = $file->getClientOriginalName();
            $data['file_mime'] = $file->getClientMimeType();
            $data['file_size'] = $file->getSize();
        }

        $subscription->payments()->create($data);

        return back()->with('success', 'Payment saved.');
    }

    public function storeCredit(Request $request, CustomerSubscription $subscription): RedirectResponse
    {
        abort_unless($request->user()->isStaff(), 403);

        $data = $request->validate([
            'starts_at' => ['required', 'date_format:Y-m-d'],
            'ends_at' => ['required', 'date_format:Y-m-d', 'after_or_equal:starts_at'],
            'amount' => ['nullable', 'numeric', 'min:0', 'max:999999999.99'],
            'reason' => ['required', 'string', 'max:5000'],
        ]);

        $start = CarbonImmutable::parse($data['starts_at'])->startOfMonth();
        $end = CarbonImmutable::parse($data['ends_at'])->startOfMonth();
        $months = $start->diffInMonths($end) + 1;

        if ($subscription->expires_at) {
            $subscription->expires_at = $subscription->expires_at->copy()->addMonthsNoOverflow($months);
            $subscription->save();
            $data['applied_to_expires_at'] = $subscription->expires_at->toDateString();
        }

        $data['months'] = $months;
        $subscription->credits()->create($data);

        return back()->with('success', "{$months} month credit saved.");
    }

    public function paymentFile(Request $request, SubscriptionPayment $payment): StreamedResponse
    {
        abort_unless($request->user()->isStaff(), 403);
        abort_unless($payment->file_path && Storage::disk('public')->exists($payment->file_path), 404);

        return Storage::disk('public')->download($payment->file_path, $payment->file_name);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedSubscription(Request $request): array
    {
        return $request->validate([
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'service_type' => ['required', Rule::in(array_keys(CustomerSubscription::SERVICE_TYPES))],
            'service_name' => ['nullable', 'string', 'max:255'],
            'reference' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in(['active', 'suspended', 'cancelled', 'expired'])],
            'starts_at' => ['nullable', 'date_format:Y-m-d'],
            'expires_at' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:starts_at'],
            'renewal_cycle' => ['required', Rule::in(['monthly', 'quarterly', 'yearly', 'custom'])],
            'amount' => ['nullable', 'numeric', 'min:0', 'max:999999999.99'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeSubscription(CustomerSubscription $subscription): array
    {
        return [
            'id' => $subscription->id,
            'customer_id' => $subscription->customer_id,
            'service_type' => $subscription->service_type,
            'service_label' => $subscription->serviceLabel(),
            'service_name' => $subscription->service_name,
            'reference' => $subscription->reference,
            'status' => $subscription->status,
            'starts_at' => optional($subscription->starts_at)->toDateString(),
            'expires_at' => optional($subscription->expires_at)->toDateString(),
            'renewal_cycle' => $subscription->renewal_cycle,
            'amount' => $subscription->amount,
            'notes' => $subscription->notes,
            'customer' => $subscription->customer,
            'payments' => $subscription->payments->map(fn (SubscriptionPayment $payment) => [
                'id' => $payment->id,
                'paid_at' => optional($payment->paid_at)->toDateString(),
                'period_start' => optional($payment->period_start)->toDateString(),
                'period_end' => optional($payment->period_end)->toDateString(),
                'amount' => $payment->amount,
                'payment_reference' => $payment->payment_reference,
                'invoice_number' => $payment->invoice_number,
                'document_type' => $payment->document_type ?? 'invoice',
                'file_name' => $payment->file_name,
                'file_url' => $payment->file_path ? route('subscriptions.payments.file', $payment) : null,
                'notes' => $payment->notes,
            ]),
            'credits' => $subscription->credits->map(fn ($credit) => [
                'id' => $credit->id,
                'starts_at' => optional($credit->starts_at)->toDateString(),
                'ends_at' => optional($credit->ends_at)->toDateString(),
                'months' => $credit->months,
                'amount' => $credit->amount,
                'applied_to_expires_at' => optional($credit->applied_to_expires_at)->toDateString(),
                'reason' => $credit->reason,
            ]),
        ];
    }
}
