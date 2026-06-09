<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\AssignmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReceiverController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UserController;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Support\Facades\Route;

Route::middleware('web')->group(function () {
    Route::get('/csrf-token', function () {
        return response()
            ->json(['token' => csrf_token()])
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate');
    });

    Route::post('/login', [AuthController::class, 'apiLogin']);
    Route::post('/logout', [AuthController::class, 'apiLogout']);

    Route::middleware('auth')->group(function () {
        Route::get('/me', [ProfileController::class, 'apiMe']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::delete('/profile/photo', [ProfileController::class, 'deletePhoto']);

        Route::get('/dashboard', [DashboardController::class, 'index']);

        Route::get('/items', [ItemController::class, 'index']);
        Route::get('/items/depreciation-report', [ItemController::class, 'depreciationReport']);
        Route::get('/items/{item}', [ItemController::class, 'show']);

        Route::get('/assignments', [AssignmentController::class, 'index']);
        Route::get('/assignments/report', [AssignmentController::class, 'report']);

        Route::get('/inventory', [InventoryController::class, 'index']);

        Route::get('/stock-movements', [StockMovementController::class, 'index']);
        Route::get('/stock-movements/types', [StockMovementController::class, 'types']);
        Route::get('/items/{item}/stock-movements', [StockMovementController::class, 'itemHistory']);
        Route::get('/activity-logs', [ActivityLogController::class, 'index']);

        Route::post('/users/stop-impersonation', [UserController::class, 'stopImpersonation']);
        Route::post('/users/{user}/impersonate', [UserController::class, 'impersonate']);
        Route::apiResource('users', UserController::class);

        Route::get('/notifications', [NotificationController::class, 'apiIndex']);
        Route::get('/notifications/stats', [NotificationController::class, 'stats']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::delete('/notifications/read', [NotificationController::class, 'clearRead']);
        Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);
        Route::patch('/notifications/{id}/unread', [NotificationController::class, 'markUnread']);
        Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);
        Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

        Route::get('/settings', [SettingController::class, 'index']);
        Route::get('/settings/branding/logo/file', [SettingController::class, 'showLogo']);

        Route::middleware(RoleMiddleware::class.':admin,manager,asset_officer,procurement_officer')->group(function () {
            Route::post('/items', [ItemController::class, 'store']);
            Route::put('/items/{item}', [ItemController::class, 'update']);
            Route::delete('/items/{item}', [ItemController::class, 'destroy']);
            Route::post('/items/{item}/retire', [ItemController::class, 'retire']);

            Route::post('/assignments', [AssignmentController::class, 'store']);
            Route::put('/assignments/{assignment}/return', [AssignmentController::class, 'returnItem']);

            Route::post('/inventory/{item}/stock-in', [InventoryController::class, 'stockIn']);
            Route::post('/inventory/{item}/stock-out', [InventoryController::class, 'stockOut']);

            Route::post('/items/{item}/stock-in', [StockMovementController::class, 'stockIn']);
            Route::post('/items/{item}/stock-out', [StockMovementController::class, 'stockOut']);
            Route::post('/items/{item}/stock-adjustment', [StockMovementController::class, 'adjustment']);
            Route::post('/items/{item}/stock-return', [StockMovementController::class, 'stockReturn']);

            Route::apiResource('categories', CategoryController::class)->except(['index', 'show']);
            Route::apiResource('departments', DepartmentController::class)->except(['index', 'show']);
            Route::apiResource('receivers', ReceiverController::class)->except(['index', 'show']);
            Route::apiResource('suppliers', SupplierController::class)->except(['index', 'show']);
        });

        Route::get('/categories', [CategoryController::class, 'index']);
        Route::get('/categories/{category}', [CategoryController::class, 'show']);
        Route::get('/departments', [DepartmentController::class, 'index']);
        Route::get('/departments/{department}', [DepartmentController::class, 'show']);
        Route::get('/receivers', [ReceiverController::class, 'index']);
        Route::get('/receivers/{receiver}', [ReceiverController::class, 'show']);
        Route::get('/suppliers', [SupplierController::class, 'index']);
        Route::get('/suppliers/{supplier}', [SupplierController::class, 'show']);

        Route::middleware(RoleMiddleware::class.':admin')->group(function () {
            Route::post('/settings/branding/logo', [SettingController::class, 'uploadLogo']);
            Route::delete('/settings/branding/logo', [SettingController::class, 'deleteLogo']);
            Route::put('/settings/{key}', [SettingController::class, 'update']);
        });
    });
});
