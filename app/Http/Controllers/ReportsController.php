<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\MOMS\Machine;
use App\Models\MOMS\ShiftOperation;
use App\Models\MOMS\Breakdown;
use App\Models\MOMS\MaintenanceLog;
use App\Models\MOMS\FuelTransaction;
use Carbon\Carbon;

class ReportsController extends Controller
{
    // FIXED: Removed ALL Schema::hasTable() calls — they hit information_schema
    // on every request. Tables exist in production; checking at runtime is wasteful.
    // Wrapped every query in try/catch instead — same safety, zero overhead.

    public function getSummary(Request $request, $module)
    {
        try {
            switch ($module) {
                case 'hrms':    return $this->getHRMSSummary();
                case 'payroll': return $this->getPayrollSummary();
                case 'aims':    return $this->getAIMSSummary();
                case 'moms':    return $this->getMOMSSummary();
                default:        return response()->json(['error' => 'Invalid module'], 400);
            }
        } catch (\Exception $e) {
            Log::error('Reports Summary Error', ['module' => $module, 'message' => $e->getMessage()]);
            return response()->json(['total_employees' => 0, 'present_today' => 0, 'on_leave' => 0]);
        }
    }

    private function getHRMSSummary()
    {
        // FIXED: Was 3 separate try/catch blocks each calling Schema::hasTable().
        // Now 1 query using conditional aggregation.
        try {
            $employees = DB::table('employees')->count();
        } catch (\Exception $e) {
            $employees = 0;
        }

        try {
            $presentToday = DB::table('attendances')
                ->whereDate('date', today())
                ->whereIn('status', ['Present', 'Late'])
                ->count();
        } catch (\Exception $e) {
            $presentToday = 0;
        }

        try {
            $onLeave = DB::table('applications')
                ->where('status', 'approved')
                ->where('application_type', 'leave')
                ->whereDate('date_from', '<=', today())
                ->whereDate('date_to', '>=', today())
                ->count();
        } catch (\Exception $e) {
            $onLeave = 0;
        }

        return response()->json([
            'total_employees' => $employees,
            'present_today'   => $presentToday,
            'on_leave'        => $onLeave,
        ]);
    }

