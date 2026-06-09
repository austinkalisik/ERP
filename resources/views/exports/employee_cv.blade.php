<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Employee CV - {{ $employee->fullname }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
            font-size: 11px;
        }
        .header {
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 3px solid #f4c542;
            padding-bottom: 15px;
        }
        .header h1 { margin: 0; color: #0d6efd; font-size: 24px; }
        .header p  { margin: 5px 0; color: #666; font-size: 12px; }
        .section   { margin-bottom: 20px; page-break-inside: avoid; }
        .section-title {
            background: #0d6efd;
            color: white;
            padding: 8px 12px;
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .info-grid    { display: table; width: 100%; border-collapse: collapse; }
        .info-row     { display: table-row; }
        .info-label   { display: table-cell; width: 35%; padding: 6px 10px; font-weight: bold; color: #555; border: 1px solid #e0e0e0; background: #f9f9f9; }
        .info-value   { display: table-cell; padding: 6px 10px; color: #333; border: 1px solid #e0e0e0; }
        .subsection-title { font-weight: bold; font-size: 12px; margin: 15px 0 8px 0; color: #0d6efd; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 15px; }
    </style>
</head>
<body>

@php
    // ✅ Load settings for currency and date formatting
    $s        = \Illuminate\Support\Facades\DB::table('system_settings')->first();
    $currency = $s->currency    ?? 'USD';
    $dateFmt  = $s->date_format ?? 'MM/DD/YYYY';
    $language = $s->language    ?? 'en';
    $tz       = $s->timezone    ?? 'Asia/Manila';

    function cvFmtDate(?string $d, string $fmt): string {
        if (!$d || $d === 'N/A') return 'N/A';
        try {
            $date = \Carbon\Carbon::parse($d);
            return match($fmt) {
                'DD/MM/YYYY' => $date->format('d/m/Y'),
                'YYYY-MM-DD' => $date->format('Y-m-d'),
                'DD-MM-YYYY' => $date->format('d-m-Y'),
                'MM-DD-YYYY' => $date->format('m-d-Y'),
                'DD.MM.YYYY' => $date->format('d.m.Y'),
                default      => $date->format('M d, Y'),
            };
        } catch (\Exception $e) {
            return $d; // return raw if unparseable
        }
    }

    function cvFmtCurrency($amount, string $currency, string $language): string {
        $amount = (float) $amount;
        if (class_exists('NumberFormatter')) {
            $fmt = new \NumberFormatter($language, \NumberFormatter::CURRENCY);
            return $fmt->formatCurrency($amount, $currency);
        }
        $symbols = [
            'USD' => '$',  'EUR' => '€',  'GBP' => '£',
            'JPY' => '¥',  'AUD' => 'A$', 'CAD' => 'C$',
            'PGK' => 'K',  'PHP' => '₱',  'SGD' => 'S$',
            'NZD' => 'NZ$','CHF' => 'CHF','INR' => '₹',
        ];
        $symbol = $symbols[$currency] ?? $currency . ' ';
        return $symbol . number_format($amount, 2);
    }
@endphp

    <!-- HEADER -->
    <div class="header">
        <h1>{{ $employee->fullname }}</h1>
        <p><strong>Employee ID:</strong> {{ $employee->biometric_id }}</p>
        <p><strong>{{ $employee->position ?? 'N/A' }}</strong> - {{ $employee->department ?? 'N/A' }}</p>
    </div>

    <!-- PERSONAL INFORMATION -->
    <div class="section">
        <div class="section-title">PERSONAL INFORMATION</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Full Name:</div>
                <div class="info-value">{{ $employee->fullname }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Birthdate:</div>
                {{-- ✅ WAS: $employee->birthdate raw --}}
                <div class="info-value">{{ cvFmtDate($employee->birthdate ?? null, $dateFmt) }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Age:</div>
                <div class="info-value">{{ $employee->age ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Birth Place:</div>
                <div class="info-value">{{ $employee->birthplace ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Gender:</div>
                <div class="info-value">{{ $employee->gender ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Civil Status:</div>
                <div class="info-value">{{ $employee->civil_status ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Religion:</div>
                <div class="info-value">{{ $employee->religion ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Nationality:</div>
                <div class="info-value">{{ $employee->nationality ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Mobile Number:</div>
                <div class="info-value">{{ $employee->mobile_number ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Email Address:</div>
                <div class="info-value">{{ $employee->email_address ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Dependents:</div>
                <div class="info-value">{{ $employee->dependents ?? '0' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Lodged:</div>
                <div class="info-value">{{ $employee->lodged ?? 'N/A' }}</div>
            </div>
        </div>

        <div class="subsection-title">Address Information</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Present Address:</div>
                <div class="info-value">{{ $employee->present_address ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Home Address:</div>
                <div class="info-value">{{ $employee->home_address ?? 'N/A' }}</div>
            </div>
        </div>

        <div class="subsection-title">Emergency Contact</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Contact Person:</div>
                <div class="info-value">{{ $employee->emergency_contact ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Contact Number:</div>
                <div class="info-value">{{ $employee->emergency_number ?? 'N/A' }}</div>
            </div>
        </div>
    </div>

    <!-- EMPLOYMENT INFORMATION -->
    <div class="section">
        <div class="section-title">EMPLOYMENT INFORMATION</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Department:</div>
                <div class="info-value">{{ $employee->department ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Position:</div>
                <div class="info-value">{{ $employee->position ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Department Head:</div>
                <div class="info-value">{{ $employee->department_head ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Immediate Supervisor:</div>
                <div class="info-value">{{ $employee->supervisor ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Job Location:</div>
                <div class="info-value">{{ $employee->job_location ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Employment Classification:</div>
                <div class="info-value">{{ $employee->employment_classification ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Employee Type:</div>
                <div class="info-value">{{ $employee->employee_type ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Company Email:</div>
                <div class="info-value">{{ $employee->company_email ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Rate Type:</div>
                <div class="info-value">{{ $employee->rate_type ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Rate:</div>
                {{-- ✅ WAS: "USD {{ number_format($employee->rate ?? 0, 2) }}" hardcoded --}}
                <div class="info-value">{{ cvFmtCurrency($employee->rate ?? 0, $currency, $language) }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Date Started:</div>
                {{-- ✅ WAS: $employee->date_started raw --}}
                <div class="info-value">{{ cvFmtDate($employee->date_started ?? null, $dateFmt) }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Date Ended:</div>
                {{-- ✅ WAS: $employee->date_ended raw --}}
                <div class="info-value">{{ cvFmtDate($employee->date_ended ?? null, $dateFmt) }}</div>
            </div>
        </div>
    </div>

    <!-- ACCOUNT INFORMATION -->
    <div class="section">
        <div class="section-title">ACCOUNT INFORMATION</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Nasfund Number:</div>
                <div class="info-value">{{ $employee->nasfund_number ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">TIN Number:</div>
                <div class="info-value">{{ $employee->tin_number ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Work Permit Number:</div>
                <div class="info-value">{{ $employee->work_permit_number ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Work Permit Expiry:</div>
                <div class="info-value">{{ cvFmtDate($employee->work_permit_expiry ?? null, $dateFmt) }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Visa Number:</div>
                <div class="info-value">{{ $employee->visa_number ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Visa Expiry:</div>
                <div class="info-value">{{ cvFmtDate($employee->visa_expiry ?? null, $dateFmt) }}</div>
            </div>
        </div>
    </div>

    <!-- BANK INFORMATION -->
    <div class="section">
        <div class="section-title">BANK INFORMATION</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Bank Name:</div>
                <div class="info-value">{{ $employee->bank_name ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Account Number:</div>
                <div class="info-value">{{ $employee->account_number ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Account Name:</div>
                <div class="info-value">{{ $employee->account_name ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Branch/BSB Code:</div>
                <div class="info-value">{{ $employee->bsb_code ?? 'N/A' }}</div>
            </div>
        </div>
    </div>

    <!-- BENEFITS INFORMATION -->
    <div class="section">
        <div class="section-title">BENEFITS INFORMATION</div>

        <div class="subsection-title">Leave Credits</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Vacation Leave ({{ $employee->vacation_year ?? 'N/A' }}):</div>
                <div class="info-value">{{ $employee->vacation_credits ?? 0 }} days</div>
            </div>
            <div class="info-row">
                <div class="info-label">Sick Leave ({{ $employee->sick_year ?? 'N/A' }}):</div>
                <div class="info-value">{{ $employee->sick_credits ?? 0 }} days</div>
            </div>
            <div class="info-row">
                <div class="info-label">Emergency Leave ({{ $employee->emergency_year ?? 'N/A' }}):</div>
                <div class="info-value">{{ $employee->emergency_credits ?? 0 }} days</div>
            </div>
        </div>

        <div class="subsection-title">De Minimis Benefits</div>
        @if(isset($allowances) && $allowances->count())
            <div class="info-grid">
                @foreach($allowances as $item)
                    <div class="info-row">
                        <div class="info-label">{{ ucwords(str_replace('_', ' ', $item->type)) }}:</div>
                        {{-- ✅ WAS: "{{ number_format($item->amount, 2) }} USD" hardcoded --}}
                        <div class="info-value">{{ cvFmtCurrency($item->amount, $currency, $language) }}</div>
                    </div>
                @endforeach
            </div>
        @else
            <p style="font-size: 11px; color: #777;">No de minimis benefits recorded.</p>
        @endif
    </div>

    <!-- FOOTER -->
    <div class="footer">
       
        Generated on {{ \Carbon\Carbon::now($tz)->format('l, F d, Y - h:i A') }}
    </div>

</body>
</html>