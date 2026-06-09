<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payslip - {{ $payroll->employee->first_name }} {{ $payroll->employee->last_name }}</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .company-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .payslip-title { font-size: 18px; color: #666; }
        .info-section { margin-bottom: 20px; }
        .info-row { margin-bottom: 8px; }
        .info-label { font-weight: bold; display: inline-block; width: 150px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f4f4f4; font-weight: bold; }
        .total-row { font-weight: bold; background-color: #f9f9f9; }
        .net-pay { font-size: 16px; font-weight: bold; color: #28a745; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #666; }
        .text-right { text-align: right; }
        .text-danger { color: #dc3545; }
    </style>
</head>
<body>

{{--
    ── SETTINGS HELPERS ──────────────────────────────────────────────────────
    $settings is passed from PayslipController::generate()
    It contains: currency, date_format, language (from system_settings table)
    Falls back to USD / M d, Y / en if settings not available.
--}}

@php
    $currency   = $settings->currency    ?? 'USD';
    $dateFmt    = $settings->date_format ?? 'MM/DD/YYYY';
    $language   = $settings->language    ?? 'en';

    /**
     * Format a monetary amount with the correct currency symbol.
     * Uses PHP's NumberFormatter (intl extension) when available,
     * falls back to a simple symbol prefix map otherwise.
     */
    $fmtCurrency = function ($amount, string $currency, string $language): string {
        $amount = (float) $amount;
        if (class_exists('NumberFormatter')) {
            $fmt = new NumberFormatter($language, NumberFormatter::CURRENCY);
            return $fmt->formatCurrency($amount, $currency);
        }
        // Fallback symbol map (covers most common currencies)
        $symbols = [
            'USD' => '$',  'EUR' => '€',  'GBP' => '£',
            'JPY' => '¥',  'AUD' => 'A$', 'CAD' => 'C$',
            'PGK' => 'K',  'PHP' => '₱',  'SGD' => 'S$',
            'NZD' => 'NZ$','CHF' => 'CHF','INR' => '₹',
        ];
        $symbol = $symbols[$currency] ?? $currency . ' ';
        return $symbol . number_format($amount, 2);
    };

    /**
     * Format a date string according to the saved date_format setting.
     * Supports: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, MM-DD-YYYY, DD.MM.YYYY
     */
    $fmtDate = function (?string $dateStr, string $dateFmt): string {
        if (!$dateStr) return 'N/A';
        $date = \Carbon\Carbon::parse($dateStr);
        return match($dateFmt) {
            'DD/MM/YYYY'  => $date->format('d/m/Y'),
            'YYYY-MM-DD'  => $date->format('Y-m-d'),
            'DD-MM-YYYY'  => $date->format('d-m-Y'),
            'MM-DD-YYYY'  => $date->format('m-d-Y'),
            'DD.MM.YYYY'  => $date->format('d.m.Y'),
            default       => $date->format('M d, Y'),  // MM/DD/YYYY → readable fallback
        };
    };
@endphp

    <div class="header">
        <div class="company-name">CAMP ADMINISTRATION LIMITED</div>
        <div class="payslip-title">EMPLOYEE PAYSLIP</div>
    </div>

    {{-- Employee & Period Info --}}
    <div class="info-section">
        <div class="info-row">
            <span class="info-label">Employee Name:</span>
            <span>{{ $payroll->employee->first_name }} {{ $payroll->employee->last_name }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Employee ID:</span>
            <span>{{ $payroll->employee->biometric_id }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Department:</span>
            <span>{{ $payroll->employee->employmentInformation->department->name ?? 'N/A' }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Position:</span>
            <span>{{ $payroll->employee->employmentInformation->position ?? 'N/A' }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Pay Period:</span>
            {{-- ✅ WAS: Carbon::parse()->format('M d, Y') hardcoded --}}
            <span>{{ $fmtDate($payroll->pay_period_start, $dateFmt) }} – {{ $fmtDate($payroll->pay_period_end, $dateFmt) }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Payment Date:</span>
            {{-- ✅ WAS: Carbon::parse()->format('M d, Y') hardcoded --}}
            <span>{{ $fmtDate($payroll->payment_date, $dateFmt) }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Pay Type:</span>
            <span>{{ $payroll->pay_type }}</span>
        </div>
    </div>

    {{-- EARNINGS --}}
    <table>
        <thead>
            <tr>
                <th>Earnings</th>
                <th class="text-right">Amount</th>
            </tr>
        </thead>
        <tbody>
            {{-- Basic Pay --}}
            <tr>
                <td>Basic Pay ({{ $payroll->days_worked }} days × 12 hrs/day)</td>
                {{-- ✅ WAS: number_format(..., 2) with no currency symbol --}}
                <td class="text-right">{{ $fmtCurrency($payroll->gross_pay - $payroll->overtime_pay - $payroll->leave_pay, $currency, $language) }}</td>
            </tr>

            {{-- Leave Pay --}}
            @if($payroll->leave_days > 0)
            <tr>
                <td>Leave Pay ({{ number_format($payroll->leave_days, 2) }} day(s) × 8 hrs)</td>
                <td class="text-right">{{ $fmtCurrency($payroll->leave_pay, $currency, $language) }}</td>
            </tr>
            @endif

            {{-- Overtime --}}
            @if($payroll->overtime_hours > 0)
            <tr>
                <td>Overtime Pay ({{ number_format($payroll->overtime_hours, 2) }} hrs)</td>
                <td class="text-right">{{ $fmtCurrency($payroll->overtime_pay, $currency, $language) }}</td>
            </tr>
            @endif

            {{-- Bonuses --}}
            @if($payroll->bonuses > 0)
            <tr>
                <td>Bonuses</td>
                <td class="text-right">{{ $fmtCurrency($payroll->bonuses, $currency, $language) }}</td>
            </tr>
            @endif

            <tr class="total-row">
                <td>GROSS PAY</td>
                <td class="text-right">{{ $fmtCurrency($payroll->gross_pay, $currency, $language) }}</td>
            </tr>
        </tbody>
    </table>

    {{-- DEDUCTIONS --}}
    <table>
        <thead>
            <tr>
                <th>Deductions</th>
                <th class="text-right">Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Tax (10%)</td>
                <td class="text-right text-danger">-{{ $fmtCurrency($payroll->tax, $currency, $language) }}</td>
            </tr>

            @if($payroll->nasfund > 0)
            <tr>
                <td>NASFUND (6%)</td>
                <td class="text-right text-danger">-{{ $fmtCurrency($payroll->nasfund, $currency, $language) }}</td>
            </tr>
            @endif

            @if($payroll->late_deduction > 0)
            <tr>
                <td>Late Deduction</td>
                <td class="text-right text-danger">-{{ $fmtCurrency($payroll->late_deduction, $currency, $language) }}</td>
            </tr>
            @endif

            @if($payroll->lwop > 0)
            <tr>
                <td>LWOP — Leave Without Pay ({{ $payroll->days_absent }} absent day(s))</td>
                <td class="text-right text-danger">-{{ $fmtCurrency($payroll->lwop, $currency, $language) }}</td>
            </tr>
            @endif

            @if($payroll->cash_advance_deduction > 0)
            <tr>
                <td>Cash Advance Deduction</td>
                <td class="text-right text-danger">-{{ $fmtCurrency($payroll->cash_advance_deduction, $currency, $language) }}</td>
            </tr>
            @endif

            <tr class="total-row">
                <td>TOTAL DEDUCTIONS</td>
                <td class="text-right text-danger">-{{ $fmtCurrency($payroll->deductions, $currency, $language) }}</td>
            </tr>
        </tbody>
    </table>

    {{-- NET PAY --}}
    <table>
        <tbody>
            <tr class="total-row">
                <td>NET PAY</td>
                <td class="text-right net-pay">{{ $fmtCurrency($payroll->net_pay, $currency, $language) }}</td>
            </tr>
        </tbody>
    </table>

    {{-- ATTENDANCE SUMMARY --}}
    <div class="info-section" style="margin-top: 30px;">
        <h4 style="margin-bottom: 15px;">Attendance Summary</h4>
        <div class="info-row">
            <span class="info-label">Days Worked:</span>
            <span>{{ $payroll->days_worked }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Days Absent (LWOP):</span>
            <span>{{ $payroll->days_absent }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Days Late:</span>
            <span>{{ $payroll->days_late }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Leave Days (Paid):</span>
            <span>{{ number_format($payroll->leave_days, 2) }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Regular Hours:</span>
            <span>{{ number_format($payroll->total_hours, 2) }} hrs</span>
        </div>
        @if($payroll->overtime_hours > 0)
        <div class="info-row">
            <span class="info-label">Overtime Hours:</span>
            <span>{{ number_format($payroll->overtime_hours, 2) }} hrs</span>
        </div>
        @endif
    </div>

    <div class="footer">
        <p>This is a computer-generated payslip. No signature is required.</p>
        
        <p>Generated on {{ $fmtDate(now()->toDateString(), $dateFmt) }} {{ now()->format('h:i A') }}</p>
    </div>

</body>
</html>
