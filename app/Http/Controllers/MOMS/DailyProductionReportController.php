<?php

namespace App\Http\Controllers\MOMS;

use App\Http\Controllers\Controller;
use App\Models\MOMS\ShiftOperation;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DailyProductionReportController extends Controller
{
    /**
     * GET /api/moms/reports/daily-production?date=2026-03-15
     * Downloads a PDF of the Daily Production Summary Report for the given date.
     */
    public function download(Request $request)
    {
        $date = $request->input('date', now()->toDateString());

        // All approved/completed shift operations for the date
        $operations = ShiftOperation::with(['machine', 'operator.user', 'assignment.timeEntries'])
            ->whereDate('shift_start_time', $date)
            ->whereIn('status', ['Approved', 'Pending Approval', 'Completed'])
            ->orderBy('machine_id')
            ->orderBy('shift_start_time')
            ->get();

        // ── Categorise by machine category ───────────────────────────────
        // Excavators: Excavator, Dozer, Bulldozer, Grader, Loader
        // Hauling:    Dump Truck, OHT Truck
        // Auxiliary:  Light Vehicle, everything else

        $excavatorCategories = ['Excavator', 'Dozer', 'Bulldozer', 'Grader', 'Loader'];
        $haulCategories      = ['Dump Truck', 'OHT Truck'];

        $excavators = $operations->filter(fn($op) => in_array($op->machine?->category, $excavatorCategories));
        $hauling    = $operations->filter(fn($op) => in_array($op->machine?->category, $haulCategories));
        $auxiliary  = $operations->filter(fn($op) => !in_array($op->machine?->category, array_merge($excavatorCategories, $haulCategories)));

        // ── Build row data ────────────────────────────────────────────────
        $excavatorRows = $this->buildExcavatorRows($excavators);
        $haulRows      = $this->buildHaulRows($hauling);
        $auxRows       = $this->buildAuxRows($auxiliary);

        // ── Totals ────────────────────────────────────────────────────────
        $excavatorTotals = $this->sumTotals($excavatorRows);
        $haulTotals      = $this->sumTotals($haulRows);
        $auxTotals       = $this->sumTotals($auxRows);

        $data = [
            'report_date'      => Carbon::parse($date)->format('d M Y'),
            'generated_at'     => now()->format('d M Y H:i'),
            'excavator_rows'   => $excavatorRows,
            'excavator_totals' => $excavatorTotals,
            'haul_rows'        => $haulRows,
            'haul_totals'      => $haulTotals,
            'aux_rows'         => $auxRows,
            'aux_totals'       => $auxTotals,
        ];

        $filename = 'Daily_Production_Report_' . $date . '.pdf';

        $pdf = Pdf::loadView('moms.daily-production-report', $data)
            ->setPaper('a3', 'landscape')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled'      => false,
                'defaultFont'          => 'Arial',
                'dpi'                  => 96,
            ]);

        return $pdf->download($filename);
    }

    // ── Row builders ──────────────────────────────────────────────────────

    private function buildExcavatorRows($operations): array
    {
        $rows = [];
        foreach ($operations as $op) {
            $timeCategories = $this->getTimeCategories($op);
            $rows[] = [
                'machine_id'   => $op->machine?->machine_id ?? 'N/A',
                'description'  => trim(($op->machine?->make ?? '') . ' ' . ($op->machine?->model ?? '')),
                'shift'        => $this->shiftLabel($op->shift_start_time),
                'source'       => $op->location ?? 'XXX',
                'location'     => $op->department ?? '—',
                'tons'         => round($op->tons ?? 0, 3),
                'tons_per_hr'  => $this->tonsPerHour($op),
                'ready'        => round($op->ready_hours ?? 0, 2),
                'delays'       => round($op->standby_hours ?? 0, 2),
                'standby'      => round(($op->breakdown_hours ?? 0), 2),
                'pl'           => round($op->pm_hours ?? 0, 2),
                'time_cat'     => $timeCategories,
            ];
        }
        return $rows;
    }

    private function buildHaulRows($operations): array
    {
        $rows = [];
        foreach ($operations as $op) {
            $timeCategories = $this->getTimeCategories($op);
            $assignment     = $op->assignment;

            // Expit load count / tonnes come from assignment if linked
            $exitLoadCount  = $op->trips   ?? 0;
            $exitTonnes     = $op->tons    ?? 0;

            $rows[] = [
                'machine_id'      => $op->machine?->machine_id ?? 'N/A',
                'description'     => trim(($op->machine?->make ?? '') . ' ' . ($op->machine?->model ?? '')),
                'shift'           => $this->shiftLabel($op->shift_start_time),
                'excavator'       => $assignment?->machine?->machine_id ?? 'XXX',
                'expit_load'      => $exitLoadCount,
                'expit_tonnes'    => round($exitTonnes, 3),
                'inpit_loads'     => 0,
                'inpit_tonnes'    => 0,
                'total_loads'     => $exitLoadCount,
                'total_tonnes'    => round($exitTonnes, 3),
                'source'          => $op->location ?? 'XXX',
                'destination'     => $op->department ?? 'XXX',
                'ready'           => round($op->ready_hours ?? 0, 2),
                'delays'          => round($op->standby_hours ?? 0, 2),
                'standby'         => round($op->breakdown_hours ?? 0, 2),
                'pl'              => round($op->pm_hours ?? 0, 2),
                'time_cat'        => $timeCategories,
            ];
        }
        return $rows;
    }

    private function buildAuxRows($operations): array
    {
        $rows = [];
        foreach ($operations as $op) {
            $timeCategories = $this->getTimeCategories($op);
            $rows[] = [
                'machine_id'  => $op->machine?->machine_id ?? 'N/A',
                'description' => trim(($op->machine?->make ?? '') . ' ' . ($op->machine?->model ?? '')),
                'shift'       => $this->shiftLabel($op->shift_start_time),
                'location'    => $op->location ?? '—',
                'task'        => $op->end_shift_notes ?? $op->delay_reason ?? '—',
                'ready'       => round($op->ready_hours ?? 0, 2),
                'delays'      => round($op->standby_hours ?? 0, 2),
                'standby'     => round($op->breakdown_hours ?? 0, 2),
                'pl'          => round($op->pm_hours ?? 0, 2),
                'time_cat'    => $timeCategories,
            ];
        }
        return $rows;
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    /**
     * Extract time category totals from the assignment's time entries.
     * Falls back to ShiftOperation hour fields if no assignment linked.
     */
    private function getTimeCategories(ShiftOperation $op): array
    {
        $cats = ['OT' => 0, 'OD' => 0, 'OS' => 0, 'PL' => 0, 'BL' => 0, 'BLO' => 0];

        $codeMap = [
            'Operating Time (OT)'        => 'OT',
            'Operating Delay (OD)'       => 'OD',
            'Operating Standby (OS)'     => 'OS',
            'Planned Loss (PL)'          => 'PL',
            'Breakdown Loss (BL)'        => 'BL',
            'Breakdown Loss Other (BLO)' => 'BLO',
        ];

        // Use time entries from linked assignment if available
        if ($op->assignment && $op->assignment->timeEntries->isNotEmpty()) {
            foreach ($op->assignment->timeEntries as $entry) {
                $code = $codeMap[$entry->time_category] ?? null;
                if ($code && $entry->duration_hours) {
                    $cats[$code] += (float) $entry->duration_hours;
                }
            }
        } else {
            // Fall back to ShiftOperation direct fields
            $cats['OT']  = (float) ($op->ready_hours     ?? 0);
            $cats['OD']  = (float) ($op->standby_hours   ?? 0);
            $cats['BL']  = (float) ($op->breakdown_hours ?? 0);
            $cats['PL']  = (float) ($op->pm_hours        ?? 0);
        }

        return array_map(fn($v) => round($v, 2), $cats);
    }

    private function shiftLabel(?Carbon $time): string
    {
        if (!$time) return '—';
        $hour = (int) $time->format('H');
        if ($hour >= 6 && $hour < 18) return 'Day';
        return 'Night';
    }

    private function tonsPerHour(ShiftOperation $op): float
    {
        $tons  = (float) ($op->tons ?? 0);
        $hours = ($op->ending_hour_meter && $op->starting_hour_meter)
            ? (float) ($op->ending_hour_meter - $op->starting_hour_meter)
            : 0;
        return $hours > 0 ? round($tons / $hours, 1) : 0;
    }

    private function sumTotals(array $rows): array
    {
        $totals = [
            'tons'    => 0, 'ready'  => 0, 'delays' => 0,
            'standby' => 0, 'pl'     => 0,
            'total_loads' => 0, 'total_tonnes' => 0,
            'expit_load'  => 0, 'expit_tonnes' => 0,
        ];
        foreach ($rows as $row) {
            foreach ($totals as $key => $_) {
                $totals[$key] += $row[$key] ?? 0;
            }
        }
        return array_map(fn($v) => round($v, 2), $totals);
    }
}