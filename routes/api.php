<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| AUTH (PUBLIC)
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\Auth\AuthenticatedSessionController;

Route::post('/login',  [AuthenticatedSessionController::class, 'store']);
Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth:sanctum');

/*
|--------------------------------------------------------------------------
| AUTH CHECK (SPA)
|--------------------------------------------------------------------------
*/
Route::get('/me', function (Request $request) {
    $user = $request->user();
    $user->load(['permissions', 'employee']);
    return response()->json([
        'id'           => $user->id,
        'name'         => $user->name,
        'email'        => $user->email,
        'role'         => $user->role,
        'biometric_id' => optional($user->employee)->biometric_id,
        'permissions'  => $user->isSystemAdmin()
            ? ['*']
            : $user->getPermissionSlugs()->toArray(),
    ]);
})->middleware('auth:sanctum');

/*
|--------------------------------------------------------------------------
| CONTROLLERS
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\AttachmentController;
use App\Http\Controllers\NotificationsController;

/* ================= HRMS ================= */
use App\Http\Controllers\HRMS\EmployeeExportController;
use App\Http\Controllers\HRMS\AttendanceController;
use App\Http\Controllers\HRMS\ApplicationController;
use App\Http\Controllers\HRMS\EmploymentClassificationController;
use App\Http\Controllers\HRMS\LeaveTypeController;
use App\Http\Controllers\HRMS\PublicHolidayController;
use App\Http\Controllers\HRMS\EmployeeContributionController;
use App\Http\Controllers\HRMS\{
    EmploymentInformationController,
    PersonalInformationController,
    AccountInformationController,
    LeaveCreditsController,
    DeminimisController,
    ShiftController,
    HRMSDashboardController,
    DepartmentController,
    OvertimeTypeController
};

/* ================= PAYROLL ================= */
use App\Http\Controllers\Payroll\PayrollController;
use App\Http\Controllers\Payroll\PayrollEmployeeController;
use App\Http\Controllers\Payroll\PayslipController;
use App\Http\Controllers\Payroll\PayrollDashboardController;
use App\Http\Controllers\Payroll\CashAdvanceController;
use App\Http\Controllers\Payroll\PayrollSetupController;

/* ================= AIMS ================= */
use App\Http\Controllers\AIMS\AIMSDashboardController;
use App\Http\Controllers\AIMS\ItemController;
use App\Http\Controllers\AIMS\StockMovementController;
use App\Http\Controllers\AIMS\RequestOrderController;
use App\Http\Controllers\AIMS\SupplierController;
use App\Http\Controllers\AIMS\PurchaseRequestController;
use App\Http\Controllers\AIMS\CustomerController;
use App\Http\Controllers\AIMS\SalesOrderController;
use App\Http\Controllers\AIMS\GlAccountController;
use App\Http\Controllers\AIMS\InvoiceController;

use App\Http\Controllers\AIMS\PaymentTermController;

use App\Http\Controllers\AIMS\CategoryController;
use App\Http\Controllers\AIMS\UnitController;
use App\Http\Controllers\AIMS\WarehouseController;
use App\Http\Controllers\AIMS\StocktakeController;
use App\Http\Controllers\AIMS\ExchangeRateController;

/* ================= MOMS ================= */
use App\Http\Controllers\MOMS\MachineController;
use App\Http\Controllers\MOMS\OperatorController;
use App\Http\Controllers\MOMS\AssignmentController;
use App\Http\Controllers\MOMS\DERExportController;
use App\Http\Controllers\MOMS\DailyProductionReportController;
use App\Http\Controllers\MOMS\JobSiteController;
use App\Http\Controllers\MOMS\FuelTransactionController;
use App\Http\Controllers\MOMS\MOMSDashboardController;
use App\Http\Controllers\MOMS\Finance\FuelPricingController;
use App\Http\Controllers\MOMS\BreakdownController;
use App\Http\Controllers\MOMS\MaintenanceController;
use App\Http\Controllers\MOMS\OperationsController;
use App\Http\Controllers\MOMS\FleetController;
use App\Http\Controllers\MOMS\InventoryPartController;
use App\Http\Controllers\MOMS\ChecklistTemplateController;
use App\Http\Controllers\MOMS\TimeEntryController;
use App\Http\Controllers\MOMS\RepairCostController;
use App\Http\Controllers\MOMS\MachineAvailabilityController;

/* ================= CRM ================= */
use App\Http\Controllers\CRM\CRMDashboardController;
use App\Http\Controllers\CRM\ClientController;
use App\Http\Controllers\CRM\SubscriptionController;
use App\Http\Controllers\CRM\ServiceController;
use App\Http\Controllers\CRM\RenewalController;
use App\Http\Controllers\CRM\CRMReportController;
use App\Http\Controllers\CRM\DealController;

/* ================= REPORTS ================= */
use App\Http\Controllers\ReportsController;

/* ================= SETTINGS ================= */
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SecuritySettingController;
use App\Http\Controllers\Payroll\PayrollConfigController;

