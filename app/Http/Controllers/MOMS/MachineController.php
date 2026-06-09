<?php
namespace App\Http\Controllers\MOMS;
use App\Http\Controllers\Controller;
use App\Models\MOMS\Machine;
use App\Models\User;
use App\Notifications\MOMS\MachineNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MachineController extends Controller
{
    private const CATEGORIES = 'Excavator,Bulldozer,Dozer,OHT Truck,Dump Truck,Light Vehicle,Loader,Grader';

    public function index()
    {
        $machines = Machine::orderBy('created_at', 'desc')->paginate(50);
        return response()->json([
            'data' => $machines->items(),
            'meta' => ['total' => $machines->total(), 'current_page' => $machines->currentPage(), 'last_page' => $machines->lastPage(), 'per_page' => $machines->perPage()],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category'         => 'required|string|in:' . self::CATEGORIES,
            'make'             => 'required|string|max:255',
            'model'            => 'required|string|max:255',
            'engine_hours'     => 'required|integer|min:0',
            'fuel_capacity'    => 'required|numeric|min:0',
            'status'           => 'required|in:Active,Maintenance,Inactive',
            'location'         => 'required|string|max:255',
            'last_maintenance' => 'nullable|date',
            'next_maintenance' => 'nullable|date|after_or_equal:today',
        ]);

        $validated['machine_id'] = $this->generateMachineId($validated['category']);
        $machine = Machine::create($validated);

        // Notify moms_manager and system_admin
        User::whereIn('role', ['system_admin', 'moms_manager'])
            ->where('id', '!=', Auth::id())
            ->get()
            ->each(fn($u) => $u->notify(new MachineNotification($machine, 'added')));

        return response()->json(['message' => 'Machine created successfully', 'data' => $machine], 201);
    }

    public function show($id)
    {
        return response()->json(Machine::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $machine   = Machine::findOrFail($id);
        $oldStatus = $machine->status;

        $validated = $request->validate([
            'category'         => 'sometimes|string|in:' . self::CATEGORIES,
            'make'             => 'sometimes|string|max:255',
            'model'            => 'sometimes|string|max:255',
            'engine_hours'     => 'sometimes|integer|min:0',
            'fuel_capacity'    => 'sometimes|numeric|min:0',
            'status'           => 'sometimes|in:Active,Maintenance,Inactive',
            'location'         => 'sometimes|string|max:255',
            'last_maintenance' => 'nullable|date',
            'next_maintenance' => 'nullable|date',
        ]);

        $machine->update($validated);

        // Notify when machine goes into Maintenance status
        if (isset($validated['status']) && $oldStatus !== 'Maintenance' && $validated['status'] === 'Maintenance') {
            User::whereIn('role', ['system_admin', 'moms_manager', 'moms_supervisor'])
                ->where('id', '!=', Auth::id())
                ->get()
                ->each(fn($u) => $u->notify(new MachineNotification($machine, 'moved to Maintenance')));
        }

        return response()->json(['message' => 'Machine updated successfully', 'data' => $machine]);
    }

    public function destroy($id)
    {
        Machine::findOrFail($id)->delete();
        return response()->json(['message' => 'Machine deleted successfully']);
    }

    private function generateMachineId(string $category): string
    {
        $prefix      = Machine::getCategoryPrefix($category);
        $lastMachine = Machine::where('machine_id', 'LIKE', $prefix . '-%')
            ->orderByRaw('CAST(SUBSTRING(machine_id, ' . (strlen($prefix) + 2) . ') AS UNSIGNED) DESC')
            ->first();
        $nextNumber = $lastMachine ? (int) substr($lastMachine->machine_id, strlen($prefix) + 1) + 1 : 1;
        return $prefix . '-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }
}