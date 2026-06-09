<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Employee List</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h2 { text-align: center; margin-bottom: 20px; color: #333; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { border: 1px solid #333; padding: 8px; text-align: left; }
        th { background: #4a9eff; color: white; font-weight: bold; }
        tbody tr:nth-child(even) { background: #f9f9f9; }
        tbody tr:hover { background: #e3f2fd; }
        .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #666; }
    </style>
</head>
<body>

@php
    // ✅ Load settings for date formatting
    $s       = \Illuminate\Support\Facades\DB::table('system_settings')->first();
    $dateFmt = $s->date_format ?? 'MM/DD/YYYY';
    $tz      = $s->timezone    ?? 'Asia/Manila';

    function empFmtDate(?string $d, string $fmt): string {
        if (!$d || $d === 'N/A') return 'N/A';
        $date = \Carbon\Carbon::parse($d);
        return match($fmt) {
            'DD/MM/YYYY' => $date->format('d/m/Y'),
            'YYYY-MM-DD' => $date->format('Y-m-d'),
            'DD-MM-YYYY' => $date->format('d-m-Y'),
            'MM-DD-YYYY' => $date->format('m-d-Y'),
            'DD.MM.YYYY' => $date->format('d.m.Y'),
            default      => $date->format('M d, Y'),
        };
    }
@endphp

<h2>Employee List</h2>

<table>
    <thead>
        <tr>
            <th>Biometric ID</th>
            <th>Full Name</th>
            <th>Department</th>
            <th>Position</th>
            <th>Hire Date</th>
            <th>Employment Status</th>
        </tr>
    </thead>
    <tbody>
        @forelse ($employees as $emp)
        <tr>
            <td>{{ $emp->biometric_id ?? 'N/A' }}</td>
            <td>{{ $emp->fullname ?? 'N/A' }}</td>
            <td>{{ $emp->department ?? 'N/A' }}</td>
            <td>{{ $emp->position ?? 'N/A' }}</td>
            {{-- ✅ WAS: $emp->hireDate raw — now formatted per settings --}}
            <td>{{ empFmtDate($emp->hireDate ?? null, $dateFmt) }}</td>
            <td>{{ $emp->employment_classification ?? 'N/A' }}</td>
        </tr>
        @empty
        <tr>
            <td colspan="6" style="text-align: center; padding: 20px;">No employees found</td>
        </tr>
        @endforelse
    </tbody>
</table>

<div class="footer">
   
    Generated on {{ \Carbon\Carbon::now($tz)->format('l, F d, Y - h:i A') }}
</div>

</body>
</html>