/*
|--------------------------------------------------------------------------
| PROTECTED ROUTES (AUTHENTICATED SPA)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::get('/profile',          [ProfileController::class, 'show']);
    Route::put('/profile',          [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);

    Route::post('/attachments/{type}/{id}',  [AttachmentController::class, 'store']);
    Route::get('/attachments/{id}/download', [AttachmentController::class, 'download']);
    Route::delete('/attachments/{id}',       [AttachmentController::class, 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | UNIFIED NOTIFICATIONS
    |--------------------------------------------------------------------------
    */
    Route::get('/notifications',            [NotificationsController::class, 'index']);
    Route::post('/notifications/read-all',  [NotificationsController::class, 'markAllAsRead']);
    Route::post('/notifications/{id}/read', [NotificationsController::class, 'markAsRead']);

    /*
    |--------------------------------------------------------------------------
    | SETTINGS — PUBLIC (all authenticated roles)
    | Read-only subset for formatting: timezone, currency, date_format etc.
    | Used by SettingsContext so non-admins get company formatting too.
    |--------------------------------------------------------------------------
    */
    Route::get('/settings/public', function () {
        $s = \App\Models\SystemSetting::first();
        return response()->json([
            'company_name' => $s?->company_name ?? '',
            'timezone'     => $s?->timezone     ?? 'Pacific/Port_Moresby',
            'currency'     => $s?->currency     ?? 'USD',
            'date_format'  => $s?->date_format  ?? 'MM/DD/YYYY',
            'language'     => $s?->language     ?? 'en',
            'theme'        => $s?->theme        ?? 'light',
        ]);
    });

    /*
    |--------------------------------------------------------------------------
    | PAYROLL - EMPLOYEE PAYSLIP ACCESS (UNIVERSAL)
    |--------------------------------------------------------------------------
    */
    Route::prefix('payroll')->group(function () {
        Route::get('/payslips/{biometric_id}', [PayslipController::class, 'index']);
        Route::get('/payslip/{id}',            [PayslipController::class, 'show']);
    });

    Route::prefix('payroll/settings')->group(function () {
        Route::get('/config', [PayrollConfigController::class, 'index']);
        Route::put('/config', [PayrollConfigController::class, 'update']);
    });

    /*
    |--------------------------------------------------------------------------
    | HRMS
    |--------------------------------------------------------------------------
    */
    Route::middleware([
        'role:system_admin,hr,dept_head,employee',
        'permission:access_hrms',
    ])
    ->prefix('hrms')
    ->group(function () {

            Route::apiResource('employment', EmploymentInformationController::class);
            Route::apiResource('personal', PersonalInformationController::class);
            Route::apiResource('account', AccountInformationController::class);
            Route::apiResource('leave-credits', LeaveCreditsController::class);
            Route::apiResource('deminimis', DeminimisController::class);
            Route::apiResource('shifts', ShiftController::class);
            Route::apiResource('departments', DepartmentController::class);
            Route::apiResource('employment-classifications', EmploymentClassificationController::class);


            Route::get('/deminimis/employee/{employeeId}', [DeminimisController::class, 'getByEmployee']);

            Route::get('/stats', [HRMSDashboardController::class, 'getStats'])
                ->middleware('role:system_admin,hr,dept_head');
            Route::get('/recent-employees', [HRMSDashboardController::class, 'getRecentEmployees']);
            Route::get('/department-distribution', [HRMSDashboardController::class, 'getDepartmentDistribution']);

            Route::get('/employees', [HRMSDashboardController::class, 'getEmployees'])
                ->middleware('role:system_admin,hr,dept_head');
            Route::get('/employee/{biometric_id}', [EmploymentInformationController::class, 'getEmployeeDetails']);

            Route::get('/export/employees/csv', [EmployeeExportController::class, 'exportCSV']);
            Route::get('/export/employees/pdf', [EmployeeExportController::class, 'exportPDF']);
            Route::get('/employee/{biometric_id}/export-cv', [EmployeeExportController::class, 'exportEmployeeCV']);

            Route::post('/employee/{biometric_id}/update-profile', [EmploymentInformationController::class, 'updateProfile']);
            Route::put('/employee/{biometric_id}/personal', [PersonalInformationController::class, 'updateByEmployee']);

            Route::get('/employee/{biometric_id}/leave-credits', [LeaveCreditsController::class, 'showByEmployee']);
            Route::put('/employee/{biometric_id}/leave-credits', [LeaveCreditsController::class, 'updateByEmployee']);

            Route::prefix('attendance')->group(function () {
                Route::get('{biometric_id}', [AttendanceController::class, 'index']);
                Route::post('{biometric_id}', [AttendanceController::class, 'store']);
                Route::post('{biometric_id}/absent', [AttendanceController::class, 'markAbsent']);
                Route::put('{id}', [AttendanceController::class, 'update']);
            });
            

            // ✅ APPLICATION ROUTES
            // Get all applications (for managers/HR)
            Route::get('/applications', [ApplicationController::class, 'getAllApplications']);
            
            // Get employee's own applications
            Route::get('/applications/{biometric_id}', [ApplicationController::class, 'index']);
            
            // Create new application
            Route::post('/applications/{biometric_id}', [ApplicationController::class, 'store']);
            
            // Get single application
            Route::get('/applications/show/{id}', [ApplicationController::class, 'show']);
            
            // Update application (approve/reject)
            Route::put('/applications/{id}', [ApplicationController::class, 'update']);
            
            // Delete application
            Route::delete('/applications/{id}', [ApplicationController::class, 'destroy']);
        });

        Route::apiResource('employment',                 EmploymentInformationController::class);
        Route::apiResource('personal',                   PersonalInformationController::class);
        Route::apiResource('account',                    AccountInformationController::class);
        Route::apiResource('leave-credits',              LeaveCreditsController::class);
        Route::apiResource('deminimis',                  DeminimisController::class);
        Route::apiResource('shifts',                     ShiftController::class);
        Route::apiResource('departments',                DepartmentController::class);
        Route::apiResource('employment-classifications', EmploymentClassificationController::class);
        Route::apiResource('leave-types',                LeaveTypeController::class);
        Route::apiResource('overtime-types',             OvertimeTypeController::class);
        Route::apiResource('public-holidays',            PublicHolidayController::class);

        Route::get('/deminimis/employee/{employeeId}', [DeminimisController::class, 'getByEmployee']);

        Route::get('/stats', [HRMSDashboardController::class, 'getStats'])
            ->middleware('role:system_admin,hr,dept_head');
        Route::get('/recent-employees',        [HRMSDashboardController::class, 'getRecentEmployees']);
        Route::get('/department-distribution', [HRMSDashboardController::class, 'getDepartmentDistribution']);

        Route::get('/employees', [HRMSDashboardController::class, 'getEmployees'])
            ->middleware('role:system_admin,hr,dept_head');
        Route::get('/employee/{biometric_id}', [EmploymentInformationController::class, 'getEmployeeDetails']);

        Route::get('/export/employees/csv',              [EmployeeExportController::class, 'exportCSV']);
        Route::get('/export/employees/pdf',              [EmployeeExportController::class, 'exportPDF']);
        Route::get('/employee/{biometric_id}/export-cv', [EmployeeExportController::class, 'exportEmployeeCV']);

        Route::post('/employee/{biometric_id}/update-profile', [EmploymentInformationController::class, 'updateProfile']);
        Route::put('/employee/{biometric_id}/personal',        [PersonalInformationController::class, 'updateByEmployee']);

        Route::get('/employee/{biometric_id}/leave-credits', [LeaveCreditsController::class, 'showByEmployee']);
        Route::put('/employee/{biometric_id}/leave-credits', [LeaveCreditsController::class, 'updateByEmployee']);

        Route::prefix('attendance')->group(function () {
            Route::get('{biometric_id}',          [AttendanceController::class, 'index']);
            Route::post('{biometric_id}',         [AttendanceController::class, 'store']);
            Route::post('{biometric_id}/absent',  [AttendanceController::class, 'markAbsent']);
            Route::post('{biometric_id}/holiday', [AttendanceController::class, 'markHoliday']);
            Route::put('{id}',                    [AttendanceController::class, 'update']);
        });

        Route::get('/applications',                 [ApplicationController::class, 'getAllApplications']);
        Route::get('/applications/{biometric_id}',  [ApplicationController::class, 'index']);
        Route::post('/applications/{biometric_id}', [ApplicationController::class, 'store']);
        Route::get('/applications/show/{id}',       [ApplicationController::class, 'show']);
        Route::put('/applications/{id}',            [ApplicationController::class, 'update']);
        Route::delete('/applications/{id}',         [ApplicationController::class, 'destroy']);

        Route::prefix('hrms')->group(function () {
            Route::get('contributions/{employee_id}', [EmployeeContributionController::class, 'index']);
            Route::post('contributions',              [EmployeeContributionController::class, 'bulkStore']);
            Route::middleware('role:system_admin,hr')->group(function () {
                Route::put('contributions/{id}',      [EmployeeContributionController::class, 'update']);
                Route::delete('contributions/{id}',   [EmployeeContributionController::class, 'destroy']);
            });
        });

        Route::get('contributions/{employee_id}',   [EmployeeContributionController::class, 'index']);
        Route::post('contributions',                [EmployeeContributionController::class, 'bulkStore']);
        Route::middleware('role:system_admin,hr')->group(function () {
            Route::put('contributions/{id}',        [EmployeeContributionController::class, 'update']);
            Route::delete('contributions/{id}',     [EmployeeContributionController::class, 'destroy']);
        });
    });

    /*
    |--------------------------------------------------------------------------
    | PAYROLL - ADMIN ACCESS
    |--------------------------------------------------------------------------
    */
    Route::middleware([
        'role:system_admin,hr',
        'permission:access_payroll',
    ])
    ->prefix('payroll')
    ->group(function () {

            Route::get('/dashboard-stats', [PayrollDashboardController::class, 'stats']);
            Route::post('/run', [PayrollController::class, 'runPayroll']);

            Route::get('/employees', [PayrollEmployeeController::class, 'index']);

            Route::post('/{id}/generate-payslip', [PayslipController::class, 'generate']);

            Route::put('/{id}/status', [PayrollController::class, 'updateStatus']);
            Route::post('/bulk-approve', [PayrollController::class, 'bulkApprove']);

            Route::get('/', [PayrollController::class, 'index']);
            Route::get('/{id}', [PayrollController::class, 'show']);
        
        Route::get('/dashboard-stats',        [PayrollDashboardController::class, 'stats']);
        Route::post('/run',                   [PayrollController::class, 'runPayroll']);
        Route::get('/employees',              [PayrollEmployeeController::class, 'index']);
        Route::post('/{id}/generate-payslip', [PayslipController::class, 'generate']);
        Route::put('/{id}/status',            [PayrollController::class, 'updateStatus']);
        Route::post('/bulk-approve',          [PayrollController::class, 'bulkApprove']);
        Route::get('/',                       [PayrollController::class, 'index']);

        Route::get('/cash-advances',                         [CashAdvanceController::class, 'index']);
        Route::get('/cash-advances/employee/{biometric_id}', [CashAdvanceController::class, 'getByEmployee']);
        Route::post('/cash-advances',                        [CashAdvanceController::class, 'store']);
        Route::put('/cash-advances/{id}/status',             [CashAdvanceController::class, 'updateStatus']);
        Route::delete('/cash-advances/{id}',                 [CashAdvanceController::class, 'destroy']);

        Route::prefix('setup')->group(function () {
            Route::get('/pay-dates',         [PayrollSetupController::class, 'indexPayDates']);
            Route::post('/pay-dates',        [PayrollSetupController::class, 'storePayDate']);
            Route::put('/pay-dates/{id}',    [PayrollSetupController::class, 'updatePayDate']);
            Route::delete('/pay-dates/{id}', [PayrollSetupController::class, 'destroyPayDate']);

            Route::get('/nasfund',           [PayrollSetupController::class, 'indexNasfund']);
            Route::post('/nasfund',          [PayrollSetupController::class, 'storeNasfund']);
            Route::put('/nasfund/{id}',      [PayrollSetupController::class, 'updateNasfund']);
            Route::delete('/nasfund/{id}',   [PayrollSetupController::class, 'destroyNasfund']);

            Route::get('/ncsl',              [PayrollSetupController::class, 'indexNcsl']);
            Route::post('/ncsl',             [PayrollSetupController::class, 'storeNcsl']);
            Route::put('/ncsl/{id}',         [PayrollSetupController::class, 'updateNcsl']);
            Route::delete('/ncsl/{id}',      [PayrollSetupController::class, 'destroyNcsl']);

            Route::get('/tax',               [PayrollSetupController::class, 'indexTax']);
            Route::post('/tax',              [PayrollSetupController::class, 'storeTax']);
            Route::put('/tax/{id}',          [PayrollSetupController::class, 'updateTax']);
            Route::delete('/tax/{id}',       [PayrollSetupController::class, 'destroyTax']);
        });

        Route::get('/{id}', [PayrollController::class, 'show']);
    });

    /*
    |--------------------------------------------------------------------------
    | AIMS
    |--------------------------------------------------------------------------
    */
    Route::middleware([
        'role:system_admin,aims_manager,aims_staff',
        'permission:access_aims',
    ])
    ->prefix('aims')
    ->group(function () {

        Route::get('/dashboard',                    [AIMSDashboardController::class, 'index']);
        Route::get('/dashboard/stock-distribution', [AIMSDashboardController::class, 'stockDistribution']);
        Route::get('/dashboard/low-stock-trend',    [AIMSDashboardController::class, 'lowStockTrend']);

        Route::get('/items',                   [ItemController::class, 'index']);
        Route::get('/items/{item}',            [ItemController::class, 'show']);
        Route::get('/items/low-stock/list',    [ItemController::class, 'lowStock']);
        Route::get('/items/out-of-stock/list', [ItemController::class, 'outOfStock']);
        Route::middleware('role:system_admin,aims_manager')->group(function () {
            Route::post('/items',          [ItemController::class, 'store']);
            Route::put('/items/{item}',    [ItemController::class, 'update']);
            Route::delete('/items/{item}', [ItemController::class, 'destroy']);
        });

        Route::get('/suppliers', [SupplierController::class, 'index']);
        Route::middleware('role:system_admin,aims_manager')->group(function () {
            Route::post('/suppliers',        [SupplierController::class, 'store']);
            Route::put('/suppliers/{id}',    [SupplierController::class, 'update']);
            Route::delete('/suppliers/{id}', [SupplierController::class, 'destroy']);
        });

        Route::get('/stock-movements',      [StockMovementController::class, 'index']);
        Route::get('/stock-movements/{id}', [StockMovementController::class, 'show']);
        Route::post('/stock-in',            [StockMovementController::class, 'stockIn']);
        Route::post('/stock-out',           [StockMovementController::class, 'stockOut']);

        Route::get('/purchase-requests',        [PurchaseRequestController::class, 'index']);
        Route::get('/purchase-requests/latest', [PurchaseRequestController::class, 'latest']);
        Route::post('/purchase-requests',       [PurchaseRequestController::class, 'store']);
        Route::get('/purchase-requests/{id}',   [PurchaseRequestController::class, 'show']);
        Route::middleware('role:system_admin,aims_manager')->group(function () {
            Route::post('/purchase-requests/{id}/approve', [PurchaseRequestController::class, 'approve']);
            Route::post('/purchase-requests/{id}/reject',  [PurchaseRequestController::class, 'reject']);
        });

        Route::middleware('role:system_admin,aims_manager')->group(function () {
            Route::get('/request-orders',               [RequestOrderController::class, 'index']);
            Route::post('/request-orders',              [RequestOrderController::class, 'store']);
            Route::get('/request-orders/{id}',          [RequestOrderController::class, 'show']);
            Route::post('/request-orders/{id}/approve', [RequestOrderController::class, 'approve']);
            Route::post('/request-orders/{id}/receive', [RequestOrderController::class, 'receive']);
            Route::post('/request-orders/{id}/cancel',  [RequestOrderController::class, 'cancel']);
               Route::get('/request-orders/verify/{id}',  [RequestOrderController::class, 'verify']);
        });


            //Invoice — 
            Route::middleware('role:system_admin,aims_manager')->group(function () {
            Route::get('/invoices',               [InvoiceController::class, 'index']);
            Route::post('/invoices',              [InvoiceController::class, 'store']);
            Route::get('/invoices/{id}',          [InvoiceController::class, 'show']);
            Route::post('invoices/{invoice}/approve', [InvoiceController::class, 'approve']);
            Route::put('invoices/{id}/cancel', [InvoiceController::class, 'cancel']);
            Route::post('invoices/{invoice}/post', [InvoiceController::class, 'post']);
            Route::get('/request-orders/verify/{id}',  [RequestOrderController::class, 'verify']);


        });


             //Payment Terms — 
            Route::middleware('role:system_admin,aims_manager')->group(function () {
            Route::get('/payment-terms',               [PaymentTermController::class, 'index']);
      

        });

         // Gl Accounts — 
        Route::middleware('role:system_admin,aims_manager')->group(function () {
          
            Route::get('/parents', [GlAccountController::class, 'parents']);
            Route::get('/gl-list', [GlAccountController::class, 'index']);
            Route::post('/gl-accounts', [GlAccountController::class, 'store']);
            Route::put('/gl-accounts/{id}',  [GlAccountController::class, 'update']);
            Route::delete('/gl-accounts/{id}', [GlAccountController::class, 'destroy']);
        });

        // Customers — manager only
        // ── Customers ──────────────────────────────────────────────────────
        Route::middleware('role:system_admin,aims_manager')->group(function () {
            Route::get('/customers',         [CustomerController::class, 'index']);
            Route::post('/customers',        [CustomerController::class, 'store']);
            Route::get('/customers/{id}',    [CustomerController::class, 'show']);
            Route::put('/customers/{id}',    [CustomerController::class, 'update']);
            Route::delete('/customers/{id}', [CustomerController::class, 'destroy']);
        });

        Route::middleware('role:system_admin,aims_manager')->group(function () {
            Route::get('/sales-orders',               [SalesOrderController::class, 'index']);
            Route::post('/sales-orders',              [SalesOrderController::class, 'store']);
            Route::get('/sales-orders/{id}',          [SalesOrderController::class, 'show']);
            Route::put('/sales-orders/{id}',          [SalesOrderController::class, 'update']);
            Route::delete('/sales-orders/{id}',       [SalesOrderController::class, 'destroy']);
            Route::post('/sales-orders/{id}/fulfill', [SalesOrderController::class, 'fulfill']);
        });

        Route::get('/categories', [CategoryController::class, 'index']);
        Route::middleware('role:system_admin,aims_manager')->group(function () {
            Route::post('/categories',        [CategoryController::class, 'store']);
            Route::put('/categories/{id}',    [CategoryController::class, 'update']);
            Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);
        });

        Route::get('/units', [UnitController::class, 'index']);
        Route::middleware('role:system_admin,aims_manager')->group(function () {
            Route::post('/units',        [UnitController::class, 'store']);
            Route::put('/units/{id}',    [UnitController::class, 'update']);
            Route::delete('/units/{id}', [UnitController::class, 'destroy']);
        });

        Route::get('/warehouses', [WarehouseController::class, 'index']);
        Route::middleware('role:system_admin,aims_manager')->group(function () {
            Route::post('/warehouses',        [WarehouseController::class, 'store']);
            Route::put('/warehouses/{id}',    [WarehouseController::class, 'update']);
            Route::delete('/warehouses/{id}', [WarehouseController::class, 'destroy']);
        });

        Route::get('/exchange-rate', [ExchangeRateController::class, 'show']);

        /*
        |----------------------------------------------------------------------
        | AIMS — Stocktaking / Cyclic Counts
        |----------------------------------------------------------------------
        */
        Route::get('/stocktake',                      [StocktakeController::class, 'index']);
        Route::post('/stocktake',                     [StocktakeController::class, 'store']);
        Route::get('/stocktake/{id}',                 [StocktakeController::class, 'show']);
        Route::post('/stocktake/{id}/count',          [StocktakeController::class, 'submitCounts']);
        Route::post('/stocktake/{id}/complete',       [StocktakeController::class, 'complete']);
        Route::get('/stocktake/{id}/variance-report', [StocktakeController::class, 'varianceReport']);
        Route::middleware('role:system_admin,aims_manager')->group(function () {
            Route::post('/stocktake/{id}/approve', [StocktakeController::class, 'approve']);
            Route::delete('/stocktake/{id}',       [StocktakeController::class, 'destroy']);
        });
    });

    Route::middleware(['role:system_admin,moms_manager,moms_supervisor'])
        ->prefix('aims')
        ->group(function () {
            Route::get('/items-for-moms', [ItemController::class, 'index']);
        });

    /*
    |--------------------------------------------------------------------------
    | MOMS
    |--------------------------------------------------------------------------
    */
    Route::middleware([
        'role:system_admin,moms_manager,moms_supervisor,moms_operator',
        'permission:access_moms',
    ])
    ->prefix('moms')
    ->group(function () {

        Route::middleware('role:system_admin,moms_manager,moms_supervisor')->group(function () {
            Route::get('/stats',               [MOMSDashboardController::class, 'stats']);
            Route::get('/machine-utilization', [MOMSDashboardController::class, 'machineUtilization']);
            Route::get('/downtime-overview',   [MOMSDashboardController::class, 'downtimeOverview']);
            Route::get('/fuel-consumption',    [MOMSDashboardController::class, 'fuelConsumption']);
        });

        Route::get('/machines',           [MachineController::class, 'index']);
        Route::get('/machines/{machine}', [MachineController::class, 'show'])
            ->middleware('role:system_admin,moms_manager,moms_supervisor');
        Route::middleware('role:system_admin,moms_manager')->group(function () {
            Route::post('/machines',             [MachineController::class, 'store']);
            Route::put('/machines/{machine}',    [MachineController::class, 'update']);
            Route::delete('/machines/{machine}', [MachineController::class, 'destroy']);
        });

        Route::get('/operators',                 [OperatorController::class, 'index']);
        Route::get('/operators/available-users', [OperatorController::class, 'availableUsers'])
            ->middleware('role:system_admin,moms_manager');
        Route::get('/operators/{operator}',      [OperatorController::class, 'show'])
            ->middleware('role:system_admin,moms_manager,moms_supervisor');
        Route::middleware('role:system_admin,moms_manager')->group(function () {
            Route::post('/operators',              [OperatorController::class, 'store']);
            Route::put('/operators/{operator}',    [OperatorController::class, 'update']);
            Route::delete('/operators/{operator}', [OperatorController::class, 'destroy']);
        });

        Route::get('/assignments',              [AssignmentController::class, 'index']);
        Route::get('/assignments/{assignment}', [AssignmentController::class, 'show']);
        Route::middleware('role:system_admin,moms_manager,moms_supervisor')->group(function () {
            Route::post('/assignments',                [AssignmentController::class, 'store']);
            Route::put('/assignments/{assignment}',    [AssignmentController::class, 'update']);
            Route::post('/assignments/{id}/complete',  [AssignmentController::class, 'complete']);
            Route::get('/assignments/{id}/export-der', [DERExportController::class, 'export']);
        });
        Route::delete('/assignments/{assignment}', [AssignmentController::class, 'destroy'])
            ->middleware('role:system_admin,moms_manager');

        Route::middleware('role:system_admin,moms_manager,moms_supervisor')
            ->group(function () {
                Route::apiResource('job-sites', JobSiteController::class);
            });

        Route::middleware('role:system_admin,moms_manager,moms_supervisor')->group(function () {
            Route::get('/fuel-transactions',       [FuelTransactionController::class, 'index']);
            Route::get('/fuel-transactions/{id}',  [FuelTransactionController::class, 'show']);
            Route::get('/fuel-stats',              [FuelTransactionController::class, 'stats']);
            Route::get('/fuel-consumption-report', [FuelTransactionController::class, 'consumptionReport']);
            Route::post('/fuel-transactions',      [FuelTransactionController::class, 'store']);
            Route::put('/fuel-transactions/{id}',  [FuelTransactionController::class, 'update']);
        });
        Route::delete('/fuel-transactions/{id}', [FuelTransactionController::class, 'destroy'])
            ->middleware('role:system_admin,moms_manager');

        Route::get('/breakdown-stats',        [BreakdownController::class, 'stats']);
        Route::get('/breakdowns',             [BreakdownController::class, 'index']);
        Route::get('/breakdowns/{breakdown}', [BreakdownController::class, 'show']);
        Route::post('/breakdowns',            [BreakdownController::class, 'store']);
        Route::put('/breakdowns/{breakdown}', [BreakdownController::class, 'update'])
            ->middleware('role:system_admin,moms_manager,moms_supervisor');
        Route::delete('/breakdowns/{breakdown}', [BreakdownController::class, 'destroy'])
            ->middleware('role:system_admin,moms_manager');

        Route::prefix('maintenance')->group(function () {
            Route::middleware('role:system_admin,moms_manager,moms_supervisor')->group(function () {
                Route::get('/stats',     [MaintenanceController::class, 'stats']);
                Route::get('/logs',      [MaintenanceController::class, 'logs']);
                Route::get('/logs/{id}', [MaintenanceController::class, 'showLog']);
                Route::post('/logs',     [MaintenanceController::class, 'storeLog']);
                Route::put('/logs/{id}', [MaintenanceController::class, 'updateLog']);

                Route::get('/schedules',      [MaintenanceController::class, 'schedules']);
                Route::get('/schedules/{id}', [MaintenanceController::class, 'showSchedule']);
                Route::post('/schedules',     [MaintenanceController::class, 'storeSchedule']);
                Route::put('/schedules/{id}', [MaintenanceController::class, 'updateSchedule']);
            });

            Route::get('/notifications',            [MaintenanceController::class, 'notifications']);
            Route::post('/notifications/read-all',  [MaintenanceController::class, 'markAllNotificationsRead']);
            Route::post('/notifications/{id}/read', [MaintenanceController::class, 'markNotificationRead']);

            Route::delete('/schedules/{id}', [MaintenanceController::class, 'destroySchedule'])
                ->middleware('role:system_admin,moms_manager');
        });

        Route::prefix('operations')->group(function () {
            Route::post('/start-shift',    [OperationsController::class, 'startShift']);
            Route::get('/daily',           [OperationsController::class, 'daily']);
            Route::get('/departments',     [OperationsController::class, 'departments']);
            Route::get('/stats',           [OperationsController::class, 'stats'])
                ->middleware('role:system_admin,moms_manager,moms_supervisor');
            Route::get('/',                [OperationsController::class, 'index']);
            Route::get('/recent',          [OperationsController::class, 'recent']);
            Route::get('/{id}',            [OperationsController::class, 'show']);
            Route::post('/{id}/end-shift', [OperationsController::class, 'endShift']);
            Route::post('/{id}/approve',   [OperationsController::class, 'approve'])
                ->middleware('role:system_admin,moms_manager,moms_supervisor');
            Route::put('/{id}',            [OperationsController::class, 'update'])
                ->middleware('role:system_admin,moms_manager,moms_supervisor');
            Route::delete('/{id}',         [OperationsController::class, 'destroy'])
                ->middleware('role:system_admin,moms_manager');
        });

        Route::prefix('checklist-templates')->group(function () {
            Route::get('/categories',             [ChecklistTemplateController::class, 'categories']);
            Route::get('/by-category/{category}', [ChecklistTemplateController::class, 'byCategory']);
            Route::get('/',                       [ChecklistTemplateController::class, 'index']);
            Route::middleware('role:system_admin,moms_manager')->group(function () {
                Route::post('/bulk',   [ChecklistTemplateController::class, 'bulk']);
                Route::post('/',       [ChecklistTemplateController::class, 'store']);
                Route::put('/{id}',    [ChecklistTemplateController::class, 'update']);
                Route::delete('/{id}', [ChecklistTemplateController::class, 'destroy']);
            });
        });

        Route::middleware('role:system_admin,moms_manager,moms_supervisor')
            ->group(function () {
                Route::get('/fleets',         [FleetController::class, 'index']);
                Route::get('/fleets/{fleet}', [FleetController::class, 'show']);
            });
        Route::middleware('role:system_admin,moms_manager')->group(function () {
            Route::post('/fleets',           [FleetController::class, 'store']);
            Route::put('/fleets/{fleet}',    [FleetController::class, 'update']);
            Route::delete('/fleets/{fleet}', [FleetController::class, 'destroy']);
        });

        Route::prefix('inventory')->group(function () {
            Route::middleware('role:system_admin,moms_manager,moms_supervisor')->group(function () {
                Route::get('/parts',      [InventoryPartController::class, 'index']);
                Route::get('/parts/{id}', [InventoryPartController::class, 'show']);
                Route::post('/parts',     [InventoryPartController::class, 'store']);
                Route::put('/parts/{id}', [InventoryPartController::class, 'update']);
            });
            Route::delete('/parts/{id}', [InventoryPartController::class, 'destroy'])
                ->middleware('role:system_admin,moms_manager');
        });

        Route::prefix('finance')
            ->middleware('role:system_admin,moms_manager,moms_supervisor')
            ->group(function () {
                Route::get('/fuel-pricing',  [FuelPricingController::class, 'index']);
                Route::post('/fuel-pricing', [FuelPricingController::class, 'store']);
                Route::get('/fuel-costs',    [FuelPricingController::class, 'fuelCosts']);

                Route::get('/repair-costs/summary', [RepairCostController::class, 'summary']);
                Route::get('/repair-costs',         [RepairCostController::class, 'index']);
                Route::post('/repair-costs',        [RepairCostController::class, 'store']);
                Route::put('/repair-costs/{id}',    [RepairCostController::class, 'update']);
                Route::delete('/repair-costs/{id}', [RepairCostController::class, 'destroy'])
                    ->middleware('role:system_admin,moms_manager');
            });

        Route::get('/reports/daily-production', [DailyProductionReportController::class, 'download'])
            ->middleware('role:system_admin,moms_manager,moms_supervisor');

        Route::get('/reports/availability', [MachineAvailabilityController::class, 'index'])
            ->middleware('role:system_admin,moms_manager,moms_supervisor');

        Route::get('/time-entries',         [TimeEntryController::class, 'index']);
        Route::post('/time-entries',        [TimeEntryController::class, 'store']);
        Route::delete('/time-entries/{id}', [TimeEntryController::class, 'destroy'])
            ->middleware('role:system_admin,moms_manager,moms_supervisor');
    });

