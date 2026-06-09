# NextGen ERP System

Laravel 12 backend with a React/Vite frontend for ERP operations, including HRMS, payroll, AIMS inventory, MOMS operations, CRM, reports, settings, and integrated modules.

## Repository

```text
https://github.com/austinkalisik/ERP.git
```

## Requirements

Install these before running the system:

- PHP 8.2 or newer
- Composer
- Node.js 20 or newer
- npm
- MySQL or MariaDB
- PHP extensions commonly required by Laravel, including `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`, and `fileinfo`

The default local setup expects a MySQL or MariaDB database named `ERP` on `127.0.0.1:3306`.

## Clone The Project

```powershell
git clone https://github.com/austinkalisik/ERP.git
cd ERP
```

If you forked the project first, clone your fork instead:

```powershell
git clone https://github.com/YOUR_USERNAME/ERP.git
cd ERP
git remote -v
```

To keep a fork connected to the original repository:

```powershell
git remote add upstream https://github.com/austinkalisik/ERP.git
```

## First-Time Setup

Install PHP dependencies:

```powershell
composer install
```

Install frontend dependencies:

```powershell
npm install
```

Create your local environment file:

```powershell
Copy-Item .env.example .env
```

Generate the Laravel app key:

```powershell
php artisan key:generate
```

Create a MySQL or MariaDB database named:

```text
ERP
```

Update `.env` if your database username or password is different:

```text
APP_URL=http://127.0.0.1:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ERP
DB_USERNAME=root
DB_PASSWORD=
SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173,localhost:5174,127.0.0.1:5174
VITE_API_URL=http://127.0.0.1:8000
```

Use `DB_CONNECTION=mariadb` if your Laravel PHP setup requires the MariaDB driver name.

Run migrations and seed the default data:

```powershell
php artisan migrate --seed
```

Clear cached configuration after changing `.env`:

```powershell
php artisan optimize:clear
```

## Run The System

Open two PowerShell terminals in the project root.

Terminal 1, start Laravel:

```powershell
php artisan serve
```

Expected backend URL:

```text
http://127.0.0.1:8000
```

Terminal 2, start Vite:

```powershell
npm run dev
```

Expected frontend URL:

```text
http://127.0.0.1:5173
```

Open the frontend URL in your browser. The frontend sends API requests to the Laravel backend configured by `VITE_API_URL`.

## One-Command Development Mode

The Composer dev script starts Laravel, the queue listener, Laravel logs, and Vite together:

```powershell
composer run dev
```

This command uses `npx concurrently`. If npm asks to install `concurrently`, approve it.

## Default Login Accounts

After `php artisan migrate --seed`, these test accounts are available:

| Role | Email | Password |
| --- | --- | --- |
| System Admin | `admin@erp.test` | `password123` |
| HR | `hr@erp.test` | `password123` |
| Department Head | `head@erp.test` | `password123` |
| AIMS Manager | `aims.manager@erp.test` | `password123` |
| AIMS Staff | `aims.staff@erp.test` | `password123` |
| MOMS Manager | `moms.manager@erp.test` | `password123` |
| MOMS Supervisor | `moms.supervisor@erp.test` | `password123` |
| MOMS Operator | `moms.operator1@erp.test` | `password123` |

Some local builds may also include this merged ERP demo account:

```text
admin@nextgenpng.net
password
```

## Build And Test

Run Laravel tests:

```powershell
php artisan test
```

Run frontend linting:

```powershell
npm run lint
```

Build frontend assets:

```powershell
npm run build
```

Preview the production frontend build:

```powershell
npm run preview
```

## Reset The Local Database

This deletes all tables and recreates seed data:

```powershell
php artisan migrate:fresh --seed
```

Only run this on a local development database.

## Git Workflow

Check your current changes:

```powershell
git status
```

Create a branch:

```powershell
git checkout -b feature/my-change
```

Commit changes:

```powershell
git add .
git commit -m "Describe your change"
```

Push your branch:

```powershell
git push -u origin feature/my-change
```

If you forked the repo, push to your fork and open a pull request back to:

```text
austinkalisik/ERP
```

To update your local copy from GitHub:

```powershell
git pull origin main
```

If you are working from a fork and added `upstream`:

```powershell
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## Troubleshooting

If login or API pages fail:

```powershell
php artisan optimize:clear
php artisan migrate --seed
```

Confirm the backend and frontend URLs match `.env`:

```text
APP_URL=http://127.0.0.1:8000
VITE_API_URL=http://127.0.0.1:8000
SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173,localhost:5174,127.0.0.1:5174
```

If backend port `8000` is busy:

```powershell
php artisan serve --port=8001
```

Then update `.env`:

```text
APP_URL=http://127.0.0.1:8001
VITE_API_URL=http://127.0.0.1:8001
```

If Vite uses another port, open the URL printed by `npm run dev` and add that host to `SANCTUM_STATEFUL_DOMAINS` if authentication cookies do not work.

If dependencies act stale:

```powershell
composer install
npm install
php artisan optimize:clear
```

## Notes

Do not commit `.env`, `vendor/`, or `node_modules/`. They are intentionally ignored because they contain local secrets or generated dependency files. Use `.env.example`, `composer.lock`, and `package-lock.json` to reproduce the project on another machine.
