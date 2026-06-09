<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\IntegrationSettingController;
use App\Http\Controllers\Api\MaintenanceController;
use App\Http\Controllers\Api\ReadingController;
use App\Http\Controllers\Api\ReportController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard/summary', DashboardController::class);
    Route::apiResource('devices', DeviceController::class);
    Route::get('/events', [EventController::class, 'index']);
    Route::get('/events/{event}', [EventController::class, 'show']);
    Route::post('/events/{event}/acknowledge', [EventController::class, 'acknowledge'])->middleware('role:admin,supervisor,operator,technician');
    Route::get('/device-readings', [ReadingController::class, 'index']);
    Route::apiResource('maintenance', MaintenanceController::class);
    Route::get('/integration-settings', [IntegrationSettingController::class, 'index']);
    Route::patch('/integration-settings/{integrationSetting}', [IntegrationSettingController::class, 'update'])->middleware('role:admin,supervisor');
    Route::get('/reports/summary', [ReportController::class, 'summary']);
});
