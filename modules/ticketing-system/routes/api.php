<?php

use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\SlaController;
use App\Http\Controllers\Api\SystemStatusController;
use App\Http\Controllers\Api\TicketController;
use Illuminate\Support\Facades\Route;

Route::get('/dashboard', DashboardController::class);
Route::get('/reports', [ReportController::class, 'index']);
Route::get('/sla', [SlaController::class, 'index']);
Route::get('/settings', [SettingController::class, 'show']);
Route::put('/settings', [SettingController::class, 'update']);
Route::apiResource('clients', ClientController::class);
Route::apiResource('services', ServiceController::class);
Route::get('/system-statuses', [SystemStatusController::class, 'index']);
Route::put('/system-statuses/{systemStatus}', [SystemStatusController::class, 'update']);
Route::apiResource('tickets', TicketController::class);
Route::post('/tickets/{ticket}/comments', [TicketController::class, 'comment']);
Route::post('/tickets/{ticket}/attachments', [TicketController::class, 'attach']);
