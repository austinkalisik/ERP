<?php

namespace Database\Seeders;

use App\Models\Device;
use App\Models\DeviceReading;
use App\Models\Event;
use App\Models\IntegrationSetting;
use App\Models\Location;
use App\Models\MaintenanceLog;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $users = collect([
            ['Admin User', 'admin@building.test', 'admin'],
            ['Supervisor User', 'supervisor@building.test', 'supervisor'],
            ['Operator User', 'operator@building.test', 'operator'],
            ['Technician User', 'technician@building.test', 'technician'],
            ['Viewer User', 'viewer@building.test', 'viewer'],
        ])->map(fn ($row) => User::updateOrCreate(
            ['email' => $row[1]],
            ['name' => $row[0], 'role' => $row[2], 'password' => Hash::make('password')]
        ));

        $locations = collect([
            ['Main Tower', 'B1', 'Electrical Room', 'Power'],
            ['Main Tower', 'Ground', 'Lobby', 'Public'],
            ['Main Tower', 'Level 1', 'Server Room', 'IT'],
            ['Main Tower', 'Level 2', 'ICU Wing', 'Clinical'],
            ['Main Tower', 'Level 3', 'Administration', 'Office'],
            ['Training Block', 'Ground', 'Reception', 'Public'],
            ['Training Block', 'Level 1', 'Classrooms', 'Academic'],
            ['Warehouse', 'Ground', 'Loading Bay', 'Logistics'],
            ['Warehouse', 'Mezzanine', 'Plant Room', 'Mechanical'],
            ['Campus Yard', 'Outdoor', 'Gatehouse', 'Perimeter'],
        ])->map(fn ($row) => Location::create(['building' => $row[0], 'floor' => $row[1], 'room' => $row[2], 'zone' => $row[3]]));

        $types = ['CCTV', 'Fire Alarm', 'HVAC', 'Access Control', 'UPS', 'Power Meter', 'Water Leak Sensor', 'Temperature Sensor', 'Humidity Sensor', 'Network Switch', 'Gateway'];
        $protocols = ['MQTT', 'ONVIF', 'RTSP', 'BACnet', 'Modbus', 'REST API', 'Dry Contact', 'Manual'];

        for ($i = 1; $i <= 44; $i++) {
            $type = $types[($i - 1) % count($types)];
            $location = $locations->random();
            Device::create([
                'location_id' => $location->id,
                'name' => sprintf('%s-%02d %s', strtoupper(str_replace(' ', '', $location->zone ?? 'ZONE')), $i, $type),
                'type' => $type,
                'ip_address' => "10.20.".intdiv($i, 20).".".($i + 20),
                'protocol' => $type === 'Fire Alarm' ? 'Dry Contact' : ($type === 'CCTV' ? fake()->randomElement(['ONVIF', 'RTSP']) : fake()->randomElement($protocols)),
                'status' => fake()->randomElement(['online', 'online', 'online', 'offline', 'warning', 'alarm', 'maintenance']),
                'last_heartbeat' => now()->subMinutes(fake()->numberBetween(1, 180)),
                'manufacturer' => fake()->randomElement(['Axis', 'Honeywell', 'Daikin', 'Schneider', 'APC', 'Cisco', 'Siemens', 'Johnson Controls']),
                'model' => strtoupper(fake()->bothify('M-###??')),
                'serial_number' => strtoupper(fake()->bothify('SN-####-????')),
                'notes' => 'Demo simulated endpoint. Credentials are intentionally not exposed to the frontend.',
                'metadata' => [
                    'rtsp_url' => $type === 'CCTV' ? 'rtsp://camera-'.$i.'/stream1' : null,
                    'onvif_url' => $type === 'CCTV' ? 'http://camera-'.$i.'/onvif/device_service' : null,
                    'target_temperature' => $type === 'HVAC' ? fake()->numberBetween(21, 24) : null,
                    'mode' => $type === 'HVAC' ? fake()->randomElement(['cool', 'fan', 'auto', 'off']) : null,
                    'last_test_date' => $type === 'Fire Alarm' ? now()->subDays(fake()->numberBetween(10, 120))->toDateString() : null,
                ],
            ]);
        }

        $devices = Device::with('location')->get();
        foreach ($devices->random(24) as $device) {
            foreach ($this->metricsFor($device->type) as [$metric, $unit, $min, $max]) {
                DeviceReading::create([
                    'device_id' => $device->id,
                    'metric' => $metric,
                    'value' => fake()->randomFloat(2, $min, $max),
                    'unit' => $unit,
                    'recorded_at' => now()->subMinutes(fake()->numberBetween(1, 1440)),
                ]);
            }
        }

        $templates = [
            ['Fire Alarm', 'alarm', 'critical', 'Fire alarm Zone %s active. Certified contractor dispatch required for real panel investigation.'],
            ['CCTV', 'fault', 'high', 'Camera stream offline or NVR heartbeat missing.'],
            ['HVAC', 'fault', 'medium', 'HVAC compressor fault and temperature drift detected.'],
            ['Access Control', 'warning', 'medium', 'Door held open beyond allowed interval.'],
            ['UPS', 'warning', 'high', 'UPS battery runtime below threshold.'],
            ['Water Leak Sensor', 'alarm', 'critical', 'Water leak sensor active near protected area.'],
            ['Network Switch', 'fault', 'high', 'Network device unreachable by monitoring gateway.'],
            ['Power Meter', 'warning', 'medium', 'Power quality threshold exceeded.'],
        ];

        foreach (range(1, 108) as $n) {
            $template = fake()->randomElement($templates);
            $device = $devices->where('type', $template[0])->random();
            Event::create([
                'device_id' => $device->id,
                'event_type' => $template[1],
                'severity' => $template[2],
                'location' => "{$device->location->building} {$device->location->floor} {$device->location->zone}",
                'message' => sprintf($template[3], $device->location->zone ?: $device->location->room),
                'occurred_at' => now()->subMinutes(fake()->numberBetween(1, 10080)),
                'acknowledged' => $n % 5 === 0,
                'acknowledged_by' => $n % 5 === 0 ? $users->where('role', 'operator')->first()->id : null,
                'acknowledged_at' => $n % 5 === 0 ? now()->subMinutes(fake()->numberBetween(1, 120)) : null,
                'resolution_notes' => $n % 5 === 0 ? 'Demo acknowledgement recorded.' : null,
            ]);
        }

        foreach ($devices->random(12) as $device) {
            MaintenanceLog::create([
                'device_id' => $device->id,
                'assigned_technician_id' => $users->where('role', 'technician')->first()->id,
                'issue' => fake()->randomElement(['Preventive inspection due', 'Intermittent heartbeat', 'Battery replacement required', 'Sensor calibration required', 'Lens cleaning and NVR check']),
                'priority' => fake()->randomElement(['low', 'medium', 'high', 'critical']),
                'status' => fake()->randomElement(['open', 'in progress', 'resolved']),
                'due_date' => now()->addDays(fake()->numberBetween(1, 30)),
                'resolution_notes' => fake()->optional()->sentence(),
            ]);
        }

        foreach ([
            ['mqtt', 'MQTT Broker', ['host' => '127.0.0.1', 'port' => 1883, 'username' => 'demo', 'password' => 'secret']],
            ['onvif_rtsp', 'Camera Gateway', ['discovery_subnet' => '10.20.0.0/16', 'credential_secret' => 'stored-server-side']],
            ['bacnet_ip', 'BACnet Gateway', ['host' => '10.20.5.10', 'port' => 47808]],
            ['modbus_tcp', 'Modbus Gateway', ['host' => '10.20.6.10', 'unit_id' => 1]],
            ['rest_api', 'External REST Connector', ['base_url' => 'https://example.invalid/api', 'token_secret' => 'stored-server-side']],
            ['notification', 'SMS / Email Notifications', ['email_enabled' => true, 'sms_enabled' => false]],
        ] as [$type, $name, $settings]) {
            IntegrationSetting::create(['type' => $type, 'name' => $name, 'settings' => $settings, 'enabled' => false]);
        }
    }

    private function metricsFor(string $type): array
    {
        return match ($type) {
            'HVAC', 'Temperature Sensor' => [['temperature', 'C', 18, 33], ['humidity', '%', 35, 78], ['runtime', 'hrs', 40, 12000]],
            'Humidity Sensor' => [['humidity', '%', 35, 90]],
            'UPS' => [['battery', '%', 25, 100], ['load', '%', 10, 95], ['runtime', 'min', 5, 120]],
            'Power Meter' => [['voltage', 'V', 210, 245], ['load', '%', 20, 98]],
            default => [['health', '%', 60, 100]],
        };
    }
}
