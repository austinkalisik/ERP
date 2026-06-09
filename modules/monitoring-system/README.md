# Integrated Building Monitoring Control Panel

Laravel + React control-room MVP for centralized building monitoring across CCTV, fire alarm, HVAC, access control, UPS/power, environmental sensors, leak sensors, and network devices.

The first version runs with simulated data only. The backend is separated into services and integration placeholders so real MQTT, ONVIF/RTSP, BACnet/IP, Modbus TCP, REST API, and dry-contact fire alarm gateways can be added later without changing the UI contract.

## Stack

- Laravel 13 skeleton / latest stable Laravel runtime available in this environment
- React + Vite
- Tailwind CSS
- Recharts
- Lucide React
- Token-protected REST API with Sanctum-style `personal_access_tokens` schema
- SQLite by default for local demo; MySQL/PostgreSQL ready through `.env`

## Demo Logins

All seeded users use password `password`.

- `admin@building.test`
- `supervisor@building.test`
- `operator@building.test`
- `technician@building.test`
- `viewer@building.test`

## Local Setup

```bash
composer install
php artisan key:generate
php artisan migrate --seed
npm install
npm run dev
php artisan serve
```

Open `http://127.0.0.1:8000`.

For a production frontend bundle:

```bash
npm run build
```

## Simulation

Generate random readings and monitoring events:

```bash
php artisan monitoring:simulate --events=10
```

The simulation lives in `app/Services/SimulationService.php`. Replace or supplement this with real integrations as hardware becomes available.

## API

Authentication:

- `POST /api/login`
- `POST /api/logout`
- `GET /api/user`

Core endpoints:

- `GET /api/dashboard/summary`
- `GET|POST|GET{id}|PATCH{id}|DELETE{id} /api/devices`
- `GET /api/events`
- `GET /api/events/{event}`
- `POST /api/events/{event}/acknowledge`
- `GET /api/device-readings`
- `GET|POST|GET{id}|PATCH{id}|DELETE{id} /api/maintenance`
- `GET /api/integration-settings`
- `PATCH /api/integration-settings/{integrationSetting}`
- `GET /api/reports/summary`

Use the bearer token returned by login:

```http
Authorization: Bearer <token>
```

## Database Coverage

Migrations and seeders include:

- users with roles
- locations
- devices
- device readings
- events
- alarm acknowledgements
- maintenance logs
- integration settings
- audit logs
- personal access tokens

Seed data includes 44 devices, 100+ events, 20+ readings, critical fire alarm events, CCTV offline events, HVAC faults, and maintenance tickets.

## Real Integration Extension Points

Service classes:

- `DeviceStatusService`
- `AlarmService`
- `NotificationService`
- `SimulationService`
- `IntegrationGatewayService`
- `AuditLogService`

Placeholder integration classes:

- `MqttIntegrationService`
- `OnvifCameraService`
- `BacnetIntegrationService`
- `ModbusIntegrationService`
- `FireAlarmGatewayService`

Fire alarm is monitoring-only. Real panel connections must be performed by certified fire contractors using approved gateway hardware and local compliance procedures.

## Production Notes

- Set `APP_ENV=production`, `APP_DEBUG=false`, and a generated `APP_KEY`.
- Use MySQL or PostgreSQL by setting `DB_CONNECTION`, `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD`.
- Run `php artisan migrate --force`.
- Build assets with `npm ci && npm run build`.
- Configure the web server document root to `public/`.
- Run queue workers if notifications or future broadcast jobs are enabled.
- Store real device credentials in environment variables or encrypted server-side stores, never in frontend payloads.
- Put the app behind HTTPS and restrict network access to building-management VLANs where appropriate.

## Proposal Screens

The application opens directly to the dashboard after login and includes proposal-ready screens for dashboard, devices, alarms, fire alarm, CCTV, HVAC, access control, power/UPS, maintenance, reports, and integration settings.
