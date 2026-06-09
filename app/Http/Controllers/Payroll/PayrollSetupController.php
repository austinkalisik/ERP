<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use App\Models\Payroll\PayrollPayDate;
use App\Models\Payroll\NasfundTable;
use App\Models\Payroll\NcslTable;
use App\Models\Payroll\TaxTable;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PayrollSetupController extends Controller
{
    // ══════════════════════════════════════════════════════════════════════════
    // PAY DATES
    // ══════════════════════════════════════════════════════════════════════════

    public function indexPayDates(): JsonResponse
    {
        return response()->json(
            PayrollPayDate::orderBy('pay_date', 'desc')->get()
        );
    }

    public function storePayDate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'pay_date'          => 'required|date',
            'cutoff_start_date' => 'required|date',
            'cutoff_end_date'   => 'required|date|after_or_equal:cutoff_start_date',
        ]);

        $record = PayrollPayDate::create($data);

        return response()->json([
            'message' => 'Pay date added successfully.',
            'data'    => $record,
        ], 201);
    }

    public function updatePayDate(Request $request, int $id): JsonResponse
    {
        $record = PayrollPayDate::findOrFail($id);

        $data = $request->validate([
            'pay_date'          => 'sometimes|date',
            'cutoff_start_date' => 'sometimes|date',
            'cutoff_end_date'   => 'sometimes|date|after_or_equal:cutoff_start_date',
        ]);

        $record->update($data);

        return response()->json(['message' => 'Pay date updated.', 'data' => $record->fresh()]);
    }

    public function destroyPayDate(int $id): JsonResponse
    {
        PayrollPayDate::findOrFail($id)->delete();
        return response()->json(['message' => 'Pay date deleted.']);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // NASFUND TABLE
    // ══════════════════════════════════════════════════════════════════════════

    public function indexNasfund(Request $request): JsonResponse
    {
        $query = NasfundTable::orderBy('year', 'desc')
                             ->orderBy('compensation_from');

        if ($request->filled('year')) {
            $query->where('year', $request->year);
        }

        return response()->json($query->get()->map(fn ($r) => $this->formatNasfund($r)));
    }

    public function storeNasfund(Request $request): JsonResponse
    {
        $data = $request->validate([
            'compensation_from' => 'required|numeric|min:0',
            'compensation_to'   => 'required|numeric|gt:compensation_from',
            'employee_rate'     => 'required|numeric|min:0|max:1',
            'employer_rate'     => 'required|numeric|min:0|max:1',
            'year'              => 'required|integer|min:2000|max:2100',
        ]);

        $record = NasfundTable::create($data);

        return response()->json([
            'message' => 'Nasfund record added.',
            'data'    => $this->formatNasfund($record),
        ], 201);
    }

    public function updateNasfund(Request $request, int $id): JsonResponse
    {
        $record = NasfundTable::findOrFail($id);

        $data = $request->validate([
            'compensation_from' => 'sometimes|numeric|min:0',
            'compensation_to'   => 'sometimes|numeric',
            'employee_rate'     => 'sometimes|numeric|min:0|max:1',
            'employer_rate'     => 'sometimes|numeric|min:0|max:1',
            'year'              => 'sometimes|integer|min:2000|max:2100',
        ]);

        $record->update($data);

        return response()->json([
            'message' => 'Nasfund record updated.',
            'data'    => $this->formatNasfund($record->fresh()),
        ]);
    }

    public function destroyNasfund(int $id): JsonResponse
    {
        NasfundTable::findOrFail($id)->delete();
        return response()->json(['message' => 'Nasfund record deleted.']);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // NCSL TABLE
    // ══════════════════════════════════════════════════════════════════════════

    public function indexNcsl(Request $request): JsonResponse
    {
        $query = NcslTable::orderBy('year', 'desc')
                          ->orderBy('compensation_from');

        if ($request->filled('year')) {
            $query->where('year', $request->year);
        }

        return response()->json($query->get());
    }

    public function storeNcsl(Request $request): JsonResponse
    {
        $data = $request->validate([
            'compensation_from' => 'required|numeric|min:0',
            'compensation_to'   => 'required|numeric|gt:compensation_from',
            'deduction_amount'  => 'required|numeric|min:0',
            'year'              => 'required|integer|min:2000|max:2100',
        ]);

        $record = NcslTable::create($data);

        return response()->json(['message' => 'NCSL record added.', 'data' => $record], 201);
    }

    public function updateNcsl(Request $request, int $id): JsonResponse
    {
        $record = NcslTable::findOrFail($id);

        $data = $request->validate([
            'compensation_from' => 'sometimes|numeric|min:0',
            'compensation_to'   => 'sometimes|numeric',
            'deduction_amount'  => 'sometimes|numeric|min:0',
            'year'              => 'sometimes|integer|min:2000|max:2100',
        ]);

        $record->update($data);

        return response()->json(['message' => 'NCSL record updated.', 'data' => $record->fresh()]);
    }

    public function destroyNcsl(int $id): JsonResponse
    {
        NcslTable::findOrFail($id)->delete();
        return response()->json(['message' => 'NCSL record deleted.']);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TAX TABLE
    // ══════════════════════════════════════════════════════════════════════════

    public function indexTax(Request $request): JsonResponse
    {
        $query = TaxTable::orderBy('year_applied', 'desc')
                         ->orderBy('tax_type')
                         ->orderBy('no_of_dependents')
                         ->orderBy('compensation_from');

        if ($request->filled('year'))     $query->where('year_applied', $request->year);
        if ($request->filled('tax_type')) $query->where('tax_type', $request->tax_type);

        return response()->json($query->get());
    }

    public function storeTax(Request $request): JsonResponse
    {
        $data = $request->validate([
            'compensation_from' => 'required|numeric|min:0',
            'compensation_to'   => 'required|numeric|gt:compensation_from',
            'tax_type'          => 'required|in:W/ Declaration,No Declaration,Non-Resident',
            'no_of_dependents'  => 'required|integer|min:0',
            'amount'            => 'required|numeric|min:0',
            'year_applied'      => 'required|integer|min:2000|max:2100',
        ]);

        $record = TaxTable::create($data);

        return response()->json(['message' => 'Tax record added.', 'data' => $record], 201);
    }

    public function updateTax(Request $request, int $id): JsonResponse
    {
        $record = TaxTable::findOrFail($id);

        $data = $request->validate([
            'compensation_from' => 'sometimes|numeric|min:0',
            'compensation_to'   => 'sometimes|numeric',
            'tax_type'          => 'sometimes|in:W/ Declaration,No Declaration,Non-Resident',
            'no_of_dependents'  => 'sometimes|integer|min:0',
            'amount'            => 'sometimes|numeric|min:0',
            'year_applied'      => 'sometimes|integer|min:2000|max:2100',
        ]);

        $record->update($data);

        return response()->json(['message' => 'Tax record updated.', 'data' => $record->fresh()]);
    }

    public function destroyTax(int $id): JsonResponse
    {
        TaxTable::findOrFail($id)->delete();
        return response()->json(['message' => 'Tax record deleted.']);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function formatNasfund(NasfundTable $r): array
    {
        return [
            'id'                    => $r->id,
            'compensation_from'     => (float) $r->compensation_from,
            'compensation_to'       => (float) $r->compensation_to,
            'employee_rate'         => (float) $r->employee_rate,
            'employer_rate'         => (float) $r->employer_rate,
            'employee_rate_percent' => $r->employee_rate_percent,
            'employer_rate_percent' => $r->employer_rate_percent,
            'year'                  => $r->year,
            'created_at'            => $r->created_at?->toDateTimeString(),
            'updated_at'            => $r->updated_at?->toDateTimeString(),
        ];
    }
}