<?php

namespace App\Console\Commands;

use App\Services\SimulationService;
use Illuminate\Console\Command;

class SimulateMonitoringData extends Command
{
    protected $signature = 'monitoring:simulate {--events=5}';
    protected $description = 'Generate simulated device readings and random building-system events.';

    public function handle(SimulationService $simulation): int
    {
        $result = $simulation->tick((int) $this->option('events'));
        $this->info("Created {$result['events']} events and {$result['readings']} readings.");
        return self::SUCCESS;
    }
}
