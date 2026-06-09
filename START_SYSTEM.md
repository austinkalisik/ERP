# How To Start The ERP System

This file is beside `README.md` in the main ERP folder.

Project folder:

```powershell
a:\NextGen Projects\ERP
```

## Database Configuration For DBeaver ERP Database

Your DBeaver screenshot shows a local database named `ERP` under `127.0.0.1`.

The Laravel `.env` file should use these database settings:

```text
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ERP
DB_USERNAME=root
DB_PASSWORD=
```

Use `DB_CONNECTION=mysql` for MySQL. If your server is MariaDB and MySQL gives connection problems, use:

```text
DB_CONNECTION=mariadb
```

If your DBeaver connection uses a password, put the same password in:

```text
DB_PASSWORD=your_password_here
```

After changing `.env`, always clear Laravel config:

```powershell
php artisan optimize:clear
```

## First Time Only

Open PowerShell in the project folder:

```powershell
cd "a:\NextGen Projects\ERP"
```

Install PHP packages:

```powershell
composer install
```

Install frontend packages:

```powershell
npm install
```

Create the `.env` file if it does not already exist:

```powershell
Copy-Item .env.example .env
```

Create the app key:

```powershell
php artisan key:generate
```

Make sure the `ERP` database exists in DBeaver or phpMyAdmin.

Create database tables and default login users:

```powershell
php artisan migrate --seed
```

Do not run `php artisan migrate:fresh --seed` unless you want to delete and recreate all tables in the `ERP` database.

## Start The System

Open two PowerShell windows in this folder:

```powershell
cd "a:\NextGen Projects\ERP"
```

In PowerShell window 1, start the Laravel backend:

```powershell
php artisan serve
```

Keep this window open.

In PowerShell window 2, start the React frontend:

```powershell
npm run dev
```

Keep this window open.

Open this frontend address in your browser:

```text
http://127.0.0.1:5173
```

The backend should be running at:

```text
http://127.0.0.1:8000
```

## Default Login

Use one of these accounts after running `php artisan migrate --seed`:

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

## Stop The System

In each PowerShell window, press:

```text
Ctrl + C
```

## Common Problems

If login or pages do not load, run:

```powershell
php artisan optimize:clear
php artisan migrate --seed
```

If the login says `Login failed` even when the email and password are correct, check these settings in `.env`:

```text
APP_URL=http://127.0.0.1:8000
SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173,localhost:5174,127.0.0.1:5174
VITE_API_URL=http://127.0.0.1:8000
```

Then restart both servers:

```text
Ctrl + C
```

Start Laravel again:

```powershell
php artisan serve
```

If `php artisan serve` starts but the browser cannot connect to `http://127.0.0.1:8000`, stop it with `Ctrl + C` and use this backend command instead:

```powershell
php -S 127.0.0.1:8000 -t public
```

Start Vite again:

```powershell
npm run dev
```

The frontend must call the same backend port that Laravel is using. If Laravel says it is running at `http://127.0.0.1:8000`, then `VITE_API_URL` must also be `http://127.0.0.1:8000`.

If backend port `8000` is busy, start it on another port:

```powershell
php artisan serve --port=8001
```

If you change the backend port, also update the frontend API URL in:

```text
src/api/baseApi.js
```

If frontend port `5173` is busy, Vite may show another address like `http://127.0.0.1:5174`. Use the address printed in the PowerShell window.

## Current Merged ERP Run

For this rebuilt Laravel + React version, I started Laravel here:

```text
http://127.0.0.1:8010
```

And Vite here:

```text
http://127.0.0.1:5173
```

Open the Laravel URL first. Laravel loads the React ERP through `@vite('src/main.jsx')`.

Merged ERP demo login:

```text
admin@nextgenpng.net
password
```
