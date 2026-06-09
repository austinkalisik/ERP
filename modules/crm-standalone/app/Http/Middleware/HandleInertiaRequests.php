<?php

namespace App\Http\Middleware;

use App\Models\Customer;
use App\Models\DomainHostingRequest;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $openSupportRequests = 0;
        $openDomainRegistrations = 0;

        if ($request->user()?->isStaff()) {
            $openSupportRequests = Cache::remember('legacy.open_support_requests', 30, fn () => DomainHostingRequest::query()
                ->supportServices()
                ->open()
                ->count());
            $openDomainRegistrations = Cache::remember('legacy.open_domain_registrations', 30, fn () => DomainHostingRequest::query()
                ->domainRegistrations()
                ->open()
                ->count());
        }

        $latestNotifications = $request->user()?->isStaff()
            ? Cache::remember('legacy.latest_notifications', 30, fn () => DomainHostingRequest::query()
                ->with('customer:id,company_name')
                ->where(function ($query) {
                    $query->supportServices()->orWhere(fn ($query) => $query->domainRegistrations());
                })
                ->open()
                ->latest()
                ->limit(6)
                ->get()
                ->map(fn (DomainHostingRequest $supportRequest) => [
                    'id' => $supportRequest->id,
                    'title' => $supportRequest->domain_name,
                    'customer' => $supportRequest->customer?->company_name ?? 'Unknown customer',
                    'status' => $supportRequest->status,
                    'href' => $supportRequest->service_type === 'domain_registration'
                        ? route('domain-registrations.show', $supportRequest)
                        : route('support-requests.show', $supportRequest),
                ])
                ->values())
            : collect();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'brand' => [
                'name' => SystemSetting::getValue('brand_name', config('app.name')),
                'logo_url' => SystemSetting::getBrandLogoUrl(),
            ],
            'auth' => [
                'user' => $request->user(),
            ],
            'legacy' => [
                'customers' => $request->user()?->isStaff()
                    ? Cache::remember('legacy.customer_count', 30, fn () => Customer::count())
                    : 0,
                'openSupportRequests' => $openSupportRequests,
                'openDomainRegistrations' => $openDomainRegistrations,
                'notifications' => $openSupportRequests + $openDomainRegistrations,
                'latestNotifications' => $latestNotifications,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
