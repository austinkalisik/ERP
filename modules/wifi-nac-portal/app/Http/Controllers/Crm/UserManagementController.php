<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->isAdmin(), 403);

        return Inertia::render('users/index', [
            'users' => User::with('customer:id,company_name')->latest()->get(),
            'customers' => Customer::orderBy('company_name')->get(['id', 'company_name']),
        ]);
    }

    public function legacySettings(Request $request): Response
    {
        abort_unless($request->user()->isStaff(), 403);

        return Inertia::render('admin-settings/index', [
            'users' => User::whereIn('role', ['admin', 'staff'])->latest()->get(),
            'settings' => [
                'email_from_address' => SystemSetting::getValue('email_from_address', config('mail.from.address', 'support@nextgenpng.net')),
                'email_from_name' => SystemSetting::getValue('email_from_name', config('mail.from.name', 'NextGen Support')),
                'mail_host' => SystemSetting::getValue('mail_host', config('mail.mailers.smtp.host', 'mail.nextgenpng.net')),
                'mail_port' => SystemSetting::getValue('mail_port', (string) config('mail.mailers.smtp.port', 25)),
                'mail_scheme' => SystemSetting::getValue('mail_scheme', (string) config('mail.mailers.smtp.scheme', 'smtp')),
                'mail_username' => SystemSetting::getValue('mail_username', (string) config('mail.mailers.smtp.username', '')),
                'send_email_user_ids' => json_decode(SystemSetting::getValue('send_email_user_ids', '[]') ?? '[]', true),
                'brand_name' => SystemSetting::getValue('brand_name', config('app.name')),
                'brand_logo_url' => SystemSetting::getBrandLogoUrl() ?? '',
            ],
        ]);
    }

    public function updateLegacySettings(Request $request): RedirectResponse
    {
        abort_unless($request->user()->isStaff(), 403);

        $data = $request->validate([
            'email_from_address' => ['required', 'email', 'max:255'],
            'email_from_name' => ['required', 'string', 'max:255'],
            'mail_host' => ['required', 'string', 'max:255'],
            'mail_port' => ['required', 'integer', 'min:1', 'max:65535'],
            'mail_scheme' => ['nullable', Rule::in(['', 'smtp', 'smtps'])],
            'mail_username' => ['nullable', 'string', 'max:255'],
            'mail_password' => ['nullable', 'string', 'max:255'],
            'send_email_user_ids' => ['array'],
            'send_email_user_ids.*' => ['integer', 'exists:users,id'],
            'brand_name' => ['required', 'string', 'max:80'],
            'brand_logo' => ['nullable', 'image', 'max:2048'],
        ]);

        SystemSetting::setValue('email_from_address', (string) $data['email_from_address']);
        SystemSetting::setValue('email_from_name', (string) $data['email_from_name']);
        SystemSetting::setValue('mail_host', (string) $data['mail_host']);
        SystemSetting::setValue('mail_port', (string) $data['mail_port']);
        SystemSetting::setValue('mail_scheme', (string) ($data['mail_scheme'] ?? 'smtp'));
        SystemSetting::setValue('mail_username', (string) ($data['mail_username'] ?? ''));

        if (filled($data['mail_password'] ?? null)) {
            SystemSetting::setValue('mail_password', (string) $data['mail_password']);
        }

        SystemSetting::setValue('send_email_user_ids', json_encode($data['send_email_user_ids'] ?? []));
        SystemSetting::setValue('brand_name', $data['brand_name']);

        if ($request->hasFile('brand_logo')) {
            $path = $request->file('brand_logo')->store('branding', 'public');
            SystemSetting::setValue('brand_logo_url', route('branding.logo', ['filename' => basename($path)], false));
        }

        return back()->with('success', 'Admin settings saved.');
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        User::create($this->validated($request) + ['password' => $request->string('password')->toString()]);

        return back()->with('success', 'User created.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        abort_unless($request->user()->isAdmin(), 403);

        $data = $this->validated($request, $user);

        if (blank($data['password'] ?? null)) {
            unset($data['password']);
        }

        $user->update($data);

        return back()->with('success', 'User updated.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        abort_unless($request->user()->isAdmin(), 403);
        abort_if($request->user()->is($user), 422, 'You cannot delete your own account.');

        $user->delete();

        return back()->with('success', 'User deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?User $user = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user)],
            'phone' => ['nullable', 'string', 'max:50'],
            'role' => ['required', Rule::in(['admin', 'staff', 'customer'])],
            'customer_id' => ['nullable', 'required_if:role,customer', 'exists:customers,id'],
            'is_active' => ['boolean'],
            'password' => [$user ? 'nullable' : 'required', 'string', 'min:8'],
        ]);
    }
}