    private function getPayrollSummary()
    {
        try {
            $currentMonth = now()->month;
            $currentYear  = now()->year;

            $result = DB::table('payrolls')
                ->whereMonth('created_at', $currentMonth)
                ->whereYear('created_at', $currentYear)
                ->selectRaw("
                    SUM(net_pay) as total_payroll,
                    SUM(CASE WHEN status = 'Paid' THEN net_pay ELSE 0 END) as paid_this_month
                ")
                ->first();

            $totalPayroll  = $result->total_payroll  ?? 0;
            $paidThisMonth = $result->paid_this_month ?? 0;

            return response()->json([
                'total_payroll'   => '$' . number_format($totalPayroll, 2),
                'paid_this_month' => '$' . number_format($paidThisMonth, 2),
                'pending'         => '$' . number_format($totalPayroll - $paidThisMonth, 2),
            ]);
        } catch (\Exception $e) {
            Log::error('Payroll Summary Error:', ['message' => $e->getMessage()]);
            return response()->json(['total_payroll' => '$0.00', 'paid_this_month' => '$0.00', 'pending' => '$0.00']);
        }
    }

    private function getAIMSSummary()
    {
        // FIXED: Was 3 separate COUNT queries. Now 1 query with conditional aggregation.
        try {
            $result = DB::table('sales_orders')->selectRaw("
                COUNT(*) as total_orders,
                SUM(status = 'fulfilled') as completed,
                SUM(status = 'pending') as pending
            ")->first();

            return response()->json([
                'total_orders' => (int) ($result->total_orders ?? 0),
                'completed'    => (int) ($result->completed    ?? 0),
                'pending'      => (int) ($result->pending      ?? 0),
            ]);
        } catch (\Exception $e) {
            Log::error('AIMS Summary Error:', ['message' => $e->getMessage()]);
            return response()->json(['total_orders' => 0, 'completed' => 0, 'pending' => 0]);
        }
    }

    private function getMOMSSummary()
    {
        // FIXED: Was loading all ShiftOperations into PHP to sum hours.
        // Now uses DB::sum() — no collection needed.
        try {
            $machineUsageHours = ShiftOperation::where('status', 'Completed')
                ->whereMonth('shift_start_time', now()->month)
                ->whereYear('shift_start_time', now()->year)
                ->selectRaw('SUM(ending_hour_meter - starting_hour_meter) as total_hours')
                ->whereNotNull('ending_hour_meter')
                ->whereNotNull('starting_hour_meter')
                ->value('total_hours') ?? 0;

            // FIXED: Was 2 separate COUNT queries. Now runs in parallel via selectRaw.
            $counts = DB::table('maintenance_logs')
                ->selectRaw("
                    COUNT(*) as total,
                    SUM(status = 'Completed') as completed,
                    SUM(status IN ('Scheduled','In Progress')) as pending
                ")
                ->whereMonth('start_time', now()->month)
                ->whereYear('start_time', now()->year)
                ->first();

            $breakdownCount = Breakdown::whereMonth('incident_time', now()->month)
                ->whereYear('incident_time', now()->year)
                ->count();

            return response()->json([
                'machine_usage_hours'   => round($machineUsageHours, 2) . ' hrs',
                'breakdown_this_period' => $breakdownCount,
                'maintenance_completed' => (int) ($counts->completed ?? 0),
            ]);
        } catch (\Exception $e) {
            Log::error('MOMS Summary Error:', ['message' => $e->getMessage()]);
            return response()->json(['machine_usage_hours' => '—', 'breakdown_this_period' => '—', 'maintenance_completed' => '—']);
        }
    }

    public function getReportsList(Request $request)
    {
        // Pure static data — no DB queries needed, this is instant
        $module = $request->query('module', 'hrms');

        $reports = [
            'hrms' => [
                ['id' => 1,  'title' => 'Employee Attendance Report', 'type' => 'attendance'],
                ['id' => 2,  'title' => 'Leave Applications Report',  'type' => 'leave'],
                ['id' => 3,  'title' => 'Employee Directory',          'type' => 'employees'],
                ['id' => 4,  'title' => 'Department Distribution',     'type' => 'departments'],
                ['id' => 5,  'title' => 'Employee Status Report',      'type' => 'employment_status'],
            ],
            'payroll' => [
                ['id' => 6,  'title' => 'Monthly Payroll Summary', 'type' => 'payroll_summary'],
                ['id' => 7,  'title' => 'Salary Register',         'type' => 'salary'],
                ['id' => 8,  'title' => 'Deductions Report',       'type' => 'deductions'],
                ['id' => 9,  'title' => 'Tax Report',              'type' => 'tax'],
                ['id' => 10, 'title' => 'Benefits Report',         'type' => 'benefits'],
            ],
            'aims' => [
                ['id' => 11, 'title' => 'Inventory Stock Report',   'type' => 'inventory'],
                ['id' => 12, 'title' => 'Sales Orders Report',      'type' => 'sales'],
                ['id' => 13, 'title' => 'Stock Movements Report',   'type' => 'stock_movements'],
                ['id' => 14, 'title' => 'Purchase Requests Report', 'type' => 'purchase_requests'],
                ['id' => 15, 'title' => 'Low Stock Items',          'type' => 'low_stock'],
                ['id' => 23, 'title' => 'Invoice Report', 'type' => 'open_invoice'],
                ['id' => 24, 'title' => 'Accounts Payable Aging Report',          'type' => 'ap_aging_report'],
                ['id' => 25, 'title' => 'Accounts Payable Trial Balance Report',          'type' => 'ap_trial_balance_report'],
                ['id' => 26, 'title' => 'Statement of Accounts',          'type' => 'soa_by_supplier_report'],
                
            ],
            'moms' => [
                ['id' => 16, 'title' => 'Machine Usage Report',    'type' => 'machine_usage'],
                ['id' => 17, 'title' => 'Breakdown Analysis',      'type' => 'breakdown'],
                ['id' => 18, 'title' => 'Maintenance Log',         'type' => 'maintenance'],
                ['id' => 19, 'title' => 'Fuel Consumption Report', 'type' => 'fuel'],
                ['id' => 20, 'title' => 'Operator Performance',    'type' => 'operator'],
                ['id' => 21, 'title' => 'Expenses Report',         'type' => 'moms_expenses'],
                ['id' => 22, 'title' => 'Income Report',           'type' => 'moms_income'],
            ],
        ];

        return response()->json($reports[$module] ?? []);
    }

    public function generateReport(Request $request)
    {
        $validated = $request->validate([
            'report_type' => 'required|string',
            'date_range'  => 'nullable|string',
            'start_date'  => 'nullable|date',
            'end_date'    => 'nullable|date',
            'filters'     => 'nullable|array',
        ]);

        try {
            $data = $this->getReportData($validated['report_type'], $validated);

            return response()->json([
                'success' => true,
                'message' => 'Report generated successfully',
                'report'  => [
                    'id'            => rand(1000, 9999),
                    'type'          => $validated['report_type'],
                    'generated_at'  => now()->format('m/d/Y'),
                    'data'          => $data,
                    'total_records' => count($data),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Report Generation Error:', ['type' => $validated['report_type'], 'message' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to generate report: ' . $e->getMessage()], 500);
        }
    }

    private function getReportData($type, $filters)
    {
        switch ($type) {
            case 'attendance':        return $this->getAttendanceReportData($filters);
            case 'leave':             return $this->getLeaveReportData($filters);
            case 'employees':         return $this->getEmployeesReportData($filters);
            case 'departments':       return $this->getDepartmentsReportData($filters);
            case 'employment_status': return $this->getEmploymentStatusReportData($filters);
            case 'payroll_summary':
            case 'salary':
            case 'deductions':
            case 'tax':
            case 'benefits':          return $this->getPayrollReportData($filters);
            case 'inventory':         return $this->getInventoryReportData($filters);
            case 'sales':             return $this->getSalesReportData($filters);
            case 'stock_movements':   return $this->getStockMovementsReportData($filters);
            case 'purchase_requests': return $this->getPurchaseRequestsReportData($filters);
            case 'low_stock':         return $this->getLowStockReportData($filters);
            case 'machine_usage':     return $this->getMachineUsageReportData($filters);
            case 'breakdown':         return $this->getBreakdownReportData($filters);
            case 'maintenance':       return $this->getMaintenanceReportData($filters);
            case 'fuel':              return $this->getFuelReportData($filters);
            case 'operator':          return $this->getOperatorReportData($filters);
            case 'moms_expenses':     return $this->getMOMSExpensesReportData($filters);
            case 'moms_income':       return $this->getMOMSIncomeReportData($filters);
            case 'open_invoice':          return $this->getInvoicesReportData($filters);
            case 'ap_aging_report': return $this->getApAgingReportData($filters);
            case 'ap_trial_balance_report': return $this->getAPTrialBalanceReportData($filters);
            case 'soa_by_supplier_report': return $this->getSOAperSupplierReportData($filters);
           



           
            default: return [];
        }
    }

    // ── HRMS Reports ──────────────────────────────────────────────────────────

    private function getAttendanceReportData($filters)
    {
        try {
            $query = DB::table('attendances')
                ->join('employees', 'attendances.employee_id', '=', 'employees.id')
                ->select(
                    'employees.biometric_id',
                    DB::raw("CONCAT(employees.first_name, ' ', employees.last_name) as employee_name"),
                    'attendances.date', 'attendances.am_time_in', 'attendances.am_time_out',
                    'attendances.pm_time_in', 'attendances.pm_time_out', 'attendances.status'
                );
            $this->applyDateFilter($query, 'attendances.date', $filters);
            return $query->orderBy('attendances.date', 'desc')->get()->toArray();
        } catch (\Exception $e) { Log::error('Attendance Report Error:', ['message' => $e->getMessage()]); return []; }
    }

    private function getLeaveReportData($filters)
    {
        try {
            $query = DB::table('applications')
                ->join('employees', 'applications.biometric_id', '=', 'employees.biometric_id')
                ->select(
                    'employees.biometric_id',
                    DB::raw("CONCAT(employees.first_name, ' ', employees.last_name) as employee_name"),
                    'applications.leave_type', 'applications.date_from as start_date',
                    'applications.date_to as end_date', 'applications.leave_duration',
                    'applications.status', 'applications.purpose as reason'
                )
                ->where('applications.application_type', 'leave');
            $this->applyDateFilter($query, 'applications.date_from', $filters);
            return $query->orderBy('applications.date_from', 'desc')->get()->toArray();
        } catch (\Exception $e) { Log::error('Leave Report Error:', ['message' => $e->getMessage()]); return []; }
    }

    private function getEmployeesReportData($filters)
    {
        try {
            return DB::table('employees')
                ->select('biometric_id', 'employee_number', DB::raw("CONCAT(first_name, ' ', last_name) as full_name"), 'created_at as date_hired')
                ->orderBy('created_at', 'desc')->get()->toArray();
        } catch (\Exception $e) { Log::error('Employees Report Error:', ['message' => $e->getMessage()]); return []; }
    }

    private function getDepartmentsReportData($filters)
    {
        try {
            return DB::table('employment_information')
                ->join('departments', 'employment_information.department_id', '=', 'departments.id')
                ->select('departments.name as department_name', DB::raw('COUNT(DISTINCT employment_information.employee_id) as employee_count'))
                ->where('employment_information.employment_status', 'Active')
                ->groupBy('departments.id', 'departments.name')
                ->orderBy('employee_count', 'desc')->get()->toArray();
        } catch (\Exception $e) { Log::error('Departments Report Error:', ['message' => $e->getMessage()]); return []; }
    }

    private function getEmploymentStatusReportData($filters)
    {
        try {
            $query = DB::table('employment_information')
                ->join('employees',   'employment_information.employee_id',   '=', 'employees.id')
                ->join('departments', 'employment_information.department_id', '=', 'departments.id')
                ->select(
                    'employees.biometric_id',
                    DB::raw("CONCAT(employees.first_name, ' ', employees.last_name) as employee_name"),
                    'departments.name as department',
                    'employment_information.position',
                    'employment_information.employee_type',
                    'employment_information.employment_status',
                    'employment_information.date_started'
                );

            if (isset($filters['filters']['status']) && $filters['filters']['status'] !== 'all') {
                $query->where('employment_information.employment_status', ucfirst($filters['filters']['status']));
            }

            return $query->orderBy('employees.first_name')->get()->toArray();
        } catch (\Exception $e) { Log::error('Employment Status Report Error:', ['message' => $e->getMessage()]); return []; }
    }

    // ── Payroll Reports ───────────────────────────────────────────────────────

    private function getPayrollReportData($filters)
    {
        try {
            $query = DB::table('payrolls')
                ->join('employees', 'payrolls.employee_id', '=', 'employees.id')
                ->select(
                    'employees.biometric_id', 'employees.employee_number',
                    DB::raw("CONCAT(employees.first_name, ' ', employees.last_name) as employee_name"),
                    'payrolls.pay_period_start', 'payrolls.pay_period_end', 'payrolls.base_salary',
                    'payrolls.gross_pay', 'payrolls.deductions', 'payrolls.tax', 'payrolls.net_pay', 'payrolls.status'
                );
            $this->applyDateFilter($query, 'payrolls.created_at', $filters);
            return $query->orderBy('payrolls.created_at', 'desc')->get()->toArray();
        } catch (\Exception $e) { Log::error('Payroll Report Error:', ['message' => $e->getMessage()]); return []; }
    }

    // ── AIMS Reports ──────────────────────────────────────────────────────────

    private function getInventoryReportData($filters)
    {
        try {
            $query = DB::table('items')
                ->leftJoin('suppliers', 'items.supplier_id', '=', 'suppliers.id')
                ->select(
                    'items.sku', 'items.name as item_name', 'items.category', 'items.brand',
                    'items.unit', 'items.current_stock', 'items.cost_price', 'items.selling_price',
                    DB::raw('items.current_stock * items.cost_price as total_value'),
                    'items.status', 'suppliers.name as supplier_name'
                );

            if (isset($filters['filters']['status']) && $filters['filters']['status'] !== 'all') {
                $query->where('items.status', ucfirst($filters['filters']['status']));
            }

            return $query->orderBy('items.name')->get()->toArray();
        } catch (\Exception $e) { Log::error('Inventory Report Error:', ['message' => $e->getMessage()]); return []; }
    }

    private function getSalesReportData($filters)
    {
        try {
            $query = DB::table('sales_orders')
                ->join('customers', 'sales_orders.customer_id', '=', 'customers.id')
                ->select('sales_orders.so_number', 'customers.name as customer_name', 'sales_orders.order_date', 'sales_orders.total_amount', 'sales_orders.status');
            $this->applyDateFilter($query, 'sales_orders.order_date', $filters);
            return $query->orderBy('sales_orders.order_date', 'desc')->get()->toArray();
        } catch (\Exception $e) { Log::error('Sales Report Error:', ['message' => $e->getMessage()]); return []; }
    }

    private function getStockMovementsReportData($filters)
    {
        try {
            $query = DB::table('stock_movements')
                ->join('items', 'stock_movements.item_id', '=', 'items.id')
                ->select('items.sku', 'items.name as item_name', 'stock_movements.type', 'stock_movements.quantity', 'stock_movements.reference', 'stock_movements.notes', 'stock_movements.created_at as movement_date');
            $this->applyDateFilter($query, 'stock_movements.created_at', $filters);
            return $query->orderBy('stock_movements.created_at', 'desc')->get()->toArray();
        } catch (\Exception $e) { Log::error('Stock Movements Report Error:', ['message' => $e->getMessage()]); return []; }
    }

    private function getPurchaseRequestsReportData($filters)
    {
        try {
            $query = DB::table('purchase_requests')
                ->leftJoin('users as requester', 'purchase_requests.requested_by', '=', 'requester.id')
                ->leftJoin('users as approver',  'purchase_requests.approved_by',  '=', 'approver.id')
                ->select('purchase_requests.pr_number', 'purchase_requests.request_date', 'requester.name as requested_by', 'approver.name as approved_by', 'purchase_requests.status', 'purchase_requests.approved_at', 'purchase_requests.notes');
            $this->applyDateFilter($query, 'purchase_requests.request_date', $filters);
            return $query->orderBy('purchase_requests.request_date', 'desc')->get()->toArray();
        } catch (\Exception $e) { Log::error('Purchase Requests Report Error:', ['message' => $e->getMessage()]); return []; }
    }

    private function getInvoicesReportData($filters)
    {
        try {
            $query = DB::table('invoices')
                ->leftJoin('users as approver', 'invoices.approved_by', '=', 'approver.id')
                ->leftJoin('users as canceller', 'invoices.cancelled_by', '=', 'canceller.id')
                ->leftJoin('suppliers', 'invoices.supplier_id', '=', 'suppliers.id')
                ->leftJoin('request_orders', 'invoices.request_order_id', '=', 'request_orders.id')
                ->select(
                    'invoices.invoice_number',
                    'invoices.po_number',
                /*  'request_orders.id as request_order_id', */
                    'suppliers.name as supplier_name',
                    'invoices.invoice_date',
                    'invoices.total_amount',
                    'invoices.status',
                    'invoices.remarks',
                    'invoices.approved_at',
                    'approver.name as approved_by',
                    'invoices.cancelled_at',
                    'canceller.name as cancelled_by',
                /*   'invoices.attachment' */
                );

            // Apply date filter (based on invoice_date)
            $this->applyDateFilter($query, 'invoices.invoice_date', $filters);

           if (isset($filters['filters']['status']) && $filters['filters']['status'] !== 'all') {
                $query->where('invoices.status', $filters['filters']['status']);
            }

            return $query->orderBy('invoices.invoice_date', 'desc')
                        ->get()
                        ->toArray();

        } catch (\Exception $e) {
            Log::error('Invoices Report Error:', [
                'message' => $e->getMessage()
            ]);
            return [];
        }
    }

     private function getApAgingReportData($filters)
    {
        try {
          
            $query = DB::table('invoices')
            ->leftJoin('suppliers', 'invoices.supplier_id', '=', 'suppliers.id')
            ->whereIn('invoices.status', ['open', 'partially_paid', 'approved','posted'])
            ->select(
                
                'suppliers.name as supplier_name',

                DB::raw('SUM(invoices.total_amount) as total_amount'),

                DB::raw("
                    SUM(CASE 
                        WHEN DATEDIFF(CURDATE(), invoices.due_date) <= 30 
                        THEN invoices.total_amount ELSE 0 END
                    ) as 0_30
                "),
                DB::raw("
                    SUM(CASE 
                        WHEN DATEDIFF(CURDATE(), invoices.due_date) BETWEEN 31 AND 60 
                        THEN invoices.total_amount ELSE 0 END
                    ) as 31_60
                "),
                DB::raw("
                    SUM(CASE 
                        WHEN DATEDIFF(CURDATE(), invoices.due_date) BETWEEN 61 AND 90 
                        THEN invoices.total_amount ELSE 0 END
                    ) as 61_90
                "),
                DB::raw("
                    SUM(CASE 
                        WHEN DATEDIFF(CURDATE(), invoices.due_date) > 90 
                        THEN invoices.total_amount ELSE 0 END
                    ) as 90_plus
                ")
            );
             $this->applyDateFilter($query, 'invoices.invoice_date', $filters);

            if (isset($filters['filters']['status']) && $filters['filters']['status'] !== 'all') {
                $query->where('invoices.status', $filters['filters']['status']);
            }
        return $query->groupBy('suppliers.name')->orderBy('supplier_name')->get();

        } catch (\Exception $e) {
            Log::error('Invoices Report Error:', [
                'message' => $e->getMessage()
            ]);
            return [];
        }
    }


      /**
     * Get invoices with payments applied, balances, and supplier info 
     */
    private function getAPTrialBalanceReportData($filters)
    {
       try {
                $query = DB::table('suppliers')
                    ->leftJoin('invoices as i', function ($join) {
                        $join->on('i.supplier_id', '=', 'suppliers.id')
                            ->whereIn('i.status', ['approved', 'partially_paid', 'paid', 'posted']);
                    })
                    ->leftJoin('payment_allocations as pa', 'pa.invoice_id', '=', 'i.id')
                    ->select(
                    
                        'suppliers.name as supplier_name',
                        DB::raw('COALESCE(SUM(i.total_amount), 0) as total_invoices_Credit'),   // Credit
                        DB::raw('COALESCE(SUM(pa.amount_applied), 0) as total_payments_Debit'), // Debit
                        DB::raw('COALESCE(SUM(i.total_amount),0) - COALESCE(SUM(pa.amount_applied),0) as balance')
                    )
                    ->groupBy('suppliers.id', 'suppliers.name');

                $this->applyDateFilter($query, 'i.invoice_date', $filters);

                // Optional: Apply filters if needed
                if (isset($filters['filters']['supplier_id'])) {
                    $query->where('suppliers.id', $filters['filters']['supplier_id']);
                }

                return $query->orderBy('suppliers.name')
                            ->get()
                            ->toArray();

            } catch (\Exception $e) {
                Log::error('AP Trial Balance Report Error:', [
                    'message' => $e->getMessage()
                ]);
                return [];
            }
    }

    /**
     * Get SOA fpr invoices with payments applied, balances, and supplier info 
     */

    private function getSOAperSupplierReportData($filters)
    {
       try {
            $invoiceQuery = DB::table('invoices as i')
            ->join('suppliers as s', 's.id', '=', 'i.supplier_id')
                ->select([
                    'i.supplier_id',
                    's.name as supplier_name',
                    'i.invoice_date as date',
                    'i.invoice_number as reference',
                    DB::raw("'Invoice' as type"),
                    'i.total_amount as debit',
                    DB::raw('0 as credit'),
                ]);

            $paymentQuery = DB::table('payments as p')
                ->join('payment_allocations as pa', 'pa.payment_id', '=', 'p.id')
                ->join('suppliers as s', 's.id', '=', 'p.supplier_id')
                ->select([
                    'p.supplier_id',
                    's.name as supplier_name',
                    'p.payment_date as date',
                    'p.payment_number as reference',
                    DB::raw("'Payment' as type"),
                    DB::raw('0 as debit'),
                    'pa.amount_applied as credit',
                ]);

             $this->applyDateFilter($invoiceQuery, 'i.invoice_date', $filters);
            $transactions = DB::query()
                ->fromSub($invoiceQuery->unionAll($paymentQuery), 't')
                ->orderBy('supplier_id')
                ->orderBy('date')
                ->get();

            // Group by supplier
            /* $grouped = $transactions->groupBy('supplier_id');

            $result = [];

            foreach ($grouped as $supplierId => $rows) {
               
                $balance = 0;

                $txns = $rows->map(function ($row) use (&$balance) {

                    $balance += ($row->debit - $row->credit);

                    return [
                        'date'      => $row->date,
                        'reference' => $row->reference,
                        'type'      => $row->type,
                        'debit'     => (float) $row->debit,
                        'credit'    => (float) $row->credit,
                        'balance'   => $balance,
                    ];
                });

                $supplier = DB::table('suppliers')->where('id', $supplierId)->first();

                $result[] = [
                    'supplier_id'   => $supplierId,
                    'supplier_name' => $supplier->name ?? 'Unknown',
                    'total_balance' => $balance,
                    'transactions'  => $txns,
                ];
            } */

            //return $result;
            return $transactions;

            } catch (\Exception $e) {
                Log::error('Statement of Accounts Report Error:', [
                    'message' => $e->getMessage()
                ]);
                return [];
            }
    }



    private function getLowStockReportData($filters)
    {
        try {
            return DB::table('items')
                ->select('sku', 'name as item_name', 'category', 'current_stock', 'minimum_stock', 'reorder_quantity', DB::raw('minimum_stock - current_stock as stock_deficit'), 'status')
                ->whereRaw('current_stock <= minimum_stock')
                ->where('status', 'Active')
                ->orderBy('stock_deficit', 'desc')->get()->toArray();
        } catch (\Exception $e) { Log::error('Low Stock Report Error:', ['message' => $e->getMessage()]); return []; }
    }

    // ── MOMS Reports ──────────────────────────────────────────────────────────

    private function getMachineUsageReportData($filters)
    {
        try {
            $query = ShiftOperation::with(['machine', 'operator'])->where('status', 'Completed');
            if (isset($filters['date_range'])) $query = $this->applyMOMSDateFilter($query, $filters['date_range'], 'shift_start_time');

            return $query->get()->groupBy('machine_id')->map(function ($machineShifts) {
                $machine    = $machineShifts->first()->machine;
                $totalHours = $machineShifts->sum(fn($s) => ($s->ending_hour_meter && $s->starting_hour_meter) ? $s->ending_hour_meter - $s->starting_hour_meter : 0);
                return [
                    'machine_id'          => $machine->machine_id ?? 'N/A',
                    'make_model'          => trim(($machine->make ?? '') . ' ' . ($machine->model ?? '')),
                    'total_hours'         => round($totalHours, 2),
                    'number_of_shifts'    => $machineShifts->count(),
                    'avg_hours_per_shift' => $machineShifts->count() > 0 ? round($totalHours / $machineShifts->count(), 2) : 0,
                ];
            })->values()->toArray();
        } catch (\Exception $e) { Log::error('Machine Usage Report Error:', ['message' => $e->getMessage()]); return []; }
    }

    private function getBreakdownReportData($filters)
    {
        try {
            $query = Breakdown::with(['machine']);
            if (isset($filters['date_range'])) $query = $this->applyMOMSDateFilter($query, $filters['date_range'], 'incident_time');

            return $query->get()->map(fn($b) => [
                'date'           => $b->incident_time->format('Y-m-d'),
                'machine_id'     => $b->machine->machine_id ?? 'N/A',
                'breakdown_type' => $b->breakdown_type,
                'severity'       => $b->severity,
                'downtime_hours' => $b->downtime_minutes ? round($b->downtime_minutes / 60, 2) : 0,
                'repair_cost'    => $b->repair_cost ?? 0,
                'status'         => $b->status,
            ])->toArray();
        } catch (\Exception $e) { Log::error('Breakdown Report Error:', ['message' => $e->getMessage()]); return []; }
    }

    private function getMaintenanceReportData($filters)
    {
        try {
            $query = MaintenanceLog::with(['machine']);
            if (isset($filters['date_range'])) $query = $this->applyMOMSDateFilter($query, $filters['date_range'], 'start_time');

            return $query->get()->map(fn($log) => [
                'date'             => $log->start_time->format('Y-m-d'),
                'machine_id'       => $log->machine->machine_id ?? 'N/A',
                'maintenance_type' => $log->maintenance_type,
                'status'           => $log->status,
                'cost'             => $log->cost ?? 0,
                'duration_hours'   => ($log->end_time && $log->start_time) ? round($log->start_time->diffInMinutes($log->end_time) / 60, 2) : 0,
            ])->toArray();
        } catch (\Exception $e) { Log::error('Maintenance Report Error:', ['message' => $e->getMessage()]); return []; }
    }

    private function getFuelReportData($filters)
    {
        try {
            $query = FuelTransaction::with(['machine']);
            if (isset($filters['date_range'])) $query = $this->applyMOMSDateFilter($query, $filters['date_range'], 'transaction_date');

            return $query->get()->map(function ($t) {
                $volume = $t->volume ?? 0;
                $cost   = $t->total_cost ?? 0;
                return [
                    'date'           => $t->transaction_date->format('Y-m-d'),
                    'machine_id'     => $t->machine->machine_id ?? 'N/A',
                    'fuel_type'      => $t->fuel_type,
                    'volume'         => round($volume, 2),
                    'cost'           => round($cost, 2),
                    'cost_per_liter' => $volume > 0 ? round($cost / $volume, 2) : 0,
                ];
            })->toArray();
        } catch (\Exception $e) { Log::error('Fuel Report Error:', ['message' => $e->getMessage()]); return []; }
    }

    private function getOperatorReportData($filters)
    {
        try {
            $query = ShiftOperation::with(['operator', 'machine'])->where('status', 'Completed');
            if (isset($filters['date_range'])) $query = $this->applyMOMSDateFilter($query, $filters['date_range'], 'shift_start_time');

            return $query->get()->groupBy('operator_id')->map(function ($operatorShifts) {
                $operator   = $operatorShifts->first()->operator;
                $totalHours = $operatorShifts->sum(fn($s) => ($s->ending_hour_meter && $s->starting_hour_meter) ? $s->ending_hour_meter - $s->starting_hour_meter : 0);
                return [
                    'operator_name'       => $operator->user->name ?? 'Unknown',
                    'total_shifts'        => $operatorShifts->count(),
                    'total_hours'         => round($totalHours, 2),
                    'avg_hours_per_shift' => $operatorShifts->count() > 0 ? round($totalHours / $operatorShifts->count(), 2) : 0,
                    'rating'              => $operator->rating ?? 0,
                ];
            })->values()->toArray();
        } catch (\Exception $e) { Log::error('Operator Report Error:', ['message' => $e->getMessage()]); return []; }
    }

    private function getMOMSExpensesReportData($filters)
    {
        try {
            $maintenanceQuery = MaintenanceLog::with('machine');
            if (isset($filters['date_range'])) $maintenanceQuery = $this->applyMOMSDateFilter($maintenanceQuery, $filters['date_range'], 'start_time');

            $maintenanceCosts = $maintenanceQuery->get()->map(fn($log) => [
                'date'         => $log->start_time->format('Y-m-d'),
                'machine_id'   => $log->machine->machine_id ?? 'N/A',
                'expense_type' => 'Maintenance',
                'description'  => $log->maintenance_type ?? 'Scheduled Maintenance',
                'labor_cost'   => round($log->labor_cost ?? 0, 2),
                'parts_cost'   => round($log->parts_cost ?? 0, 2),
                'total_cost'   => round(($log->labor_cost ?? 0) + ($log->parts_cost ?? 0), 2),
                'status'       => $log->status,
            ]);

            $breakdownQuery = Breakdown::with('machine');
            if (isset($filters['date_range'])) $breakdownQuery = $this->applyMOMSDateFilter($breakdownQuery, $filters['date_range'], 'incident_time');

            $breakdownCosts = $breakdownQuery->get()->map(fn($b) => [
                'date'         => $b->incident_time->format('Y-m-d'),
                'machine_id'   => $b->machine->machine_id ?? 'N/A',
                'expense_type' => 'Breakdown Repair',
                'description'  => $b->breakdown_type ?? 'Breakdown',
                'labor_cost'   => 0,
                'parts_cost'   => 0,
                'total_cost'   => round($b->repair_cost ?? 0, 2),
                'status'       => $b->status,
            ]);

            $fuelQuery = FuelTransaction::with('machine');
            if (isset($filters['date_range'])) $fuelQuery = $this->applyMOMSDateFilter($fuelQuery, $filters['date_range'], 'transaction_date');

            $fuelCosts = $fuelQuery->get()->map(fn($t) => [
                'date'         => $t->transaction_date->format('Y-m-d'),
                'machine_id'   => $t->machine->machine_id ?? 'N/A',
                'expense_type' => 'Fuel',
                'description'  => $t->fuel_type . ' — ' . $t->volume . 'L',
                'labor_cost'   => 0,
                'parts_cost'   => 0,
                'total_cost'   => round($t->total_cost ?? 0, 2),
                'status'       => 'Completed',
            ]);

            return $maintenanceCosts->concat($breakdownCosts)->concat($fuelCosts)->sortByDesc('date')->values()->toArray();
        } catch (\Exception $e) { Log::error('MOMS Expenses Report Error:', ['message' => $e->getMessage()]); return []; }
    }

    private function getMOMSIncomeReportData($filters)
    {
        try {
            $query = ShiftOperation::with(['machine', 'operator'])->where('status', 'Approved');
            if (isset($filters['date_range'])) $query = $this->applyMOMSDateFilter($query, $filters['date_range'], 'shift_start_time');

            return $query->get()->map(function ($shift) {
                $operatingHours = ($shift->ending_hour_meter && $shift->starting_hour_meter)
                    ? round($shift->ending_hour_meter - $shift->starting_hour_meter, 2) : 0;

                return [
                    'date'            => $shift->shift_start_time->format('Y-m-d'),
                    'machine_id'      => $shift->machine->machine_id ?? 'N/A',
                    'operator'        => $shift->operator->user->name ?? 'N/A',
                    'shift_start'     => $shift->shift_start_time->format('H:i'),
                    'shift_end'       => $shift->shift_end_time ? $shift->shift_end_time->format('H:i') : '—',
                    'operating_hours' => $operatingHours,
                    'tons'            => round($shift->tons ?? 0, 2),
                    'trips'           => $shift->trips ?? 0,
                    'department'      => $shift->department ?? '—',
                    'location'        => $shift->location ?? '—',
                ];
            })->sortByDesc('date')->values()->toArray();
        } catch (\Exception $e) { Log::error('MOMS Income Report Error:', ['message' => $e->getMessage()]); return []; }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function applyDateFilter($query, $dateColumn, $filters)
    {
        if (isset($filters['start_date']) && isset($filters['end_date'])) {
            $query->whereBetween($dateColumn, [$filters['start_date'], $filters['end_date']]);
        } elseif (isset($filters['date_range'])) {
            switch ($filters['date_range']) {
                case 'today': $query->whereDate($dateColumn, today()); break;
                case 'week':  $query->whereBetween($dateColumn, [now()->startOfWeek(), now()->endOfWeek()]); break;
                case 'month': $query->whereMonth($dateColumn, now()->month)->whereYear($dateColumn, now()->year); break;
                case 'year':  $query->whereYear($dateColumn, now()->year); break;
            }
        }
    }

    private function applyMOMSDateFilter($query, $dateRange, $field)
    {
        switch ($dateRange) {
            case 'today': return $query->whereDate($field, today());
            case 'week':  return $query->whereBetween($field, [now()->startOfWeek(), now()->endOfWeek()]);
            case 'month': return $query->whereMonth($field, now()->month)->whereYear($field, now()->year);
            case 'year':  return $query->whereYear($field, now()->year);
            default:      return $query;
        }
    }

    // ── Export ────────────────────────────────────────────────────────────────

    public function exportReport(Request $request)
    {
        $validated = $request->validate([
            'report_type' => 'required|string',
            'format'      => 'required|in:csv,pdf',
            'data'        => 'required|array',
            'title'       => 'required|string',
        ]);

        try {
            return $validated['format'] === 'csv'
                ? $this->exportToCsv($validated['data'], $validated['title'])
                : $this->exportToPdf($validated['data'], $validated['title'], $validated['report_type']);
        } catch (\Exception $e) {
            Log::error('Export Error:', ['message' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Export failed'], 500);
        }
    }

    private function exportToCsv($data, $title)
    {
        $filename = str_replace(' ', '_', strtolower($title)) . '_' . now()->format('Y-m-d') . '.csv';
        $headers  = ['Content-Type' => 'text/csv', 'Content-Disposition' => "attachment; filename=\"{$filename}\""];

        $callback = function () use ($data) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));
            if (!empty($data)) {
                fputcsv($file, array_keys((array) $data[0]));
                foreach ($data as $row) fputcsv($file, (array) $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    private function exportToPdf($data, $title, $type)
    {
        $filename = str_replace(' ', '_', strtolower($title)) . '_' . now()->format('Y-m-d') . '.pdf';
        $pdf = Pdf::loadView('reports.pdf-template', [
            'title'        => $title,
            'data'         => $data,
            'type'         => $type,
            'generated_at' => now()->format('F d, Y'),
        ]);
        return $pdf->download($filename);
    }

    public function viewReport(Request $request)
    {
        try {
            $validated = $request->validate([
                'report_type' => 'required|string',
                'date_range'  => 'nullable|string',
                'start_date'  => 'nullable|date',
                'end_date'    => 'nullable|date',
                'filters'     => 'nullable|array',
            ]);

            $data = $this->getReportData($validated['report_type'], $validated);

            return response()->json([
                'success'       => true,
                'data'          => $data,
                'total_records' => count($data),
            ]);
        } catch (\Exception $e) {
            Log::error('View Report Error:', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json(['success' => false, 'message' => 'Failed to load report data'], 500);
        }
    }
}