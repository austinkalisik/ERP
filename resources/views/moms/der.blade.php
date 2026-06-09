<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 7px; color: #000; }

  /* ── Header ─────────────────────────────────────────────────────────── */
  .header-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  .header-table td { padding: 3px 5px; border: 1px solid #000; }
  .banner-left  { background: #2d2d2d; color: #fff; font-weight: bold; font-size: 9px; text-align: center; width: 18%; }
  .banner-mid   { background: #2d2d2d; color: #fff; font-weight: bold; font-size: 8px; text-align: center; width: 35%; }
  .banner-right { background: #cc0000; color: #fff; font-weight: bold; font-size: 18px; text-align: center; width: 47%; }
  .lbl  { background: #d9d9d9; font-weight: bold; width: 18%; }
  .val  { background: #fff; width: 30%; font-weight: bold; }
  .rlbl { background: #d9d9d9; font-weight: bold; text-align: right; width: 28%; }
  .rval { background: #ffff00; font-weight: bold; text-align: center; width: 24%; }

  /* ── Grid ────────────────────────────────────────────────────────────── */
  .grid-table { width: 100%; border-collapse: collapse; }
  .grid-table th, .grid-table td { border: 1px solid #555; padding: 1px 2px; text-align: center; }

  .th-cat  { background: #2d2d2d; color: #fff; font-weight: bold; width: 14%; text-align: left; padding-left: 3px; }
  .th-act  { background: #2d2d2d; color: #fff; font-weight: bold; width: 17%; text-align: left; padding-left: 3px; }
  .th-slot { background: #2d2d2d; color: #fff; font-weight: bold; font-size: 5px; width: 1.35%; padding: 1px 0; }
  .th-slot-alt { background: #555; color: #aaa; font-weight: bold; font-size: 5px; width: 1.35%; padding: 1px 0; }
  .th-total { background: #ff6600; color: #fff; font-weight: bold; width: 4%; }

  .td-cat  { text-align: left; padding-left: 3px; font-size: 6.5px; }
  .td-act  { text-align: left; padding-left: 3px; font-size: 6.5px; }
  .td-total { font-weight: bold; font-size: 7px; }

  /* Category fill colors */
  .fill-OT  { background: #92d050; color: #000; font-weight: bold; font-size: 5px; }
  .fill-OD  { background: #ffff00; color: #000; font-weight: bold; font-size: 5px; }
  .fill-OS  { background: #00b0f0; color: #fff; font-weight: bold; font-size: 5px; }
  .fill-PL  { background: #7030a0; color: #fff; font-weight: bold; font-size: 5px; }
  .fill-BL  { background: #cc0000; color: #fff; font-weight: bold; font-size: 5px; }
  .fill-BLO { background: #cc0000; color: #fff; font-weight: bold; font-size: 5px; }
  .fill-empty-even { background: #f7f7f7; }
  .fill-empty-odd  { background: #fff; }
  .total-highlight { background: #ffff00; }

  /* ── Material block ─────────────────────────────────────────────────── */
  .section-hdr { background: #2d2d2d; color: #fff; font-weight: bold; padding: 3px 5px;
                 font-size: 8px; margin-top: 6px; margin-bottom: 2px; }

  /* ── Summary ─────────────────────────────────────────────────────────── */
  .summary-table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  .summary-table td { border: 2px solid #000; padding: 4px 6px; font-weight: bold;
                      font-size: 8px; text-align: center; }
  .s-OT  { background: #92d050; color: #000; }
  .s-OD  { background: #ffff00; color: #000; }
  .s-OS  { background: #00b0f0; color: #fff; }
  .s-PL  { background: #7030a0; color: #fff; }
  .s-BL  { background: #cc0000; color: #fff; }
  .s-BLO { background: #cc0000; color: #fff; }
</style>
</head>
<body>

{{-- ── HEADER ────────────────────────────────────────────────────────────── --}}
<table class="header-table">
  <tr>
    <td class="banner-left"  rowspan="2">DAILY EQUIPMENT<br>REPORT</td>
    <td class="banner-mid"   rowspan="2">OK TEDI MINING<br><span style="font-size:6px">OUR MINE · OUR PRIDE · OUR FUTURE</span></td>
    <td class="banner-right" rowspan="2">CA</td>
  </tr>
  <tr></tr>
  <tr>
    <td class="lbl">OPERATOR NAME:</td>
    <td class="val">{{ $operator_name }}</td>
    <td class="rlbl">EXCAVATOR ID:</td>
    <td class="rval">{{ $excavator_id }}</td>
  </tr>
  <tr>
    <td class="lbl">OPERATOR ID:</td>
    <td class="val">{{ $operator_id }}</td>
    <td class="rlbl">SMU READING – START:</td>
    <td class="rval">{{ $smu_start }}</td>
  </tr>
  <tr>
    <td class="lbl">DATE:</td>
    <td class="val">{{ $date }}</td>
    <td class="rlbl">SMU READING – END:</td>
    <td class="rval">{{ $smu_end }}</td>
  </tr>
  <tr>
    <td class="lbl">CREW:</td>
    <td class="val">{{ $crew }}</td>
    <td class="rlbl">SHIFT:</td>
    <td class="rval">{{ $shift }}</td>
  </tr>
  <tr>
    <td class="lbl"></td>
    <td class="val"></td>
    <td class="rlbl">SMU TOTAL (HRS):</td>
    <td class="rval">{{ $smu_total }}</td>
  </tr>
</table>

{{-- ── GRID ─────────────────────────────────────────────────────────────── --}}
<table class="grid-table">
  <thead>
    <tr>
      <th class="th-cat">Time CAT</th>
      <th class="th-act">ACTIVITY</th>
      @foreach($slots as $i => $slot)
        <th class="{{ $i % 2 === 0 ? 'th-slot' : 'th-slot-alt' }}">
          {{ $slot->format('H:i') }}
        </th>
      @endforeach
      <th class="th-total">TOTAL<br>HRS</th>
    </tr>
  </thead>
  <tbody>
    @foreach($rows as $rowIdx => $row)
      <tr>
        <td class="td-cat {{ $rowIdx % 2 === 0 ? 'fill-empty-even' : 'fill-empty-odd' }}">
          {{ explode('(', $row['cat'])[0] }}({{ $row['code'] }})
        </td>
        <td class="td-act {{ $rowIdx % 2 === 0 ? 'fill-empty-even' : 'fill-empty-odd' }}">
          {{ $row['act'] }}
        </td>
        @foreach($row['slots'] as $slotIdx => $active)
          @if($active)
            <td class="fill-{{ $row['code'] }}">{{ $row['code'] }}</td>
          @else
            <td class="{{ $rowIdx % 2 === 0 ? 'fill-empty-even' : 'fill-empty-odd' }}"></td>
          @endif
        @endforeach
        <td class="td-total {{ $row['total'] > 0 ? 'total-highlight' : '' }}">
          {{ $row['total'] > 0 ? $row['total'] : '0' }}
        </td>
      </tr>
    @endforeach
  </tbody>
</table>

{{-- ── MATERIAL / SOURCE BLOCK ─────────────────────────────────────────── --}}
<div class="section-hdr">Material / Source Block</div>
<table class="grid-table">
  @foreach(['Mining Area 1', '', 'Mining Area 2', ''] as $area)
    <tr>
      <td class="td-cat fill-empty-even" style="width:14%">{{ $area }}</td>
      <td class="td-act fill-empty-even" style="width:17%"></td>
      @for($i = 0; $i < 48; $i++)
        <td class="fill-empty-even" style="width:1.35%"></td>
      @endfor
      <td class="td-total fill-empty-even" style="width:4%"></td>
    </tr>
  @endforeach
</table>

{{-- ── TIME CAT SUMMARY ────────────────────────────────────────────────── --}}
<div class="section-hdr">TIME CAT SUMMARY</div>
<table class="summary-table">
  <tr>
    <td class="s-OT">READY HOURS<br>{{ number_format($cat_sum['OT'], 2) }}</td>
    <td class="s-OD">OP DELAYS<br>{{ number_format($cat_sum['OD'], 2) }}</td>
    <td class="s-OS">OP STANDBY<br>{{ number_format($cat_sum['OS'], 2) }}</td>
    <td class="s-PL">PLANNED LOSS (PL)<br>{{ number_format($cat_sum['PL'], 2) }}</td>
    <td class="s-BL">BR LOSS<br>{{ number_format($cat_sum['BL'], 2) }}</td>
    <td class="s-BLO">BR LOSS OTHERS<br>{{ number_format($cat_sum['BLO'], 2) }}</td>
  </tr>
</table>

</body>
</html>