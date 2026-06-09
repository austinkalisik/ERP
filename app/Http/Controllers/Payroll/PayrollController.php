<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\HRMS\Employee;
use App\Models\Payroll\Payroll;
use App\Http\Controllers\Payroll\PayslipController;
use App\Models\HRMS\Attendance;
use App\Models\Payroll\CashAdvance;
use App\Models\Payroll\NasfundTable;
use App\Models\Payroll\NcslTable;
use App\Models\Payroll\TaxTable;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PayrollController extends Controller
{
    // ── Rate constants ─────────────────────────────────────────────────────────
    // These are loaded dynamically from the payroll_config table.
    // Hardcoded fallbacks are used if the table is missing or not yet seeded.

    private function getConfig(): array
    {
        static $config = null;
        if ($config === null) {
            $rows   = DB::table('payroll_config')->pluck('value', 'key');
            $config = [
                'tax_rate'                => (float) ($rows['tax_rate']                ?? 0.10),
                'nasfund_rate'            => (float) ($rows['nasfund_rate']            ?? 0.06),
                'hours_per_day'           => (float) ($rows['hours_per_day']           ?? 12),
                'leave_hours_per_day'     => (float) ($rows['leave_hours_per_day']     ?? 8),
                'standard_days_per_month' => (float) ($rows['standard_days_per_month'] ?? 22),
            ];
        }
        return $config;
    }

    // OT multipliers: loaded dynamically from overtime_types table.
    private function getOtRates(): array
    {
        return DB::table('overtime_types')
            ->pluck('multiplier', 'overtime_type')
            ->map(fn($m) => (float) $m)
            ->toArray();
    }

    // ── Bracket lookups ────────────────────────────────────────────────────────

    /**
     * Look up withholding tax from payroll_tax_table.
     * Falls back to flat rate from payroll_config if no bracket found.
     *
     * @param  float  $grossPay       Employee's gross pay for this period
     * @param  string $taxType        "W/ Declaration" | "No Declaration" | "Non-Resident"
     * @param  int    $dependents     Number of dependents declared by employee
     * @param  int    $year           Pay period year
     * @param  float  $flatRateFallback  From payroll_config (e.g. 0.10)
     */
    private function lookupTax(
        float $grossPay,
        string $taxType,
        int $dependents,
        int $year,
        float $flatRateFallback
    ): float {
        $bracket = TaxTable::where('year_applied', $year)
            ->where('tax_type', $taxType)
            ->where('no_of_dependents', $dependents)
            ->where('compensation_from', '<=', $grossPay)
            ->where('compensation_to',   '>=', $grossPay)
            ->first();

        if ($bracket) {
            Log::info('TAX LOOKUP HIT', [
                'gross'      => $grossPay,
                'tax_type'   => $taxType,
                'dependents' => $dependents,
                'year'       => $year,
                'amount'     => $bracket->amount,
            ]);
            return round((float) $bracket->amount, 2);
        }

        // No bracket found — fall back to flat percentage from PayrollConfig
        Log::info('TAX LOOKUP MISS — using flat rate fallback', [
            'gross'    => $grossPay,
            'tax_type' => $taxType,
            'year'     => $year,
            'fallback' => $flatRateFallback,
        ]);
        return round($grossPay * $flatRateFallback, 2);
    }

    /**
     * Look up NASFUND employee contribution from payroll_nasfund_table.
     * Falls back to flat rate from payroll_config if no bracket found.
     */
    private function lookupNasfund(
        float $grossPay,
        int   $year,
        float $flatRateFallback
    ): float {
        $bracket = NasfundTable::where('year', $year)
            ->where('compensation_from', '<=', $grossPay)
            ->where('compensation_to',   '>=', $grossPay)
            ->first();

        if ($bracket) {
            Log::info('NASFUND LOOKUP HIT', [
                'gross'          => $grossPay,
                'year'           => $year,
                'employee_rate'  => $bracket->employee_rate,
                'amount'         => round($grossPay * (float) $bracket->employee_rate, 2),
            ]);
            return round($grossPay * (float) $bracket->employee_rate, 2);
        }

        Log::info('NASFUND LOOKUP MISS — using flat rate fallback', [
            'gross'    => $grossPay,
            'year'     => $year,
            'fallback' => $flatRateFallback,
        ]);
        return round($grossPay * $flatRateFallback, 2);
    }

    /**
     * Look up NCSL deduction from payroll_ncsl_table.
     * Returns 0 if no bracket found (NCSL is optional, not everyone qualifies).
     */
    private function lookupNcsl(float $grossPay, int $year): float
    {
        $bracket = NcslTable::where('year', $year)
            ->where('compensation_from', '<=', $grossPay)
            ->where('compensation_to',   '>=', $grossPay)
            ->first();

        if ($bracket) {
            Log::info('NCSL LOOKUP HIT', [
                'gross'            => $grossPay,
                'year'             => $year,
                'deduction_amount' => $bracket->deduction_amount,
            ]);
            return round((float) $bracket->deduction_amount, 2);
        }

        // No bracket = not applicable for this employee's income range
        return 0;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PUBLIC ENDPOINTS
    // ══════════════════════════════════════════════════════════════════════════

    public function index(Request $request)
    {
        $query = Payroll::with(['employee.employmentInformation']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('pay_period_start', [
                $request->start_date,
                $request->end_date,
            ]);
        }

        $query->orderBy('created_at', 'desc');
        $payrolls = $query->paginate($request->get('per_page', 15));

        return response()->json($payrolls);
    }

    public function show($id)
    {
        $payroll = Payroll::with([
            'employee.employmentInformation',
            'employee.accountInformation',
            'employee.personalInformation',
        ])->findOrFail($id);

        return response()->json(['data' => $payroll]);
    }

    public function runPayroll(Request $request)
    {
        Log::info('RUN PAYROLL PAYLOAD', $request->all());

        $validated = $request->validate([
            'pay_period_start' => 'required|date',
            'pay_period_end'   => 'required|date|after_or_equal:pay_period_start',
            'payment_date'     => 'required|date',
            'pay_type'         => 'required|in:Monthly,Semi-Monthly,Bi-Weekly,Weekly',
            'employee_ids'     => 'required|array|min:1',
            'employee_ids.*'   => 'required|string',
        ]);

        // Year used for all bracket lookups in this run
        $payYear = Carbon::parse($validated['pay_period_start'])->year;

        DB::beginTransaction();

        try {
            $created         = 0;
            $errors          = [];
            $createdPayrolls = [];

            $otRates = $this->getOtRates();
            $cfg     = $this->getConfig();

            foreach ($validated['employee_ids'] as $biometric_id) {

                $employee = Employee::where('biometric_id', $biometric_id)
                    ->with(['employmentInformation', 'accountInformation', 'personalInformation', 'shift'])
                    ->first();

                if (!$employee) {
                    $errors[] = "Employee not found: {$biometric_id}";
                    continue;
                }

                $employment = $employee->employmentInformation;

                if (!$employment || $employment->rate <= 0) {
                    $errors[] = "Invalid rate for {$employee->first_name}";
                    continue;
                }

                // ── Duplicate check ─────────────────────────────────────────
                $alreadyExists = Payroll::where('employee_id', $employee->id)
                    ->where('pay_period_start', $validated['pay_period_start'])
                    ->where('pay_period_end',   $validated['pay_period_end'])
                    ->exists();

                if ($alreadyExists) {
                    $errors[] = "Payroll already exists for {$employee->first_name} {$employee->last_name} ({$biometric_id}) on this period.";
                    continue;
                }

                // ── 1. Attendance data ──────────────────────────────────────
                $attendance = $this->calculateAttendanceData(
                    $employee->id,
                    $employee->biometric_id,
                    $validated['pay_period_start'],
                    $validated['pay_period_end'],
                    $employee->shift,
                    $otRates,
                    $cfg
                );

                $hourlyRate = $this->convertToHourlyRate(
                    (float) $employment->rate,
                    $employment->rate_type,
                    $cfg
                );

                $dailyRate = $hourlyRate * $cfg['hours_per_day'];

                // ── 2. Basic Pay ────────────────────────────────────────────
                $basicPay = $attendance['regular_hours'] * $hourlyRate;

                // ── 3. Leave Pay ────────────────────────────────────────────
                $leavePay = $attendance['leave_days'] * $cfg['leave_hours_per_day'] * $hourlyRate;

                // ── 4. OT Pay ───────────────────────────────────────────────
                $overtimePay = $this->calculateOvertimePay(
                    $hourlyRate,
                    $attendance['overtime_by_type'],
                    $otRates
                );

                // ── 5. Late deduction ───────────────────────────────────────
                $lateDeduction = $this->calculateLateDeduction(
                    $hourlyRate,
                    $attendance['late_minutes']
                );

                // ── 6. LWOP ─────────────────────────────────────────────────
                $lwop = $attendance['days_absent'] * $dailyRate;

                // ── 7. Gross ─────────────────────────────────────────────────
                $gross = $basicPay + $leavePay + $overtimePay;

                // ── 8. Cash Advance deduction ────────────────────────────────
                $cashAdvanceDeduction = $this->getCashAdvanceDeduction(
                    $employee->id,
                    $validated['pay_period_start'],
                    $validated['pay_period_end']
                );

                // ── 9. Deductions (now bracket-based) ────────────────────────
                $deductions = $this->calculateDeductions(
                    $gross,
                    $employee,
                    $lateDeduction,
                    $lwop,
                    $cashAdvanceDeduction,
                    $cfg,
                    $payYear
                );

                // ── 10. Net ───────────────────────────────────────────────────
                $net = $gross - $deductions['total'];

                Log::info('PAYROLL CALCULATION DEBUG', [
                    'employee'           => $employee->first_name . ' ' . $employee->last_name,
                    'biometric_id'       => $biometric_id,
                    'rate_raw'           => $employment->rate,
                    'rate_type'          => $employment->rate_type,
                    'hourly_rate'        => $hourlyRate,
                    'daily_rate'         => $dailyRate,
                    'days_worked'        => $attendance['days_worked'],
                    'regular_hours'      => $attendance['regular_hours'],
                    'leave_days'         => $attendance['leave_days'],
                    'days_absent'        => $attendance['days_absent'],
                    'total_working_days' => $attendance['total_working_days'],
                    'basic_pay'          => $basicPay,
                    'leave_pay'          => $leavePay,
                    'overtime_pay'       => $overtimePay,
                    'lwop'               => $lwop,
                    'cash_advance'       => $cashAdvanceDeduction,
                    'gross'              => $gross,
                    'tax'                => $deductions['tax'],
                    'nasfund'            => $deductions['nasfund'],
                    'ncsl'               => $deductions['ncsl'],
                    'nasfund_eligible'   => $this->isNasfundMember($employee),
                    'total_deductions'   => $deductions['total'],
                    'net_pay'            => $net,
                    'tax_source'         => $deductions['tax_source'],
                    'nasfund_source'     => $deductions['nasfund_source'],
                ]);

                $payroll = Payroll::create([
                    'employee_id'            => $employee->id,
                    'pay_period_start'       => $validated['pay_period_start'],
                    'pay_period_end'         => $validated['pay_period_end'],
                    'payment_date'           => $validated['payment_date'],
                    'pay_type'               => $validated['pay_type'],
                    'base_salary'            => $employment->rate,
                    'total_hours'            => $attendance['regular_hours'],
                    'overtime_hours'         => $attendance['total_overtime_hours'],
                    'overtime_pay'           => round($overtimePay, 2),
                    'leave_pay'              => round($leavePay, 2),
                    'leave_days'             => $attendance['leave_days'],
                    'lwop'                   => round($lwop, 2),
                    'cash_advance_deduction' => round($cashAdvanceDeduction, 2),
                    'gross_pay'              => round($gross, 2),
                    'bonuses'                => 0,
                    'deductions'             => $deductions['total'],
                    'tax'                    => $deductions['tax'],
                    'nasfund'                => $deductions['nasfund'],
                    'other_deductions'       => $deductions['other'],
                    'late_deduction'         => round($lateDeduction, 2),
                    'net_pay'                => round($net, 2),
                    'status'                 => 'Pending',
                    'days_worked'            => $attendance['days_worked'],
                    'days_absent'            => $attendance['days_absent'],
                    'days_late'              => $attendance['days_late'],
                ]);

                $createdPayrolls[] = $payroll;
                $created++;
            }

            if ($created === 0) {
                DB::rollBack();
                return response()->json([
                    'message' => 'No payroll records were created',
                    'errors'  => $errors,
                ], 422);
            }

            DB::commit();

            foreach ($createdPayrolls as $payroll) {
                app(PayslipController::class)->generate($payroll->id);
            }

            return response()->json([
                'message' => 'Payroll processed successfully',
                'records' => $created,
                'errors'  => $errors,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('PAYROLL FAILED', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            return response()->json([
                'message' => 'Payroll failed',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ══════════════════════════════════════════════════════════════════════════

    private function calculateAttendanceData(
        $employeeId,
        $biometricId,
        $startDate,
        $endDate,
        $shift = null,
        array $otRates = [],
        array $cfg = []
    ): array {
        if (empty($cfg)) $cfg = $this->getConfig();
        $periodStart = Carbon::parse($startDate)->startOfDay();
        $periodEnd   = Carbon::parse($endDate)->endOfDay();

        $attendances = Attendance::where('employee_id', $employeeId)
            ->whereBetween('date', [
                Carbon::parse($startDate)->toDateString(),
                Carbon::parse($endDate)->toDateString(),
            ])
            ->get();

        $daysWorked   = 0;
        $daysLate     = 0;
        $lateMinutes  = 0;
        $regularHours = 0;

        $totalWorkingDays = 0;
        for ($d = $periodStart->copy(); $d->lte($periodEnd); $d->addDay()) {
            if (!$d->isSunday()) {
                $totalWorkingDays++;
            }
        }

        $publicHolidayDates = DB::table('public_holidays')
            ->whereBetween('date', [
                Carbon::parse($startDate)->toDateString(),
                Carbon::parse($endDate)->toDateString(),
            ])
            ->pluck('date')
            ->map(fn($d) => Carbon::parse($d)->toDateString())
            ->toArray();

        foreach ($attendances as $att) {
            $status    = strtolower($att->status ?? '');
            $attDate   = Carbon::parse($att->date)->toDateString();
            $isHoliday = in_array($attDate, $publicHolidayDates);

            if ($status === 'public holiday' || $isHoliday) {
                $daysWorked++;
                $regularHours += $cfg['hours_per_day'];
                $publicHolidayDates = array_filter($publicHolidayDates, fn($d) => $d !== $attDate);
                continue;
            }

            if (!in_array($status, ['present', 'late'])) {
                continue;
            }

            $daysWorked++;
            $regularHours += $cfg['hours_per_day'];

            $timeIn = $this->buildDateTime($att->date, $att->am_time_in ?? $att->pm_time_in);
            if ($timeIn) {
                if ($shift) {
                    $parts         = explode(':', $shift->start_time);
                    $scheduleStart = Carbon::parse($att->date)->setTime((int)$parts[0], (int)$parts[1], 0);
                    if ((int)$parts[0] >= 18 && $timeIn->hour < 12) {
                        $scheduleStart->subDay();
                    }
                } else {
                    $scheduleStart = Carbon::parse($att->date)->setTime(8, 0, 0);
                }

                $grace = $scheduleStart->copy()->addMinutes(15);

                if ($timeIn->gt($grace)) {
                    $daysLate++;
                    $lateMinutes += (int) $scheduleStart->diffInMinutes($timeIn);
                }
            }
        }

        foreach ($publicHolidayDates as $holidayDate) {
            if (Carbon::parse($holidayDate)->isSunday()) continue;
            $daysWorked++;
            $regularHours += $cfg['hours_per_day'];
        }

        $leaveDays = 0;
        $leaveApps = DB::table('applications')
            ->where('biometric_id', $biometricId)
            ->where('application_type', 'Leave')
            ->where('status', 'Posted')
            ->whereBetween('date_from', [
                Carbon::parse($startDate)->toDateString(),
                Carbon::parse($endDate)->toDateString(),
            ])
            ->get();

        foreach ($leaveApps as $leave) {
            if (strtolower($leave->leave_duration ?? '') === 'half day') {
                $leaveDays += 0.5;
            } else {
                $from = Carbon::parse($leave->date_from);
                $to   = Carbon::parse($leave->date_to);
                $leaveDays += $from->diffInDays($to) + 1;
            }
        }

        $overtimeByType = array_fill_keys(array_keys($otRates), 0);
        if (empty($overtimeByType)) {
            $overtimeByType = array_fill_keys(array_keys($this->getOtRates()), 0);
        }

        $otApps = DB::table('applications')
            ->where('biometric_id', $biometricId)
            ->where('application_type', 'Overtime')
            ->where('status', 'Posted')
            ->whereBetween('date_from', [
                Carbon::parse($startDate)->toDateString(),
                Carbon::parse($endDate)->toDateString(),
            ])
            ->get();

        foreach ($otApps as $ot) {
            if ($ot->time_from && $ot->time_to) {
                $tIn  = Carbon::parse($ot->date_from . ' ' . $ot->time_from);
                $tOut = Carbon::parse($ot->date_from . ' ' . $ot->time_to);
                if ($tOut->lt($tIn)) $tOut->addDay();

                $hours = round($tIn->diffInMinutes($tOut) / 60, 2);
                $type  = $ot->overtime_type ?? 'Regular OT';

                if (isset($overtimeByType[$type])) {
                    $overtimeByType[$type] += $hours;
                } else {
                    $fallbackType = isset($overtimeByType['Regular OT']) ? 'Regular OT' : array_key_first($overtimeByType);
                    if ($fallbackType) $overtimeByType[$fallbackType] += $hours;
                }
            }
        }

        $totalOtHours = array_sum($overtimeByType);

        $daysAbsent = Attendance::where('employee_id', $employeeId)
            ->whereBetween('date', [
                Carbon::parse($startDate)->toDateString(),
                Carbon::parse($endDate)->toDateString(),
            ])
            ->whereRaw('LOWER(status) = ?', ['absent'])
            ->count();

        if ($attendances->isEmpty() && $leaveDays == 0) {
            $daysWorked   = $totalWorkingDays;
            $regularHours = $totalWorkingDays * $cfg['hours_per_day'];
        }

        return [
            'regular_hours'        => round($regularHours, 2),
            'days_worked'          => $daysWorked,
            'days_absent'          => $daysAbsent,
            'days_late'            => $daysLate,
            'late_minutes'         => $lateMinutes,
            'total_working_days'   => $totalWorkingDays,
            'leave_days'           => $leaveDays,
            'overtime_by_type'     => $overtimeByType,
            'total_overtime_hours' => $totalOtHours,
        ];
    }

    private function calculateOvertimePay(float $hourlyRate, array $overtimeByType, array $otRates = []): float
    {
        if (empty($otRates)) $otRates = $this->getOtRates();
        $fallback = $otRates['Regular OT'] ?? 1.50;

        $total = 0;
        foreach ($overtimeByType as $type => $hours) {
            if ($hours <= 0) continue;
            $multiplier = $otRates[$type] ?? $fallback;
            $total += $hours * $multiplier * $hourlyRate;
        }
        return round($total, 2);
    }

    private function calculateLateDeduction(float $hourlyRate, int $lateMinutes): float
    {
        if ($lateMinutes <= 0) return 0;
        return round(($lateMinutes / 60) * $hourlyRate, 2);
    }

    private function isNasfundMember(Employee $employee): bool
    {
        return $employee->accountInformation
            && $employee->accountInformation->nasfund == 1;
    }

    /**
     * Calculate all deductions using bracket tables where available,
     * falling back to flat rates from payroll_config when no bracket matches.
     *
     * Tax type and dependents come from personalInformation:
     *   - tax_type:   "W/ Declaration" | "No Declaration" | "Non-Resident"
     *   - dependents: integer (number of declared dependents)
     *
     * If personalInformation doesn't have these fields yet, defaults are used:
     *   - tax_type:  "No Declaration" (most conservative — highest tax)
     *   - dependents: 0
     */
    private function calculateDeductions(
        float $grossPay,
        Employee $employee,
        float $lateDeduction = 0,
        float $lwop = 0,
        float $cashAdvanceDeduction = 0,
        array $cfg = [],
        int   $year = 0
    ): array {
        if (empty($cfg))  $cfg  = $this->getConfig();
        if ($year === 0)  $year = now()->year;

        // ── Tax — bracket lookup ─────────────────────────────────────────────
        $personal   = $employee->personalInformation;
        $taxType    = $personal->tax_type    ?? 'No Declaration';
        $dependents = (int) ($personal->dependents ?? 0);

        $tax       = $this->lookupTax($grossPay, $taxType, $dependents, $year, $cfg['tax_rate']);
        $taxSource = ($tax === round($grossPay * $cfg['tax_rate'], 2)) ? 'flat_rate_fallback' : 'bracket_table';

        // ── NASFUND — bracket lookup (only for enrolled members) ─────────────
        $nasfund       = 0;
        $nasfundSource = 'not_applicable';

        if ($this->isNasfundMember($employee)) {
            $nasfund       = $this->lookupNasfund($grossPay, $year, $cfg['nasfund_rate']);
            $nasfundSource = ($nasfund === round($grossPay * $cfg['nasfund_rate'], 2))
                ? 'flat_rate_fallback'
                : 'bracket_table';
        }

        // ── NCSL — bracket lookup (returns 0 if not applicable) ──────────────
        $ncsl = $this->lookupNcsl($grossPay, $year);

        // ── Other deductions (late, LWOP, cash advance, NCSL) ────────────────
        $other = round($lateDeduction + $lwop + $cashAdvanceDeduction + $ncsl, 2);
        $total = round($tax + $nasfund + $other, 2);

        return [
            'tax'            => $tax,
            'nasfund'        => $nasfund,
            'ncsl'           => $ncsl,
            'other'          => $other,
            'total'          => $total,
            'tax_source'     => $taxSource,      
            'nasfund_source' => $nasfundSource,  
        ];
    }

    private function convertToHourlyRate(float $rate, string $rateType, array $cfg = []): float
    {
        if (empty($cfg)) $cfg = $this->getConfig();
        switch ($rateType) {
            case 'Hourly':
                return $rate;
            case 'Daily':
                return $rate / $cfg['hours_per_day'];
            case 'Monthly':
                return $rate / ($cfg['standard_days_per_month'] * $cfg['hours_per_day']);
            case 'Annual':
                return $rate / ($cfg['standard_days_per_month'] * 12 * $cfg['hours_per_day']);
            default:
                return 0;
        }
    }

    private function getCashAdvanceDeduction(
        $employeeId,
        $startDate,
        $endDate
    ): float {
        $advances = CashAdvance::where('employee_id', $employeeId)
            ->where('status', 'Approved')
            ->where('remaining_balance', '>', 0)
            ->whereDate('start_date', '<=', Carbon::parse($endDate)->toDateString())
            ->get();

        $total = 0;
        foreach ($advances as $advance) {
            $deduct = min((float) $advance->installment_amount, (float) $advance->remaining_balance);
            $advance->applyDeduction($deduct);
            $total += $deduct;
        }

        return round($total, 2);
    }

    private function buildDateTime($date, $time)
    {
        if (!$time || $time === '00:00:00') return null;

        $dateString = $date instanceof Carbon
            ? $date->format('Y-m-d')
            : Carbon::parse($date)->format('Y-m-d');

        $timeParts = explode(':', $time);
        $hours     = (int) $timeParts[0];
        $minutes   = (int) $timeParts[1];
        $seconds   = (int) ($timeParts[2] ?? 0);

        return Carbon::parse($dateString)->setTime($hours, $minutes, $seconds);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PAYROLL MANAGEMENT
    // ══════════════════════════════════════════════════════════════════════════

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:Pending,Approved,Paid,Rejected',
            'notes'  => 'nullable|string',
        ]);

        $payroll = Payroll::findOrFail($id);
        $payroll->update([
            'status' => $validated['status'],
            'notes'  => $validated['notes'] ?? $payroll->notes,
        ]);

        return response()->json([
            'message' => 'Payroll status updated successfully',
            'data'    => $payroll->load('employee'),
        ]);
    }

    public function bulkApprove(Request $request)
    {
        $validated = $request->validate([
            'payroll_ids'   => 'required|array',
            'payroll_ids.*' => 'exists:payrolls,id',
        ]);

        DB::beginTransaction();
        try {
            Payroll::whereIn('id', $validated['payroll_ids'])
                ->where('status', 'Pending')
                ->update(['status' => 'Approved']);
            DB::commit();
            return response()->json(['message' => 'Payrolls approved successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to approve payrolls',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        $payroll = Payroll::findOrFail($id);
        if ($payroll->status === 'Paid') {
            return response()->json(['message' => 'Cannot delete paid payroll records'], 403);
        }
        $payroll->delete();
        return response()->json(['message' => 'Payroll record deleted successfully']);
    }

    public function summary(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
        ]);

        $summary = Payroll::whereBetween(
            'pay_period_start',
            [$validated['start_date'], $validated['end_date']]
        )
            ->selectRaw('DATE_FORMAT(pay_period_start, "%Y-%m") as period, SUM(net_pay) as amount')
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        return response()->json($summary);
    }
}