/*
|--------------------------------------------------------------------------
| CRM
|--------------------------------------------------------------------------
*/
Route::middleware([
    'role:system_admin,crm_manager,crm_staff',
    'permission:access_crm',
])
->prefix('crm')
->group(function () {

    Route::get('/stats', [CRMDashboardController::class, 'stats']);

    Route::get('/services', [ServiceController::class, 'index']);
    Route::middleware('role:system_admin,crm_manager')->group(function () {
        Route::post('/services',        [ServiceController::class, 'store']);
        Route::put('/services/{id}',    [ServiceController::class, 'update']);
        Route::delete('/services/{id}', [ServiceController::class, 'destroy']);
    });

    Route::get('/clients',      [ClientController::class, 'index']);
    Route::get('/clients/{id}', [ClientController::class, 'show']);
    Route::middleware('role:system_admin,crm_manager,crm_staff')->group(function () {
        Route::post('/clients',     [ClientController::class, 'store']);
        Route::put('/clients/{id}', [ClientController::class, 'update']);
    });
    Route::middleware('role:system_admin,crm_manager')->group(function () {
        Route::delete('/clients/{id}', [ClientController::class, 'destroy']);
    });

    Route::get('/subscriptions',      [SubscriptionController::class, 'index']);
    Route::get('/subscriptions/{id}', [SubscriptionController::class, 'show']);
    Route::middleware('role:system_admin,crm_manager,crm_staff')->group(function () {
        Route::post('/subscriptions',                    [SubscriptionController::class, 'store']);
        Route::put('/subscriptions/{id}',                [SubscriptionController::class, 'update']);
        Route::post('/subscriptions/{id}/payments',      [SubscriptionController::class, 'storePayment']);
        Route::post('/subscriptions/{id}/interruptions', [SubscriptionController::class, 'storeInterruption']);
    });
    Route::middleware('role:system_admin,crm_manager')->group(function () {
        Route::delete('/subscriptions/{id}', [SubscriptionController::class, 'destroy']);
        Route::delete('/payments/{id}',      [SubscriptionController::class, 'destroyPayment']);
        Route::delete('/interruptions/{id}', [SubscriptionController::class, 'destroyInterruption']);
    });

    Route::get('/renewals', [RenewalController::class, 'index']);
    Route::middleware('role:system_admin,crm_manager,crm_staff')->group(function () {
        Route::post('/renewals/{id}/renew', [RenewalController::class, 'renew']);
    });

    Route::prefix('reports')->group(function () {
        Route::get('/revenue', [CRMReportController::class, 'revenue']);
        Route::get('/expiry',  [CRMReportController::class, 'expiry']);
        Route::get('/credits', [CRMReportController::class, 'credits']);
    });

    // ── Deals ─────────────────────────────────────────────────────────────
    Route::get('/deals/pipeline',                             [DealController::class, 'pipeline']);
    Route::get('/deals',                                      [DealController::class, 'index']);
    Route::post('/deals',                                     [DealController::class, 'store']);
    Route::get('/deals/{deal}',                               [DealController::class, 'show']);
    Route::put('/deals/{deal}',                               [DealController::class, 'update']);
    Route::delete('/deals/{deal}',                            [DealController::class, 'destroy']);
    Route::post('/deals/{deal}/documents',                    [DealController::class, 'uploadDocument']);
    Route::delete('/deals/{deal}/documents/{document}',       [DealController::class, 'deleteDocument']);
    Route::post('/deals/{deal}/invoices',                     [DealController::class, 'addInvoice']);
    Route::put('/deals/{deal}/invoices/{invoice}',            [DealController::class, 'updateInvoice']);
    Route::delete('/deals/{deal}/invoices/{invoice}',         [DealController::class, 'deleteInvoice']);
    Route::get('/deals/{deal}/documents/{document}/download', [DealController::class, 'downloadDocument']);
});
    /*
    |--------------------------------------------------------------------------
    | REPORTS
    |--------------------------------------------------------------------------
    */
    Route::middleware([
        'role:system_admin,hr,dept_head',
        'permission:access_reports',
    ])
    ->prefix('reports')
    ->group(function () {
        Route::get('/summary/{module}', [ReportsController::class, 'getSummary']);
        Route::get('/list',             [ReportsController::class, 'getReportsList']);
        Route::post('/view',            [ReportsController::class, 'viewReport']);
        Route::post('/generate',        [ReportsController::class, 'generateReport']);
        Route::post('/export',          [ReportsController::class, 'exportReport']);
    });

    /*
    |--------------------------------------------------------------------------
    | AUDIT TRAIL
    |--------------------------------------------------------------------------
    */
    Route::middleware(['role:system_admin'])
        ->prefix('audit-logs')
        ->group(function () {
            Route::get('/',            [AuditLogController::class, 'index']);
            Route::get('/statistics',  [AuditLogController::class, 'statistics']);
            Route::get('/recent',      [AuditLogController::class, 'recentActivity']);
            Route::get('/{id}',        [AuditLogController::class, 'show']);
            Route::post('/model-logs', [AuditLogController::class, 'getModelLogs']);
        });

    /*
    |--------------------------------------------------------------------------
    | SETTINGS — ADMIN ONLY (full read/write)
    |--------------------------------------------------------------------------
    */
    Route::middleware(['role:system_admin'])
        ->prefix('settings')
        ->group(function () {
            Route::get('/general',  [SettingsController::class, 'show']);
            Route::post('/general', [SettingsController::class, 'store']);
            Route::post('/modules', [SettingsController::class, 'saveModules']);
            Route::get('/security', [SecuritySettingController::class, 'show']);
            Route::put('/security', [SecuritySettingController::class, 'update']);
        });

    /*
    |--------------------------------------------------------------------------
    | USER MANAGEMENT
    |--------------------------------------------------------------------------
    */
    Route::middleware(['role:system_admin'])
        ->group(function () {
            Route::get('/users',                      [UserManagementController::class, 'index']);
            Route::put('/users/{id}',                 [UserManagementController::class, 'update']);
            Route::post('/users/{id}/reset-password', [UserManagementController::class, 'resetPassword']);
            Route::delete('/users/{id}',              [UserManagementController::class, 'destroy']);
        });
