<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        @page { margin: 15mm; size: landscape; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; font-size: 9px; color: #1e293b; margin: 0; padding: 0; line-height: 1.4; }
        .document-header { margin-bottom: 20px; padding: 20px; background: #f8fafc; border-left: 4px solid #667eea; border-radius: 4px; }
        .header-top { display: table; width: 100%; margin-bottom: 15px; }
        .company-info { display: table-cell; vertical-align: top; width: 50%; }
        .company-name { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; }
        .company-tagline { font-size: 9px; color: #64748b; margin: 0; }
        .report-info { display: table-cell; vertical-align: top; text-align: right; width: 50%; }
        .report-title { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px; }
        .report-subtitle { font-size: 10px; color: #64748b; margin: 0; }
        .metadata-grid { display: table; width: 100%; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        .metadata-item { display: table-cell; padding: 0 20px 0 0; }
        .metadata-label { font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 2px; }
        .metadata-value { font-size: 11px; color: #0f172a; font-weight: 600; }
        table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 15px; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden; }
        thead { background: #0f172a; }
        th { font-weight: 600; text-align: left; padding: 10px 12px; font-size: 8px; text-transform: uppercase; letter-spacing: 0.8px; color: #ffffff; border-bottom: 2px solid #334155; border-right: 1px solid #334155; }
        th:last-child { border-right: none; }
        td { padding: 9px 12px; font-size: 9px; color: #334155; border-bottom: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; vertical-align: middle; }
        td:last-child { border-right: none; }
        tbody tr:nth-child(even) { background-color: #fafafa; }
        tbody tr:nth-child(odd)  { background-color: #ffffff; }
        tbody tr:last-child td   { border-bottom: none; }
        .status-pill { display: inline-block; padding: 3px 9px; border-radius: 3px; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .status-active    { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .status-approved  { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
        .status-completed { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
        .status-paid      { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
        .status-fulfilled { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
        .status-present   { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
        .status-pending    { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .status-processing { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .status-late       { background: #fed7aa; color: #9a3412; border: 1px solid #fdba74; }
        .status-rejected  { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .status-cancelled { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .status-failed    { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .status-absent    { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .status-draft     { background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
        .status-default   { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
        .document-footer { position: fixed; bottom: 0; left: 0; right: 0; padding: 8px 15mm; background: #f8fafc; border-top: 2px solid #e2e8f0; font-size: 8px; color: #64748b; }
        .footer-grid   { display: table; width: 100%; }
        .footer-left   { display: table-cell; width: 40%; vertical-align: middle; }
        .footer-center { display: table-cell; width: 20%; text-align: center; vertical-align: middle; font-weight: 600; }
        .footer-right  { display: table-cell; width: 40%; text-align: right; vertical-align: middle; }
        .footer-brand  { font-weight: 700; color: #0f172a; }
        .empty-state   { text-align: center; padding: 60px 20px; background: #fafafa; border: 2px dashed #e2e8f0; border-radius: 6px; margin-top: 30px; }
        .empty-icon    { font-size: 32px; color: #cbd5e1; margin-bottom: 12px; }
        .empty-title   { font-size: 14px; font-weight: 600; color: #475569; margin: 0 0 6px 0; }
        .empty-message { font-size: 11px; color: #94a3b8; margin: 0; }
        .page-break    { page-break-after: always; }
        .no-page-break { page-break-inside: avoid; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        .number-value  { font-family: 'Courier New', monospace; font-weight: 600; }
        .emphasis      { font-weight: 600; color: #0f172a; }
    </style>
</head>
<body>

@php
    // ✅ Load settings for currency and date formatting
    $s        = \Illuminate\Support\Facades\DB::table('system_settings')->first();
    $currency = $s->currency    ?? 'USD';
    $language = $s->language    ?? 'en';
    $tz       = $s->timezone    ?? 'UTC';

    // Build currency symbol for fallback display
    $currencySymbols = [
        'USD' => '$',  'EUR' => '€',  'GBP' => '£',
        'JPY' => '¥',  'AUD' => 'A$', 'CAD' => 'C$',
        'PGK' => 'K',  'PHP' => '₱',  'SGD' => 'S$',
        'NZD' => 'NZ$','CHF' => 'CHF','INR' => '₹',
    ];
    $currencySymbol = $currencySymbols[$currency] ?? ($currency . ' ');

    function tplFmtCurrency($amount, string $currency, string $language, string $symbol): string {
        $amount = (float) $amount;
        if (class_exists('NumberFormatter')) {
            $fmt = new \NumberFormatter($language, \NumberFormatter::CURRENCY);
            return $fmt->formatCurrency($amount, $currency);
        }
        return $symbol . number_format($amount, 2);
    }
@endphp

    <!-- Document Header -->
    <div class="document-header">
        <div class="header-top">
            <div class="company-info">
                <div class="company-name">ERP SYSTEM</div>
                <div class="company-tagline">Enterprise Resource Planning • Professional Reporting</div>
            </div>
            <div class="report-info">
                <div class="report-title">{{ $title }}</div>
                <div class="report-subtitle">{{ ucwords(str_replace('_', ' ', $type)) }} Report</div>
            </div>
        </div>

        <div class="metadata-grid">
            <div class="metadata-item">
                <div class="metadata-label">Generated Date</div>
                <div class="metadata-value">{{ $generated_at }}</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">Generated Time</div>
                <div class="metadata-value">{{ now($tz)->format('h:i A') }}</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">Total Records</div>
                <div class="metadata-value">{{ number_format(count($data)) }}</div>
            </div>
            <div class="metadata-item">
                <div class="metadata-label">Report ID</div>
                <div class="metadata-value">#{{ strtoupper(substr(md5($title . now()), 0, 8)) }}</div>
            </div>
        </div>
    </div>

    @if(count($data) > 0)
        <table>
            <thead>
                <tr>
                    @foreach(array_keys((array)$data[0]) as $header)
                        <th>{{ ucwords(str_replace('_', ' ', $header)) }}</th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @foreach($data as $index => $row)
                    <tr class="no-page-break">
                        @foreach((array)$row as $key => $value)
                            <td>
                                @if($value === null || $value === '')
                                    <span style="color: #cbd5e1;">—</span>
                                @elseif(strtolower($key) === 'status')
                                    @php
                                        $statusLower = strtolower(str_replace(' ', '', $value));
                                        $statusClass = 'status-' . $statusLower;
                                        if(!in_array($statusLower, ['active','approved','completed','paid','fulfilled','present','pending','processing','late','rejected','cancelled','failed','absent','draft'])) {
                                            $statusClass = 'status-default';
                                        }
                                    @endphp
                                    <span class="status-pill {{ $statusClass }}">{{ $value }}</span>
                                @elseif(is_numeric($value) && (strpos($key, 'salary') !== false || strpos($key, 'amount') !== false || strpos($key, 'price') !== false || strpos($key, 'total') !== false))
                                    {{-- ✅ WAS: hardcoded "${{ number_format(...) }}" --}}
                                    <span class="number-value">{{ tplFmtCurrency($value, $currency, $language, $currencySymbol) }}</span>
                                @elseif(strpos($key, 'id') !== false || strpos($key, 'number') !== false)
                                    <span class="emphasis">{{ $value }}</span>
                                @else
                                    {{ $value }}
                                @endif
                            </td>
                        @endforeach
                    </tr>

                    {{-- Page break every 32 rows --}}
                    @if(($index + 1) % 32 === 0 && ($index + 1) < count($data))
                        </tbody>
                        </table>
                        <div class="page-break"></div>
                        <table>
                            <thead>
                                <tr>
                                    @foreach(array_keys((array)$data[0]) as $header)
                                        <th>{{ ucwords(str_replace('_', ' ', $header)) }}</th>
                                    @endforeach
                                </tr>
                            </thead>
                            <tbody>
                    @endif
                @endforeach
            </tbody>
        </table>
    @else
        <div class="empty-state">
            <div class="empty-icon">📊</div>
            <div class="empty-title">No Data Available</div>
            <div class="empty-message">This report contains no records matching the selected criteria.</div>
        </div>
    @endif

    <!-- Document Footer -->
    <div class="document-footer">
        <div class="footer-grid">
            <div class="footer-left">
                <span class="footer-brand">ERP SYSTEM</span> • Confidential Document
            </div>
            <div class="footer-center">
                <span class="pageNumber"></span>
            </div>
            <div class="footer-right">
                
                {{ now($tz)->format('l, F j, Y • g:i A') }}
            </div>
        </div>
    </div>

    <script type="text/php">
        if (isset($pdf)) {
            $text = "Page {PAGE_NUM} of {PAGE_COUNT}";
            $size = 8;
            $font = $fontMetrics->getFont("helvetica", "bold");
            $width = $fontMetrics->get_text_width($text, $font, $size) / 2;
            $x = ($pdf->get_width() - $width) / 2;
            $y = $pdf->get_height() - 18;
            $pdf->page_text($x, $y, $text, $font, $size, array(0.3, 0.35, 0.4));
        }
    </script>
</body>
</html>