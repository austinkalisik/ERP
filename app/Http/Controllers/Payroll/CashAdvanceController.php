<?php

namespace App\Http\Controllers\Payroll;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\HRMS\Employee;
use App\Models\Payroll\CashAdvance;
use App\Models\User;
use Carbon\Carbon;

class CashAdvanceController extends Controller
{
    const MAX_AMOUNT = 4000;

    // ── GET all cash advances (HR view) ───────────────────────────────────────
    public function index(Request $request)
    {
        $query = CashAdvance::with(['employee'])
            ->orderBy('created_at', 'desc');

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        return response()->json($query->get());
    }

    // ── GET cash advances for a specific employee ─────────────────────────────
    public function getByEmployee($biometric_id)
    {
        $employee = Employee::where('biometric_id', $biometric_id)->firstOrFail();

        $advances = CashAdvance::where('employee_id', $employee->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($advances);
    }

    // ── CREATE (employee applies or HR creates) ────────────────────────────────
    public function store(Request $request)
    {
        $validated = $request->validate([
            'biometric_id'       => 'required|string|exists:employees,biometric_id',
            'amount'             => 'required|numeric|min:1|max:' . self::MAX_AMOUNT,
            'interest_rate'      => 'nullable|numeric|min:0|max:100',
            'installment_amount' => 'required|numeric|min:1',
            'start_date'         => 'required|date',
            'purpose'            => 'nullable|string|max:255',
            'notes'              => 'nullable|string',
        ]);

        $employee      = Employee::where('biometric_id', $validated['biometric_id'])->firstOrFail();
        $interestRate  = $validated['interest_rate'] ?? 0;
        $amount        = (float) $validated['amount'];
        $interest      = round($amount * ($interestRate / 100), 2);
        $totalAmount   = round($amount + $interest, 2);
        $installment   = (float) $validated['installment_amount'];

        // Calculate estimated end date based on installments
        $payrollsNeeded = $installment > 0 ? ceil($totalAmount / $installment) : 1;
        // Assuming fortnightly payroll (every 14 days)
        $endDate = Carbon::parse($validated['start_date'])
            ->addDays($payrollsNeeded * 14)
            ->toDateString();

        $advance = CashAdvance::create([
            'employee_id'        => $employee->id,
            'amount'             => $amount,
            'interest_rate'      => $interestRate,
            'total_amount'       => $totalAmount,
            'installment_amount' => $installment,
            'total_deducted'     => 0,
            'remaining_balance'  => $totalAmount,
            'start_date'         => $validated['start_date'],
            'end_date'           => $endDate,
            'purpose'            => $validated['purpose'] ?? null,
            'status'             => 'Pending',
            'notes'              => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Cash advance request submitted successfully.',
            'data'    => $advance->load('employee'),
        ], 201);
    }

    // ── APPROVE / REJECT ──────────────────────────────────────────────────────
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:Approved,Rejected',
            'notes'  => 'nullable|string',
        ]);

        $advance = CashAdvance::findOrFail($id);

        if ($advance->status === 'Fully Paid') {
            return response()->json(['message' => 'Cannot change status of a fully paid advance.'], 422);
        }

        $advance->update([
            'status' => $validated['status'],
            'notes'  => $validated['notes'] ?? $advance->notes,
        ]);

        return response()->json([
            'message' => "Cash advance {$validated['status']} successfully.",
            'data'    => $advance,
        ]);
    }

    // ── DELETE (only Pending) ──────────────────────────────────────────────────
    public function destroy($id)
    {
        $advance = CashAdvance::findOrFail($id);

        if ($advance->status !== 'Pending') {
            return response()->json(['message' => 'Only pending advances can be deleted.'], 422);
        }

        $advance->delete();

        return response()->json(['message' => 'Cash advance deleted successfully.']);
    }
}