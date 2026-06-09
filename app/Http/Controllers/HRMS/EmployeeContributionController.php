<?php

namespace App\Http\Controllers\HRMS;

use App\Http\Controllers\Controller;
use App\Models\HRMS\Employee;
use App\Models\HRMS\EmployeeContribution;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class EmployeeContributionController extends Controller
{
    /**
     * GET /api/hrms/contributions/{employee_id}
     * List all contributions for an employee.
     * Returns frontend_value (already × 100 for percentages) so the
     * React form can display what the user originally typed.
     */
    public function index(int $employeeId): JsonResponse
    {
        $employee = Employee::findOrFail($employeeId);

        $contributions = EmployeeContribution::where('employee_id', $employee->id)
            ->orderBy('year', 'desc')
            ->orderBy('contribution_type')
            ->get()
            ->map(fn ($c) => $this->format($c));

        return response()->json($contributions);
    }

    /**
     * POST /api/hrms/contributions
     * Bulk-create contributions (called from AddEmployee wizard).
     * Uses updateOrCreate so re-submitting the wizard doesn't create duplicates.
     *
     * Body: {
     *   employee_id: int,
     *   contributions: [
     *     { year, contribution_type, value_type, value, notes? }
     *   ]
     * }
     *
     * Note: frontend sends percentage as decimal already (0.06),
     * amount as plain float. Both stored as-is.
     */
    public function bulkStore(Request $request): JsonResponse
    {
        $request->validate([
            'employee_id'                       => 'required|integer|exists:employees,id',
            'contributions'                     => 'required|array|min:1',
            'contributions.*.year'              => 'required|integer|min:2000|max:2100',
            'contributions.*.contribution_type' => 'required|string|max:100',
            'contributions.*.value_type'        => 'required|in:percentage,amount',
            'contributions.*.value'             => 'required|numeric|min:0',
            'contributions.*.notes'             => 'nullable|string|max:255',
        ]);

        // Validate percentage range (0–1 stored as decimal)
        foreach ($request->contributions as $idx => $c) {
            if ($c['value_type'] === 'percentage' && $c['value'] > 1) {
                return response()->json([
                    'message' => "Contribution #{$idx}: percentage value must be between 0 and 1 (e.g. 0.06 = 6%).",
                ], 422);
            }
        }

        DB::beginTransaction();
        try {
            $saved = [];

            foreach ($request->contributions as $data) {
                $contribution = EmployeeContribution::updateOrCreate(
                    [
                        'employee_id'       => $request->employee_id,
                        'year'              => $data['year'],
                        'contribution_type' => $data['contribution_type'],
                    ],
                    [
                        'value_type' => $data['value_type'],
                        'value'      => $data['value'],
                        'notes'      => $data['notes'] ?? null,
                    ]
                );

                $saved[] = $this->format($contribution);
            }

            DB::commit();

            return response()->json([
                'message'       => count($saved) . ' contribution(s) saved successfully.',
                'contributions' => $saved,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to save contributions: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PUT /api/hrms/contributions/{id}
     * Update a single contribution record.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $contribution = EmployeeContribution::findOrFail($id);

        $request->validate([
            'year'              => 'sometimes|integer|min:2000|max:2100',
            'contribution_type' => [
                'sometimes', 'string', 'max:100',
                Rule::unique('employee_contributions')
                    ->where('employee_id', $contribution->employee_id)
                    ->where('year', $request->year ?? $contribution->year)
                    ->ignore($contribution->id),
            ],
            'value_type' => 'sometimes|in:percentage,amount',
            'value'      => 'sometimes|numeric|min:0',
            'notes'      => 'nullable|string|max:255',
        ]);

        if (
            $request->filled('value_type') &&
            $request->value_type === 'percentage' &&
            $request->filled('value') &&
            $request->value > 1
        ) {
            return response()->json([
                'message' => 'Percentage value must be between 0 and 1 (e.g. 0.06 = 6%).',
            ], 422);
        }

        $contribution->update(
            $request->only(['year', 'contribution_type', 'value_type', 'value', 'notes'])
        );

        return response()->json([
            'message'      => 'Contribution updated successfully.',
            'contribution' => $this->format($contribution->fresh()),
        ]);
    }

    /**
     * DELETE /api/hrms/contributions/{id}
     * Soft-delete a contribution record.
     */
    public function destroy(int $id): JsonResponse
    {
        $contribution = EmployeeContribution::findOrFail($id);
        $contribution->delete();

        return response()->json(['message' => 'Contribution deleted successfully.']);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function format(EmployeeContribution $c): array
    {
        return [
            'id'                => $c->id,
            'employee_id'       => $c->employee_id,
            'year'              => $c->year,
            'contribution_type' => $c->contribution_type,
            'value_type'        => $c->value_type,
            'value'             => (float) $c->value,
            'frontend_value'    => $c->frontend_value,
            'display_value'     => $c->display_value,
            'notes'             => $c->notes,
            'created_at'        => $c->created_at?->toDateTimeString(),
            'updated_at'        => $c->updated_at?->toDateTimeString(),
        ];
    }
}