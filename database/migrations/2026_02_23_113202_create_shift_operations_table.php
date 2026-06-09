<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shift_operations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('operator_id')->constrained('operators')->onDelete('cascade');
            $table->foreignId('machine_id')->constrained('machines')->onDelete('cascade');
            $table->foreignId('assignment_id')->nullable()->constrained('assignments')->onDelete('set null');

            // ── Initial Readings ─────────────────────────────────────────
            $table->decimal('starting_hour_meter', 10, 2);
            $table->decimal('starting_odometer', 10, 2)->nullable();
            $table->string('fuel_level_observed'); // Full, 3/4, 1/2, 1/4, Empty
            $table->decimal('estimated_fuel_in_tank', 10, 2)->nullable();

            // ── Pre-Start Safety Checklist (Pass / Fail / N/A) ───────────
            $table->string('engine_condition')->nullable();
            $table->string('tires_condition')->nullable();
            $table->string('lights_signals')->nullable();
            $table->string('brakes_responsive')->nullable();
            $table->string('fluid_levels')->nullable();
            $table->string('safety_equipment')->nullable();
            $table->string('mirrors_windows')->nullable();
            $table->string('seatbelt_functioning')->nullable();
            $table->text('checklist_notes')->nullable();
            $table->text('operator_remarks')->nullable();

            // ── End of Shift — Hour Accounting ───────────────────────────
            // hours_available   = ready_hours + standby_hours       (calc on FE)
            // hours_unavailable = breakdown_hours + pm_hours         (calc on FE)
            // operating_hours   = ending_hour_meter - starting_hour_meter (calc on FE)
            $table->decimal('ending_hour_meter', 10, 2)->nullable();
            $table->decimal('ending_odometer', 10, 2)->nullable();
            $table->decimal('fuel_consumed', 10, 2)->nullable();

            $table->decimal('ready_hours', 6, 2)->nullable()
                ->comment('Hours machine was working/productive');
            $table->decimal('standby_hours', 6, 2)->nullable()
                ->comment('Hours machine ready but idle — operator present, no work');
            $table->decimal('breakdown_hours', 6, 2)->nullable()
                ->comment('Unplanned downtime hours');
            $table->decimal('pm_hours', 6, 2)->nullable()
                ->comment('Planned preventive maintenance hours');
            $table->text('delay_reason')->nullable()
                ->comment('Reason for standby/breakdown delays');

            // ── End of Shift — Production ────────────────────────────────
            // production_unit supports all fleet types:
            //   Dump Truck  → Tons / Trips
            //   Excavator   → BCM (Bank Cubic Meters)
            //   Dozer/Grader → Hours
            //   Water Truck → Loads
            $table->decimal('production_quantity', 10, 2)->nullable()
                ->comment('Amount of work done in the selected unit');
            $table->string('production_unit')->nullable()
                ->comment('Tons | BCM | Trips | Loads | km | Hours | Other');
            $table->decimal('tons', 10, 2)->nullable()
                ->comment('Convenience column — mirrors production_quantity when unit=Tons');
            $table->integer('trips')->nullable()
                ->comment('Number of trips — shortcut for dump trucks');

            // Legacy field kept for backwards compatibility
            $table->decimal('work_done', 10, 2)->nullable();
            $table->text('end_shift_notes')->nullable();

            // ── Location & Department (per-shift, not from assignment) ───
            $table->string('location')->nullable()
                ->comment('Physical work area e.g. Mt Bini South, EWRD, Pit 3');
            $table->string('department')->nullable()
                ->comment('PNG mining dept: Mine Operations, Civil, Plant & Equipment, etc.');

            // ── Shift Times & Status ─────────────────────────────────────
            $table->dateTime('shift_start_time');
            $table->dateTime('shift_end_time')->nullable();
            $table->enum('status', ['In Progress', 'Completed', 'Pending Approval', 'Approved'])
                ->default('In Progress');

            $table->timestamps();

            // Indexes for common query patterns
            $table->index('operator_id');
            $table->index('machine_id');
            $table->index('shift_start_time');
            $table->index('status');
            $table->index('department');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shift_operations');
    }
};