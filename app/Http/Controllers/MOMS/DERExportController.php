<?php

namespace App\Http\Controllers\MOMS;

use App\Http\Controllers\Controller;
use App\Models\MOMS\Assignment;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class DERExportController extends Controller
{
    /**
     * GET /api/moms/assignments/{id}/export-der?format=csv|pdf
     */
    public function export(int $id, Request $request)
    {
        $format = strtolower($request->query('format', 'csv'));

        $assignment = Assignment::with([
            'machine',
            'operator.user',
            'timeEntries',
        ])->findOrFail($id);

        return $format === 'pdf'
            ? $this->exportPdf($assignment)
            : $this->exportCsv($assignment);
    }

    // ── CSV ────────────────────────────────────────────────────────────────
    private function exportCsv(Assignment $assignment)
    {
        $machine     = $assignment->machine;
        $operator    = $assignment->operator?->user;
        $timeEntries = $assignment->timeEntries;

        $smuStart = (float) ($assignment->reading_start ?? 0);
        $smuEnd   = (float) ($assignment->reading_end   ?? 0);
        $smuTotal = round($smuEnd - $smuStart, 2);

        $filename = sprintf(
            'DER_%s_%s.csv',
            str_replace(' ', '_', $machine?->machine_id ?? 'MACHINE'),
            $assignment->start_time?->format('Ymd') ?? now()->format('Ymd')
        );

        $slots      = $this->buildSlots($assignment);
        $matrix     = $this->buildMatrix($timeEntries, $slots);
        $catSum     = ['OT' => 0, 'OD' => 0, 'OS' => 0, 'PL' => 0, 'BL' => 0, 'BLO' => 0];
        $sortedKeys = $this->getSortedKeys($matrix);

        $callback = function () use (
            $assignment, $machine, $operator,
            $smuStart, $smuEnd, $smuTotal,
            $slots, $matrix, $sortedKeys, &$catSum
        ) {
            $out = fopen('php://output', 'w');

            fputcsv($out, ['DAILY EQUIPMENT REPORT']);
            fputcsv($out, []);
            fputcsv($out, ['OPERATOR NAME', $operator?->name ?? 'Unknown']);
            fputcsv($out, ['OPERATOR ID',   $operator?->id   ?? '']);
            fputcsv($out, ['DATE',          $assignment->start_time?->format('d/m/Y') ?? '']);
            fputcsv($out, ['CREW',          $assignment->job_site ?? 'N/A']);
            fputcsv($out, ['SHIFT',         strtoupper($assignment->shift_type)]);
            fputcsv($out, ['EXCAVATOR ID',  $machine?->machine_id ?? 'N/A']);
            fputcsv($out, ['SMU START',     $smuStart]);
            fputcsv($out, ['SMU END',       $smuEnd]);
            fputcsv($out, ['SMU TOTAL',     $smuTotal]);
            fputcsv($out, []);

            $headerRow = ['TIME CAT', 'ACTIVITY'];
            foreach ($slots as $slot) {
                $headerRow[] = $slot->format('H:i');
            }
            $headerRow[] = 'TOTAL HRS';
            fputcsv($out, $headerRow);

            foreach ($sortedKeys as $skey) {
                [$cat, $act, $code] = unserialize($skey);
                $slotRow = $matrix[$skey];
                $total   = array_sum(array_map(fn($v) => $v ? 0.25 : 0, $slotRow));

                // ✅ Skip rows with no time entries — only export what was actually used
                if ($total <= 0) continue;

                $catSum[$code] = ($catSum[$code] ?? 0) + $total;

                $row = [$cat . ' (' . $code . ')', $act];
                foreach ($slotRow as $active) {
                    $row[] = $active ? $code : '';
                }
                $row[] = round($total, 2);
                fputcsv($out, $row);
            }

            fputcsv($out, []);
            fputcsv($out, ['TIME CAT SUMMARY']);
            fputcsv($out, ['READY HOURS (OT)',    round($catSum['OT'],  2)]);
            fputcsv($out, ['OP DELAYS (OD)',       round($catSum['OD'],  2)]);
            fputcsv($out, ['OP STANDBY (OS)',      round($catSum['OS'],  2)]);
            fputcsv($out, ['PLANNED LOSS (PL)',    round($catSum['PL'],  2)]);
            fputcsv($out, ['BREAKDOWN LOSS (BL)',  round($catSum['BL'],  2)]);
            fputcsv($out, ['BR LOSS OTHERS (BLO)', round($catSum['BLO'], 2)]);
            fputcsv($out, ['TOTAL SHIFT HOURS',    round(array_sum($catSum), 2)]);

            fclose($out);
        };

        return response()->streamDownload($callback, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    // ── PDF ────────────────────────────────────────────────────────────────
    private function exportPdf(Assignment $assignment)
    {
        $machine     = $assignment->machine;
        $operator    = $assignment->operator?->user;
        $timeEntries = $assignment->timeEntries;

        $smuStart = (float) ($assignment->reading_start ?? 0);
        $smuEnd   = (float) ($assignment->reading_end   ?? 0);
        $smuTotal = round($smuEnd - $smuStart, 2);

        $slots      = $this->buildSlots($assignment);
        $matrix     = $this->buildMatrix($timeEntries, $slots);
        $sortedKeys = $this->getSortedKeys($matrix);
        $catSum     = ['OT' => 0, 'OD' => 0, 'OS' => 0, 'PL' => 0, 'BL' => 0, 'BLO' => 0];

        $rows = [];
        foreach ($sortedKeys as $skey) {
            [$cat, $act, $code] = unserialize($skey);
            $slotRow = $matrix[$skey];
            $total   = array_sum(array_map(fn($v) => $v ? 0.25 : 0, $slotRow));

            // ✅ Only include rows where time was actually recorded
            // Rows with total = 0 (never selected by the operator) are excluded
            if ($total <= 0) continue;

            $catSum[$code] = ($catSum[$code] ?? 0) + $total;
            $rows[] = [
                'cat'   => $cat,
                'act'   => $act,
                'code'  => $code,
                'slots' => $slotRow,
                'total' => round($total, 2),
            ];
        }

        $data = [
            'operator_name' => $operator?->name     ?? 'Unknown',
            'operator_id'   => $operator?->id        ?? '',
            'crew'          => $assignment->job_site  ?? 'N/A',
            'shift'         => strtoupper($assignment->shift_type),
            'excavator_id'  => $machine?->machine_id  ?? 'N/A',
            'date'          => $assignment->start_time?->format('d/m/Y') ?? '',
            'smu_start'     => $smuStart,
            'smu_end'       => $smuEnd,
            'smu_total'     => $smuTotal,
            'slots'         => $slots,
            'rows'          => $rows,
            'cat_sum'       => $catSum,
        ];

        $filename = sprintf(
            'DER_%s_%s.pdf',
            str_replace(' ', '_', $machine?->machine_id ?? 'MACHINE'),
            $assignment->start_time?->format('Ymd') ?? now()->format('Ymd')
        );

        $pdf = Pdf::loadView('moms.der', $data)
            ->setPaper('a4', 'landscape')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled'      => false,
                'defaultFont'          => 'Arial',
                'dpi'                  => 96,
            ]);

        return $pdf->download($filename);
    }

    // ── Shared helpers ─────────────────────────────────────────────────────

    /**
     * Build 48 slots (12 hours × 4 per hour) anchored to the
     * assignment's own shift start time — floored to the nearest 15-min boundary.
     */
    private function buildSlots(Assignment $assignment): array
    {
        $anchor = $assignment->start_time
            ? $assignment->start_time->copy()
            : Carbon::today()->setTime(6, 0, 0);

        $anchor->minute(intdiv($anchor->minute, 15) * 15)->second(0);

        $slots = [];
        for ($i = 0; $i < 48; $i++) {
            $slots[] = $anchor->copy()->addMinutes($i * 15);
        }

        return $slots;
    }

    /**
     * Build the slot matrix.
     * Keys are serialize([$cat, $act, $code]) strings.
     * Returns: array<string, bool[]>
     *
     * NOTE: templateRows() are intentionally NOT added here anymore.
     * We only build rows from actual time entries — the filter (total > 0)
     * in exportPdf/exportCsv ensures only used rows appear in the output.
     */
    private function buildMatrix($timeEntries, array $slots): array
    {
        $matrix    = [];
        $slotCount = count($slots);

        foreach ($timeEntries as $entry) {
            $cat   = $entry->time_category ?? '';
            $act   = $entry->activity      ?? '';
            $code  = $this->codeOf($cat);
            $start = $entry->start_time;
            $end   = $entry->end_time;

            if (!$cat || !$code || !$start) continue;

            $skey = serialize([$cat, $act, $code]);

            if (!isset($matrix[$skey])) {
                $matrix[$skey] = array_fill(0, $slotCount, false);
            }

            if (!$end) continue;

            foreach ($slots as $i => $slot) {
                $slotEnd = $slot->copy()->addMinutes(15);
                if ($start->lt($slotEnd) && $end->gt($slot)) {
                    $matrix[$skey][$i] = true;
                }
            }
        }

        // ✅ REMOVED: templateRows() injection
        // Previously all 12 template rows were force-added even with zero data.
        // Now we only have rows that come from actual time entries.
        // The total > 0 filter in export methods handles the rest.

        return $matrix;
    }

    /**
     * Return sorted serialized keys — OT first, then OD, OS, PL, BL, BLO.
     */
    private function getSortedKeys(array $matrix): array
    {
        $order = ['OT' => 0, 'OD' => 1, 'OS' => 2, 'PL' => 3, 'BL' => 4, 'BLO' => 5];
        $keys  = array_keys($matrix);

        usort($keys, function ($a, $b) use ($order) {
            [, $actA, $codeA] = unserialize($a);
            [, $actB, $codeB] = unserialize($b);
            $oa = $order[$codeA] ?? 99;
            $ob = $order[$codeB] ?? 99;
            return $oa !== $ob ? $oa - $ob : strcmp($actA, $actB);
        });

        return $keys;
    }

    private function codeOf(string $cat): string
    {
        return [
            'Operating Time (OT)'        => 'OT',
            'Operating Delay (OD)'       => 'OD',
            'Operating Standby (OS)'     => 'OS',
            'Planned Loss (PL)'          => 'PL',
            'Breakdown Loss (BL)'        => 'BL',
            'Breakdown Loss Other (BLO)' => 'BLO',
        ][$cat] ?? '';
    }

    /**
     * Template rows kept for reference only — no longer injected into matrix.
     * Used if you ever want to restore the "show all rows" behavior.
     */
    private function templateRows(): array
    {
        return [
            ['Operating Time (OT)',        'OT Production',              'OT'],
            ['Operating Delay (OD)',       'OD TOOLBOX / PRESTART',      'OD'],
            ['Operating Delay (OD)',       'OD CRIB',                    'OD'],
            ['Operating Delay (OD)',       'OD REFUEL / LUBE',           'OD'],
            ['Operating Delay (OD)',       'OD SHIFT CHANGE',            'OD'],
            ['Operating Delay (OD)',       'OD OPERATOR SWAP',           'OD'],
            ['Operating Standby (OS)',     'OS BLAST DELAY',             'OS'],
            ['Operating Standby (OS)',     'OS AWAIT SHEETING MATERIAL', 'OS'],
            ['Breakdown Loss (BL)',        'BL HYDSYS TANK',             'BL'],
            ['Breakdown Loss (BL)',        'BL GET',                     'BL'],
            ['Planned Loss (PL)',          'PL SERVICE 2000HRS',         'PL'],
            ['Breakdown Loss Other (BLO)', 'BLO NO ACCESS',              'BLO'],
        ];
    }
}