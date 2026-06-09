# NextGen CRM

Premium Laravel + React CRM for Nextgen Technology Limited PNG.

The CRM covers customer records, service requests, domain hosting, .pg registration, POP3/email support, email anti-spam, ISP/connectivity, network infrastructure, CCTV/security, document management, vehicle tracking, audio visual, web/app development, quotes, renewals, staff assignment, user roles, and customer self-service login.

## Stack

- Laravel 13
- React 19 with Inertia
- MySQL
- Tailwind CSS/shadcn UI
- PHPUnit

## Requirements

- PHP 8.3 or newer
- Composer
- Node.js 22 or newer
- npm
- MySQL 8 or compatible

## Project Assets

- Premium UI concept: `docs/premium-crm-concept.png`
- ERD + wireframe: `docs/nextgen-crm-erd-wireframe.png`
- Editable SVG version: `docs/nextgen-crm-erd-wireframe.svg`
- Current ERD + wireframe markdown: `docs/nextgen-crm-erd-wireframe.md`

## Clone

```bash
git clone https://github.com/austinkalisik/Nextgen-CRM.git
cd Nextgen-CRM
```

## Quick Start

Create the database first:

```sql
CREATE DATABASE nextgen_crm_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Install and prepare the app on Windows:

```powershell
composer install
npm install
copy .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
npm run build
php artisan serve --host=127.0.0.1 --port=8001
```

Install and prepare the app on macOS/Linux:

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
npm run build
php artisan serve --host=127.0.0.1 --port=8001
```

Open:

```text
http://127.0.0.1:8001/login
```

## Environment

The default `.env.example` expects this local database. If your MySQL username,
password, host, or port differ, update `.env`:

```env
APP_NAME="NextGen CRM"
APP_URL=http://127.0.0.1:8001

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nextgen_crm_app
DB_USERNAME=root
DB_PASSWORD=
```

## Demo Logins

All seeded accounts use password:

```text
password
```

Accounts:

```text
admin@nextgenpng.net
staff@nextgenpng.net
customer@nextgenpng.net
```

## Run Locally

After setup, run the built app:

```bash
php artisan serve --host=127.0.0.1 --port=8001
```

For active frontend development, use two terminals:

```bash
php artisan serve --host=127.0.0.1 --port=8001
```

```bash
npm run dev
```

## Test

```bash
npm run types:check
npm run build
php artisan test
```

Current verified status:

```text
45 tests passed
TypeScript passed
Vite build passed
```

## Pull Latest Changes

```bash
git pull origin main
composer install
npm install
php artisan migrate --force
npm run build
php artisan optimize:clear
```

If you need a clean local test database:

```bash
php artisan migrate:fresh --seed
```

## Core Modules

- Dashboard: CRM metrics, recent service requests, and NextGen service coverage.
- Customers: CRUD for company/customer information, contact details, statuses, notes, and follow-up dates.
- Service Requests: CRUD for domain hosting and wider ICT services, quotes, assignees, status, dates, and internal notes.
- Users & Roles: admin-only user creation, role assignment, customer linkage, and activation.
- Customer Portal: customer users can view their own requests and submit new service requests.

## Role Rules

- `admin`: full access, including delete operations and user management.
- `staff`: manage customers and service requests, no user management.
- `customer`: customer portal only; can view own account and submit own requests.
