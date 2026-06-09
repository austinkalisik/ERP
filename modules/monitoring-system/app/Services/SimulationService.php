<?php

namespace App\Services;

use App\Models\Device;
use App\Models\DeviceReading;
use App\Models\Event;

class SimulationService
{
    public function tick(int $events = 5): array
    {
        $devices = Device::query()->inRandomOrder()->limit(max(10, $events))->get();
        $createdReadings = 0;

        foreach ($devices as $device) {
            $device->update(['status' => fake()->randomElement(['online', 'online', 'warning', 'offline', 'alarm']), 'last_heartbeat' => now()]);

            foreach ($this->metricsFor($device->type) as [$metric, $unit, $min, $max]) {
                DeviceReading::create([
                    'device_id' => $device->id,
                    'metric' => $metric,
                    'value' => fake()->randomFloat(2, $min, $max),
                    'unit' => $unit,
                    'recorded_at' => now(),
                ]);
                $createdReadings++;
            }
        }

        foreach ($devices->take($events) as $device) {
            Event::create([
                'device_id' => $device->id,
                'event_type' => fake()->randomElement(['alarm', 'warning', 'fault', 'info', 'restore']),
                'severity' => fake()->randomElement(['critical', 'high', 'medium', 'low']),
                'location' => trim(optional($device->location)->building.' '.optional($device->location)->floor.' '.optional($device->location)->zone),
                'message' => $this->messageFor($device),
                'occurred_at' => now(),
            ]);
        }

        return ['events' => min($events, $devices->count()), 'readings' => $createdReadings];
    }

    private function metricsFor(string $type): array
    {
        return match ($type) {
            'HVAC', 'Temperature Sensor' => [['temperature', 'C', 18, 34], ['humidity', '%', 35, 78]],
            'Humidity Sensor' => [['humidity', '%', 35, 90]],
            'UPS' => [['battery', '%', 25, 100], ['load', '%', 10, 95], ['runtime', 'min', 5, 120]],
            'Power Meter' => [['voltage', 'V', 210, 245], ['load', '%', 20, 98]],
            default => [['health', '%', 60, 100]],
        };
    }

    private function messageFor(Device $device): string
    {
        return match ($device->type) {
            'Fire Alarm' => 'Fire alarm zone signal received; monitoring-only acknowledgement required.',
            'CCTV' => 'Camera/NVR stream heartbeat degraded or offline.',
            'HVAC' => 'HVAC fault or setpoint deviation detected.',
            'Access Control' => 'Door status/access event received.',
            'UPS', 'Power Meter' => 'Power quality or backup runtime event detected.',
            default => $device->type.' device status changed.',
        };
    }
}
