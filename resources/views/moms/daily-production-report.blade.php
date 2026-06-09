<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 7px; color: #000; background: #fff; }

  /* ── Header — same as DER ── */
  .header-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  .header-table td { border: 1px solid #000; padding: 3px 5px; }
  .banner-left {
    background: #2d2d2d; color: #fff; font-weight: bold;
    font-size: 8px; text-align: center; width: 18%;
    line-height: 1.4;
  }
  .banner-mid {
    background: #2d2d2d; color: #fff; font-weight: bold;
    font-size: 9px; text-align: center; width: 47%;
    line-height: 1.4;
  }
  .banner-right {
    background: #cc0000; color: #fff; font-weight: bold;
    font-size: 22px; text-align: center; width: 35%;
    letter-spacing: 2px;
  }

  /* ── Section headers — same dark as DER ── */
  .section-hdr {
    background: #2d2d2d; color: #fff; font-weight: bold;
    padding: 3px 6px; font-size: 8px;
    margin-top: 8px; margin-bottom: 0;
  }

  /* ── Tables ── */
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #555; padding: 2px 3px; text-align: center; font-size: 6.5px; }

  /* Column group headers — dark like DER */
  .th-group { background: #2d2d2d; color: #fff; font-weight: bold; font-size: 6.5px; }
  .th-sub   { background: #555;    color: #ccc; font-weight: bold; font-size: 6px; }
  .th-col   { background: #2d2d2d; color: #fff; font-weight: bold; font-size: 6px; }

  .td-left { text-align: left; padding-left: 4px; }

  /* TIME CATEGORY — exact same as DER */
  .tc-ready   { background: #92d050; color: #000; font-weight: bold; }
  .tc-delays  { background: #ffff00; color: #000; font-weight: bold; }
  .tc-standby { background: #00b0f0; color: #fff; font-weight: bold; }
  .tc-pl      { background: #7030a0; color: #fff; font-weight: bold; }

  /* Total row — yellow highlight like DER totals */
  .total-row td {
    background: #f2f2f2;
    font-weight: bold;
    border-top: 2px solid #333;
    font-size: 7px;
  }

  /* Alternating data rows */
  .row-even { background: #f7f7f7; }
  .row-odd  { background: #fff; }

  .machine-id { font-weight: bold; }

  /* Footer */
  .report-footer { margin-top: 8px; font-size: 6px; color: #888; text-align: right; }
</style>
</head>
<body>

{{-- ── HEADER — matches DER style exactly ── --}}
<table class="header-table">
  <tr>
    <td class="banner-left" rowspan="2">
      DAILY PRODUCTION<br>SUMMARY REPORT
    </td>
    <td class="banner-mid" rowspan="2">
      OK TEDI MINING<br>
      <span style="font-size:6px; font-weight:normal;">OUR MINE · OUR PRIDE · OUR FUTURE</span>
    </td>
    <td class="banner-right" rowspan="2"><span style="color:#fff; font-style:italic;">C</span><span style="color:#000; font-style:italic;">A</span></td>
  </tr>
  <tr></tr>
  <tr>
    <td style="background:#d9d9d9; font-weight:bold;">DATE:</td>
    <td style="background:#fff; font-weight:bold;">{{ $report_date }}</td>
    <td style="background:#ffff00; font-weight:bold; text-align:center;">CAMP ADMIN MINING INTERIM</td>
  </tr>
  <tr>
    <td style="background:#d9d9d9; font-weight:bold;">GENERATED:</td>
    <td style="background:#fff;">{{ $generated_at }}</td>
    <td style="background:#fff;"></td>
  </tr>
</table>

{{-- ════════════════════════════════════════════ --}}
{{-- EXCAVATORS                                   --}}
{{-- ════════════════════════════════════════════ --}}
<div class="section-hdr">EXCAVATORS</div>
<table>
  <thead>
    <tr>
      <th class="th-col" rowspan="2" style="width:6%">EXCAVATORS</th>
      <th class="th-col" rowspan="2" style="width:9%">Asset Description</th>
      <th class="th-col" rowspan="2" style="width:4%">SHIFT</th>
      <th class="th-col" rowspan="2" style="width:18%">SOURCE</th>
      <th class="th-col" rowspan="2" style="width:12%">LOCATION</th>
      <th class="th-col" rowspan="2" style="width:6%">Tonnes</th>
      <th class="th-col" rowspan="2" style="width:7%">Tonnes / Operating Hour</th>
      <th class="th-group" colspan="4">TIME CATEGORY</th>
    </tr>
    <tr>
      <th class="tc-ready"   style="width:5%">READY</th>
      <th class="tc-delays"  style="width:5%">DELAYS</th>
      <th class="tc-standby" style="width:5%">STANDBY</th>
      <th class="tc-pl"      style="width:5%">PL</th>
    </tr>
  </thead>
  <tbody>
    @forelse($excavator_rows as $i => $row)
      <tr class="{{ $i % 2 === 0 ? 'row-even' : 'row-odd' }}">
        <td class="machine-id td-left">{{ $row['machine_id'] }}</td>
        <td class="td-left">{{ $row['description'] ?: '—' }}</td>
        <td>{{ $row['shift'] }}</td>
        <td class="td-left">{{ $row['source'] }}</td>
        <td class="td-left">{{ $row['location'] }}</td>
        <td>{{ $row['tons'] > 0 ? number_format($row['tons'], 3) : '0' }}</td>
        <td>{{ $row['tons_per_hr'] > 0 ? number_format($row['tons_per_hr'], 1) : '0.0' }}</td>
        <td class="tc-ready" >{{ number_format($row['ready'],    2) }}</td>
        <td class="tc-delays">{{ number_format($row['delays'],   2) }}</td>
        <td class="tc-standby">{{ number_format($row['standby'], 2) }}</td>
        <td class="tc-pl"    >{{ number_format($row['pl'],       2) }}</td>
      </tr>
    @empty
      <tr><td colspan="11" style="text-align:center;color:#aaa;padding:5px;font-style:italic;">No excavator operations recorded</td></tr>
    @endforelse
    @if(count($excavator_rows) > 0)
      <tr class="total-row">
        <td colspan="5" class="td-left">TOTAL</td>
        <td>{{ number_format($excavator_totals['tons'],    3) }}</td>
        <td></td>
        <td class="tc-ready" >{{ number_format($excavator_totals['ready'],   2) }}</td>
        <td class="tc-delays">{{ number_format($excavator_totals['delays'],  2) }}</td>
        <td class="tc-standby">{{ number_format($excavator_totals['standby'],2) }}</td>
        <td class="tc-pl"    >{{ number_format($excavator_totals['pl'],      2) }}</td>
      </tr>
    @endif
  </tbody>
</table>

{{-- ════════════════════════════════════════════ --}}
{{-- HAULING FLEET                                --}}
{{-- ════════════════════════════════════════════ --}}
<div class="section-hdr">HAULING FLEET</div>
<table>
  <thead>
    <tr>
      <th class="th-col" rowspan="3" style="width:5%">HAULING FLEET</th>
      <th class="th-col" rowspan="3" style="width:8%">Asset Description</th>
      <th class="th-col" rowspan="3" style="width:4%">SHIFT</th>
      <th class="th-col" rowspan="3" style="width:6%">EXCAVATOR</th>
      <th class="th-group" colspan="4">PRODUCTION</th>
      <th class="th-col" rowspan="3" style="width:9%">SOURCE</th>
      <th class="th-col" rowspan="3" style="width:9%">DESTINATION</th>
      <th class="th-group" colspan="4">TIME CATEGORY</th>
    </tr>
    <tr>
      <th class="th-sub" colspan="2">Expit Load count</th>
      <th class="th-sub" colspan="2">Expit Tonnes</th>
    </tr>
    <tr>
      <th class="th-col" style="width:4%">Other Dumps</th>
      <th class="th-col" style="width:4%">Sky Way Dump</th>
      <th class="th-col" style="width:4%">Other Dumps</th>
      <th class="th-col" style="width:4%">Sky Way Dump</th>
      <th class="tc-ready"   style="width:4%">READY</th>
      <th class="tc-delays"  style="width:4%">DELAYS</th>
      <th class="tc-standby" style="width:4%">STANDBY</th>
      <th class="tc-pl"      style="width:4%">PL</th>
    </tr>
  </thead>
  <tbody>
    @forelse($haul_rows as $i => $row)
      <tr class="{{ $i % 2 === 0 ? 'row-even' : 'row-odd' }}">
        <td class="machine-id td-left">{{ $row['machine_id'] }}</td>
        <td class="td-left">{{ $row['description'] ?: '—' }}</td>
        <td>{{ $row['shift'] }}</td>
        <td>{{ $row['excavator'] }}</td>
        <td>{{ $row['expit_load'] > 0 ? $row['expit_load'] : '0' }}</td>
        <td>0</td>
        <td>{{ $row['expit_tonnes'] > 0 ? number_format($row['expit_tonnes'], 3) : '0' }}</td>
        <td>0</td>
        <td class="td-left">{{ $row['source'] }}</td>
        <td class="td-left">{{ $row['destination'] }}</td>
        <td class="tc-ready" >{{ number_format($row['ready'],    2) }}</td>
        <td class="tc-delays">{{ number_format($row['delays'],   2) }}</td>
        <td class="tc-standby">{{ number_format($row['standby'], 2) }}</td>
        <td class="tc-pl"    >{{ number_format($row['pl'],       2) }}</td>
      </tr>
    @empty
      <tr><td colspan="14" style="text-align:center;color:#aaa;padding:5px;font-style:italic;">No hauling fleet operations recorded</td></tr>
    @endforelse
    @if(count($haul_rows) > 0)
      <tr class="total-row">
        <td colspan="3" class="td-left">TOTAL</td>
        <td></td>
        <td>{{ $haul_totals['expit_load'] }}</td>
        <td>0</td>
        <td>{{ number_format($haul_totals['expit_tonnes'], 3) }}</td>
        <td>0</td>
        <td colspan="2"></td>
        <td class="tc-ready" >{{ number_format($haul_totals['ready'],   2) }}</td>
        <td class="tc-delays">{{ number_format($haul_totals['delays'],  2) }}</td>
        <td class="tc-standby">{{ number_format($haul_totals['standby'],2) }}</td>
        <td class="tc-pl"    >{{ number_format($haul_totals['pl'],      2) }}</td>
      </tr>
    @endif
  </tbody>
</table>

{{-- ════════════════════════════════════════════ --}}
{{-- AUXILIARY                                    --}}
{{-- ════════════════════════════════════════════ --}}
<div class="section-hdr">AUXILIARY</div>
<table>
  <thead>
    <tr>
      <th class="th-col" style="width:6%">AUXILIARY</th>
      <th class="th-col" style="width:9%">Asset Description</th>
      <th class="th-col" style="width:4%">SHIFT</th>
      <th class="th-col" style="width:14%">LOCATION</th>
      <th class="th-col" style="width:34%">TASK</th>
      <th class="tc-ready"   style="width:5%">READY</th>
      <th class="tc-delays"  style="width:5%">DELAYS</th>
      <th class="tc-standby" style="width:5%">STANDBY</th>
      <th class="tc-pl"      style="width:5%">PL</th>
    </tr>
  </thead>
  <tbody>
    @forelse($aux_rows as $i => $row)
      <tr class="{{ $i % 2 === 0 ? 'row-even' : 'row-odd' }}">
        <td class="machine-id td-left">{{ $row['machine_id'] }}</td>
        <td class="td-left">{{ $row['description'] ?: '—' }}</td>
        <td>{{ $row['shift'] }}</td>
        <td class="td-left">{{ $row['location'] }}</td>
        <td class="td-left">{{ $row['task'] }}</td>
        <td class="tc-ready" >{{ number_format($row['ready'],    2) }}</td>
        <td class="tc-delays">{{ number_format($row['delays'],   2) }}</td>
        <td class="tc-standby">{{ number_format($row['standby'], 2) }}</td>
        <td class="tc-pl"    >{{ number_format($row['pl'],       2) }}</td>
      </tr>
    @empty
      <tr><td colspan="9" style="text-align:center;color:#aaa;padding:5px;font-style:italic;">No auxiliary operations recorded</td></tr>
    @endforelse
    @if(count($aux_rows) > 0)
      <tr class="total-row">
        <td colspan="5" class="td-left">TOTAL</td>
        <td class="tc-ready" >{{ number_format($aux_totals['ready'],   2) }}</td>
        <td class="tc-delays">{{ number_format($aux_totals['delays'],  2) }}</td>
        <td class="tc-standby">{{ number_format($aux_totals['standby'],2) }}</td>
        <td class="tc-pl"    >{{ number_format($aux_totals['pl'],      2) }}</td>
      </tr>
    @endif
  </tbody>
</table>

</body>
</html>