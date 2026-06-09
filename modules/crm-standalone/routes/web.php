<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\Crm\CustomerController;
use App\Http\Controllers\Crm\CustomerSubscriptionController;
use App\Http\Controllers\Crm\DashboardController;
use App\Http\Controllers\Crm\DomainHostingRequestController;
use App\Http\Controllers\Crm\UserManagementController;
use Illuminate\Support\Facades\Storage;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::get('storage/branding/{filename}', function (string $filename) {
    abort_if(str_contains($filename, '/') || str_contains($filename, '\\'), 404);

    return Storage::disk('public')->response("branding/{$filename}");
})->where('filename', '[A-Za-z0-9._-]+')->name('branding.logo');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('domains', [DashboardController::class, 'domains'])->name('domains');
    Route::get('renewals', [DashboardController::class, 'renewals'])->name('renewals');
    Route::post('renewals/update', [DashboardController::class, 'updateRenewals'])->name('renewals.update');
    Route::get('add-customer', [CustomerController::class, 'create'])->name('customers.create');
    Route::get('support-requests', [DomainHostingRequestController::class, 'support'])->name('support-requests');
    Route::get('support-requests/{hosting_request}', [DomainHostingRequestController::class, 'show'])->name('support-requests.show');
    Route::get('domain-registrations', [DomainHostingRequestController::class, 'registrations'])->name('domain-registrations');
    Route::get('domain-registrations/{hosting_request}', [DomainHostingRequestController::class, 'show'])->name('domain-registrations.show');
    Route::get('bulk-email-validator', [DashboardController::class, 'bulkEmailValidator'])->name('bulk-email-validator');
    Route::post('bulk-email-validator', [DashboardController::class, 'validateEmails'])->name('bulk-email-validator.validate');
    Route::post('bulk-email-validator/send', [DashboardController::class, 'sendBulkEmails'])->name('bulk-email-validator.send');
    Route::get('admin-settings', [UserManagementController::class, 'legacySettings'])->name('admin-settings');
    Route::patch('admin-settings', [UserManagementController::class, 'updateLegacySettings'])->name('admin-settings.update');
    Route::resource('subscriptions', CustomerSubscriptionController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::post('subscriptions/{subscription}/payments', [CustomerSubscriptionController::class, 'storePayment'])->name('subscriptions.payments.store');
    Route::post('subscriptions/{subscription}/credits', [CustomerSubscriptionController::class, 'storeCredit'])->name('subscriptions.credits.store');
    Route::get('subscription-payments/{payment}/file', [CustomerSubscriptionController::class, 'paymentFile'])->name('subscriptions.payments.file');
    Route::resource('customers', CustomerController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('hosting-requests', DomainHostingRequestController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('users', UserManagementController::class)->only(['index', 'store', 'update', 'destroy']);
});

require __DIR__.'/settings.php';
