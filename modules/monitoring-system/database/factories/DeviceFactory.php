<?php

namespace Database\Factories;

use App\Models\Location;
use Illuminate\Database\Eloquent\Factories\Factory;

class DeviceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'location_id' => Location::factory(),
            'name' => fake()->words(3, true),
            'type' => fake()->randomElement(['CCTV', 'Fire Alarm', 'HVAC', 'Access Control', 'UPS', 'Power Meter']),
            'protocol' => fake()->randomElement(['MQTT', 'ONVIF', 'RTSP', 'BACnet', 'Modbus', 'REST API', 'Dry Contact', 'Manual']),
            'status' => fake()->randomElement(['online', 'offline', 'warning', 'alarm', 'maintenance']),
            'last_heartbeat' => now(),
        ];
    }
}
