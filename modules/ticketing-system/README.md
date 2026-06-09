# Nextgen Ticketing System

Laravel + React service desk for Nextgen Technology Limited.

The application is designed for local XAMPP/MySQL testing and a fast production-style browser experience. It uses Laravel APIs for ticket operations and a React frontend for dashboard, tickets, clients, services, teams, and settings.

## Features

- Dashboard metrics for active, urgent, overdue, and resolved tickets
- Ticket creation, update, deletion, search, filtering, comments, and activity timeline
- SLA logic for overdue and due-soon service requests
- Service lines for Domain Hosting, Email Support, ISP / VSAT, AI CCTV Security, Document Management, and Software Engineering
- Client and team workload views derived from ticket data
- Settings screen for company details, support contacts, profile name/role, and profile picture
- Four-digit due-date year validation from frontend through API
- Safe yearly ticket-number sequencing
- Fast compiled frontend assets for everyday use
- ERD and wireframe documentation in `docs/`

## Requirements

- PHP 8.3+
- Composer
- Node.js and npm
- XAMPP with Apache and MySQL/MariaDB
- Git
- VS Code, recommended for editing/testing

## Clone

```bash
git clone https://github.com/austinkalisik/Nextgen-Ticketing-System.git
cd Nextgen-Ticketing-System
```

Open the folder in VS Code:

```bash
code .
```

## Install

```bash
composer install
npm install
copy .env.example .env
php artisan key:generate
```

For Git Bash/macOS/Linux, use:

```bash
cp .env.example .env
```

## Database

Start XAMPP Apache and MySQL, then create this database in phpMyAdmin:

```text
nextgens_ticketing_system
```

Default `.env` database settings:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nextgens_ticketing_system
DB_USERNAME=root
DB_PASSWORD=
```

Run migrations and demo seed data:

```bash
php artisan migrate --seed
```

If you need to reset everything:

```bash
php artisan migrate:fresh --seed
```

## Everyday Startup

On Windows/XAMPP, double-click:

```text
Start-Nextgens-Ticketing.bat
```

The launcher:

- starts XAMPP Apache/MySQL if it finds them
- waits for MySQL
- builds frontend assets only when needed
- clears and rebuilds Laravel caches
- starts Laravel on port `8000`
- opens the app and phpMyAdmin

Open:

```text
http://127.0.0.1:8000
```

On a LAN desktop IP, the launcher may also open something like:

```text
http://192.168.31.34:8000
```

## Manual Startup

```bash
php artisan optimize:clear
npm run build
php artisan serve --host=127.0.0.1 --port=8000
```

Open:

```text
http://127.0.0.1:8000
```

## Development Mode

Use this only when actively editing React/CSS:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

In another terminal:

```bash
npm run dev
```

If the app appears blank after dev mode, remove `public/hot` or run the everyday launcher.

## Verification

Run before pushing or review:

```bash
php artisan optimize:clear
php artisan test
npm run build
```

Current expected test suite:

```text
7 tests passing
```

## API Summary

```text
GET    /api/dashboard
GET    /api/tickets
POST   /api/tickets
GET    /api/tickets/{ticket}
PUT    /api/tickets/{ticket}
DELETE /api/tickets/{ticket}
POST   /api/tickets/{ticket}/comments
GET    /api/settings
PUT    /api/settings
```

## Documentation

- `docs/erd.md`
- `docs/wireframes.md`
- `docs/assets/nextgen-ticketing-concept.png`
- `docs/assets/implementation-desktop.png`
- `docs/assets/implementation-mobile.png`

## Troubleshooting

- `SQLSTATE[HY000] [1049] Unknown database`: create `nextgens_ticketing_system` in phpMyAdmin.
- `Access denied for user 'root'`: update `DB_USERNAME` and `DB_PASSWORD` in `.env`.
- `Vite manifest not found`: run `npm run build`.
- Blank page after using Vite dev mode: delete `public/hot`, then run `npm run build`.
- Stale routes or settings API returning HTML: run `php artisan optimize:clear`.
- Slow first load on a network drive: use the launcher or `npm run build` so Laravel serves compiled assets.
