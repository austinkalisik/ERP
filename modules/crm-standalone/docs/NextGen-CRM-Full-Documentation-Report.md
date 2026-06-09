# NextGen CRM Full Documentation and Upgrade Report

Prepared: 21 May 2026  
Project folder: `Z:\NextGen Projects\NextGen CRM`  
Main daily URL through Caddy: `https://192.168.88.133:8443`  
Direct Laravel URL: `http://127.0.0.1:8000`  
Direct Vite dev server: usually `http://127.0.0.1:5173`

Update note, 21 May 2026: this CRM is a clone/rebuild of the current NextGen management system and is being upgraded into a cleaner Laravel + React CRM. It should preserve the familiar operational screens while improving reliability, layout, filtering, renewal management, and service coverage.

## 1. Daily Start Guide in VS Code

Use this section every day when you forget how to start the system.

### Step 1: Open the Project

1. Open VS Code.
2. Click File > Open Folder.
3. Open:

```text
Z:\NextGen Projects\NextGen CRM
```

### Step 2: Open VS Code Terminal

In VS Code press:

```text
Ctrl + `
```

or use:

```text
Terminal > New Terminal
```

Make sure the terminal path is:

```powershell
Z:\NextGen Projects\NextGen CRM>
```

If it is not, run:

```powershell
cd "Z:\NextGen Projects\NextGen CRM"
```

### Step 3: Start the CRM With Laravel, Vite, Queue, and Caddy

Recommended daily development command:

```powershell
composer run dev
```

This starts:

- Laravel development server
- Laravel queue listener
- Vite frontend development server

Then open another VS Code terminal and run Caddy:

```powershell
caddy run --config Caddyfile
```

Open the CRM in your browser:

```text
https://192.168.88.133:8443/login
```

The browser may show a certificate warning because the Caddyfile uses `tls internal`. This is normal for local/internal HTTPS unless the local Caddy root certificate is trusted on the device.

### Alternative Manual Start

If `composer run dev` does not work, use three terminals.

Terminal 1, Laravel:

```powershell
php artisan serve --host=127.0.0.1 --port=8000
```

Terminal 2, Vite:

```powershell
npm run dev -- --host 127.0.0.1
```

Terminal 3, Caddy:

```powershell
caddy run --config Caddyfile
```

### If You Changed PHP, Laravel, or Database Files

Run:

```powershell
php artisan optimize:clear
php artisan migrate
```

### If You Changed React, TypeScript, CSS, or UI Files

Keep Vite running:

```powershell
npm run dev
```

Vite gives live reload for frontend changes.

### If You Need a Production Asset Build

Run:

```powershell
npm run build
```

## 2. Which Server You Are Using

The CRM uses several servers/tools together.

| Layer | What It Does | Current Project Setting |
|---|---|---|
| Laravel server | Runs PHP backend routes, controllers, auth, database access, and Inertia responses | `php artisan serve` on `127.0.0.1:8000` |
| Vite server | Runs frontend development build and live reload for React/Tailwind | `npm run dev`, usually port `5173` |
| Caddy | Provides local HTTPS and reverse proxies browser traffic to Laravel | `https://192.168.88.133:8443` -> `127.0.0.1:8000` |
| MySQL | Stores CRM data | `127.0.0.1:3306`, database `nextgen crm` |
| Laravel queue | Processes queued jobs | Started by `composer run dev` as `php artisan queue:listen --tries=1` |

Current Caddyfile:

```caddy
https://192.168.88.133:8443 {
    tls internal
    reverse_proxy 127.0.0.1:8000
}
```

This means Caddy is the public local HTTPS entry point, but the actual Laravel application runs behind it on port 8000.

## 3. Database You Are Using

The `.env` file currently points to MySQL:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE="nextgen crm"
DB_USERNAME=root
```

Do not put database passwords into documentation. Keep passwords only in `.env`.

Laravel also uses database-backed infrastructure:

```env
SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database
```

That means sessions, queued jobs, and cache records depend on database tables as well.

### Important Database Commands

Run pending migrations safely:

```powershell
php artisan migrate
```

Seed demo data:

```powershell
php artisan db:seed
```

Reset the local development database and seed again:

```powershell
php artisan migrate:fresh --seed
```

Only use `migrate:fresh --seed` on local development data. It deletes all current tables and recreates them.

## 4. How the ERD Connects to the CRM

The current ERD and wireframe files are:

```text
docs\nextgen-crm-erd-wireframe.md
docs\nextgen-crm-erd-wireframe.svg
docs\nextgen-crm-erd-wireframe.png
```

The ERD is the map of the database. The wireframe is the map of the screens. The Laravel migrations create the tables shown in the ERD, Eloquent models connect PHP code to those tables, controllers load data from the models, and React/Inertia pages display the data in the wireframe screens.

Main relationship flow:

```text
customers
  -> users
  -> domain_hosting_requests
  -> customer_subscriptions
       -> subscription_payments
       -> subscription_credits
```

### Main Tables

| Table | Purpose |
|---|---|
| `customers` | Stores company/customer records |
| `users` | Stores admin, staff, and customer login accounts |
| `domain_hosting_requests` | Stores service requests, domain registrations, hosting, ISP, CCTV, support, and related work |
| `customer_subscriptions` | Stores ongoing services such as domain hosting, internet, GPS, email hosting, and website hosting |
| `subscription_payments` | Stores payment history and invoice/payment file attachment metadata |
| `subscription_credits` | Stores service outage or unused-service credits and expiry extensions |
| `system_settings` | Stores branding, email, SMTP, logo, and system settings |
| `sessions`, `cache`, `jobs` | Laravel infrastructure tables |

### ERD to Wireframe Mapping

| Screen | Main Tables Used |
|---|---|
| Dashboard | `customers`, `domain_hosting_requests`, `customer_subscriptions` |
| Customers | `customers` |
| Add Customer | `customers` |
| Domains | `customers`, `domain_hosting_requests` |
| Renewals | `domain_hosting_requests`, `customer_subscriptions` |
| Subscriptions | `customer_subscriptions`, `subscription_payments`, `subscription_credits`, `customers` |
| Support Requests | `domain_hosting_requests`, `customers`, `users` |
| Domain Registrations | `domain_hosting_requests`, `customers` |
| Admin Settings | `system_settings`, `users` |
| Users | `users`, `customers` |
| Customer Portal | `users`, `customers`, `domain_hosting_requests` |

## 5. Tools and Frameworks Used

| Tool | Purpose |
|---|---|
| PHP 8.3 | Backend programming language |
| Laravel 13 | Main backend framework |
| Laravel Artisan | Command-line tool for serve, migrate, test, cache clear, and queue work |
| Composer | PHP dependency manager |
| MySQL | Database server |
| React 19 | Frontend UI library |
| Inertia.js | Connects Laravel routes/controllers to React pages without building a separate API |
| TypeScript | Safer frontend JavaScript |
| Vite | Frontend dev server and asset builder |
| Tailwind CSS 4 | Styling framework |
| shadcn/Radix UI | UI component foundation |
| Laravel Fortify | Login, registration, password reset, email verification, two-factor authentication |
| Caddy | Local HTTPS reverse proxy |
| PHPUnit | Laravel/PHP tests |
| ESLint | JavaScript/TypeScript linting |
| Prettier | Frontend formatting |
| Laravel Pint | PHP formatting |
| VS Code | Main editor |
| Git | Source control |

## 5A. NextGen Website Alignment

The public NextGen website at `https://nextgenpng.net/` positions Nextgen Technology as Papua New Guinea's premier domain hosting and ICT services provider. The CRM should therefore track customers and subscriptions across the same service lines promoted on the website:

- Domain hosting.
- .pg domain registration.
- POP3 email accounts.
- Website hosting.
- Email anti-spam protection.
- Internet Service Provider services.
- CCTV/security and surveillance.
- Document management solutions.
- Vehicle tracking systems.
- Audio visual systems.
- Network and infrastructure services.
- Website design and application development.

The CRM service categories already cover these areas through domain/hosting requests and subscription service types. The next upgrade should add clearer product/plan records for Basic, Standard, Value, and Premium hosting plans, including monthly prices and plan limits from the website.

## 6. Current Features Already Built

### Latest UI and Behavior Fixes

- Create Subscription form fields were expanded and repaired so date, status, amount, service name, and reference inputs are no longer clipped.
- Subscription create form now has a working collapse/expand control.
- Subscription register now has a working collapse/expand control.
- Subscription register now supports horizontal scrolling when the table is wider than the available desktop viewport.
- Dashboard Total Suspended Customers now links to `/customers?status=suspended`.
- Customer listing now supports a suspended-only server-side status filter.
- Renewals page now has summary cards for total renewals, hosting/domain renewals, subscription renewals, and selected updates.
- Renewals page now supports selecting/clearing visible rows before updating.
- Renewals search area was cleaned up with clearer month search, update, and selected-count behavior.

### Authentication and Roles

- Login.
- Registration route support.
- Password reset.
- Email verification routes.
- Two-factor authentication support.
- Admin, staff, and customer roles.
- Active/inactive user flag.
- Customer users can be linked to a customer record.

### Dashboard

- Customer metrics.
- Domain metrics.
- Suspended customer metrics.
- Open support request metrics.
- Domain registration metrics.
- Recent request list.
- Staff dashboard and customer portal routing.

### Customer Management

- Customer listing.
- Add customer screen.
- Customer create/update.
- Admin-only customer delete.
- Customer fields: company, contact, email, phone, industry, status, website, address, notes, next follow-up date.

### Domain and Hosting Requests

- Hosting/service request index.
- Domain listing.
- Domain registration listing.
- Support request listing.
- Support request detail page.
- Request create/update.
- Admin-only request delete.
- Assignee support.
- Quote amount support.
- Renewal date support.
- Internal notes.

Supported service types include:

- Domain registration.
- Website hosting.
- Email hosting.
- Email anti-spam.
- Domain hosting.
- SSL.
- Domain transfer.
- ISP connectivity.
- Network infrastructure.
- CCTV/security.
- Document management.
- Vehicle tracking.
- Audio visual.
- Web/app development.
- Support contract.

### Subscription Management

- Subscription listing.
- Add subscription.
- Update subscription.
- Admin-only subscription delete.
- Service type categories.
- Start date and expiry date.
- Renewal cycle.
- Amount.
- Status.
- Reference number.
- Notes.
- Linked customer.

### Payments and Invoice Attachments

- Payment records per subscription.
- Paid date.
- Payment period start/end.
- Payment amount.
- Payment reference.
- Invoice number.
- Attachment upload.
- Staff-only attachment download route.
- Supported attachment types: PDF, JPG, JPEG, PNG, DOC, DOCX, XLS, XLSX.

### Service Credits

- Credit start date and end date.
- Credit amount.
- Required reason.
- Automatic month calculation.
- Automatic subscription expiry extension when credit is saved.
- Credit history per subscription.

### Renewals

- Monthly renewal view.
- Shows hosting/domain renewal records.
- Shows subscription expiry records.
- Updates selected renewal dates.

### Bulk Email Validator

- Validates email list input.
- Shows valid/invalid results.
- Sends bulk email if SMTP username and password are configured.
- Uses the `BulkEmailMessage` mail class.

### Admin Settings

- Brand/system name.
- Logo upload.
- Email from address/name.
- SMTP host, port, scheme, username, and password.
- Send-email user selection.

### Customer Portal

- Customer users see their own customer data.
- Customer users see their own requests.
- Customer users can submit requests, with staff-only fields protected.

## 7. Current Routes

The project currently has 69 Laravel routes. Important CRM routes:

| URL | Purpose |
|---|---|
| `/login` | Login |
| `/dashboard` | Dashboard or customer portal redirect behavior |
| `/customers` | Customer list |
| `/add-customer` | Add customer |
| `/domains` | Domain list |
| `/renewals` | Renewal monitoring |
| `/subscriptions` | Subscription management |
| `/hosting-requests` | Service request management |
| `/support-requests` | Support request list |
| `/domain-registrations` | Domain registration workflow |
| `/bulk-email-validator` | Bulk email tool |
| `/admin-settings` | Branding and email settings |
| `/users` | Admin user management |
| `/settings/profile` | User profile |
| `/settings/security` | Password and security |
| `/settings/appearance` | Appearance settings |

## 8. Demo Accounts

Seeded demo users use:

```text
password
```

Accounts:

```text
admin@nextgenpng.net
staff@nextgenpng.net
customer@nextgenpng.net
```

Change seeded passwords before any production use.

## 9. What Is Missing or Needs Improvement

### High Priority

1. Automated renewal reminders by email/SMS/dashboard notification.
2. Production backup process for MySQL and uploaded invoice files.
3. Production deployment plan with domain name, public SSL, queue worker, scheduler, and database backup.
4. Audit log for important actions such as deleting customers, changing subscriptions, applying credits, and updating SMTP settings.
5. Stronger permissions policy for staff vs admin vs customer.
6. Customer portal invoice/payment visibility decision.
7. Password policy and forced password change for seeded/demo users.
8. Product/plan table for NextGen website hosting plans: Basic, Standard, Value, Premium.
9. Direct migration/import plan from the current cloned management system into the upgraded CRM schema.

### Business Features to Add

1. Invoice generator and printable receipt.
2. Payment status per subscription: paid, partial, overdue, unpaid.
3. Customer statement report.
4. Expiring soon report.
5. Overdue invoice report.
6. Service credit approval workflow.
7. Ticket comments and activity timeline.
8. File attachments for support requests, not only subscription payments.
9. Task assignment and due-date reminders for staff.
10. Customer communication history.
11. Quote/proposal module.
12. Product/service catalog with pricing.
13. Dashboard charts for revenue, renewals, support workload, and service categories.
14. Hosting plan catalog matching NextGen public website prices and limits.
15. Domain availability/registration workflow integration if NextGen wants end-to-end .pg registration tracking.
16. Email settings lookup/help page for customer support staff.

### Technical Improvements

1. Add automated browser tests for critical workflows.
2. Add API/resource tests for permissions.
3. Add database indexes for frequently filtered fields after production data grows.
4. Add soft deletes for business records so accidental delete can be recovered.
5. Add file storage policy for invoice attachments and branding uploads.
6. Add scheduled command for renewal reminders.
7. Add queue worker service for production.
8. Add `.env.example` review to match the Caddy and MySQL setup.
9. Add a one-command Windows startup script for Laravel, Vite, queue, and Caddy.
10. Add deployment documentation for a real server.

## 10. Upgrade Plan

### Phase 1: Stabilize Daily Development

- Create one reliable Windows startup script.
- Align `start crm.txt`, `tools/start-laravel.cmd`, `tools/start-vite.cmd`, README, and Caddyfile with the current project path.
- Add a daily checklist to the docs folder.
- Confirm whether development should use port 8000 or 8001 and keep it consistent everywhere.
- Keep the cloned legacy navigation familiar while progressively replacing broken layouts with reliable Laravel/React screens.

### Phase 2: Protect Data

- Add backup script for MySQL.
- Add backup script for `storage/app/public`.
- Add restore instructions.
- Add soft deletes to customers, subscriptions, requests, payments, and credits.
- Add audit log.

### Phase 3: Improve CRM Operations

- Add renewal reminders.
- Add subscription payment status.
- Add customer statements.
- Add PDF invoice/receipt generation.
- Add support request attachments.
- Add staff task due dates and dashboard alerts.
- Add service plan catalog aligned to `nextgenpng.net` hosting and ICT services.

### Phase 4: Production Readiness

- Move from local Caddy/internal TLS to a real domain with public SSL.
- Configure queue worker as a service.
- Configure Laravel scheduler.
- Configure production `.env`.
- Set `APP_ENV=production`.
- Set `APP_DEBUG=false`.
- Use real SMTP credentials.
- Use strong admin passwords.
- Add monitoring/log review.

## 11. Quality Commands

Run these before saying the CRM is ready:

```powershell
npm run types:check
npm run lint:check
npm run format:check
npm run build
php artisan test
```

Run PHP formatting:

```powershell
composer run lint
```

Run PHP format check:

```powershell
composer run lint:check
```

Clear Laravel cache:

```powershell
php artisan optimize:clear
```

List routes:

```powershell
php artisan route:list
```

## 12. Troubleshooting

### Page Does Not Open

Check that Laravel is running:

```powershell
php artisan serve --host=127.0.0.1 --port=8000
```

Check that Caddy is running:

```powershell
caddy run --config Caddyfile
```

Open:

```text
https://192.168.88.133:8443/login
```

### Frontend Changes Do Not Show

Start Vite:

```powershell
npm run dev
```

If still broken:

```powershell
npm run build
php artisan optimize:clear
```

### Database Error

Check MySQL is running and confirm `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE="nextgen crm"
```

Then run:

```powershell
php artisan migrate
```

### Login Does Not Work

For local seeded data:

```powershell
php artisan db:seed
```

Then login:

```text
admin@nextgenpng.net
password
```

### Caddy Certificate Warning

The Caddyfile uses:

```caddy
tls internal
```

That creates an internal certificate. For local development this is fine. For production, use a real domain and a public trusted certificate.

## 13. How to Become Stronger as the Programmer of This CRM

Daily habits:

1. Read one controller each day.
2. Read one React page each day.
3. Run the test commands before and after changes.
4. Make one small improvement at a time.
5. Commit changes with clear messages.
6. Keep `.env` secrets private.
7. Never run destructive database commands on production.
8. Write down every fix in `docs`.

Core Laravel skills to master:

- Routes.
- Controllers.
- Models and relationships.
- Migrations.
- Validation.
- Middleware.
- Authentication and authorization.
- Queues.
- Scheduler.
- Testing.

Core React/Inertia skills to master:

- Props from Laravel controllers.
- Forms.
- State.
- TypeScript types.
- Component reuse.
- Layouts.
- Error handling.
- Responsive design.

Core database skills to master:

- Primary keys.
- Foreign keys.
- Indexes.
- Joins.
- Backups.
- Restore testing.
- Data integrity.

## 14. Daily Quick Checklist

```text
1. Open VS Code.
2. Open Z:\NextGen Projects\NextGen CRM.
3. Open terminal.
4. Run: composer run dev
5. Open second terminal.
6. Run: caddy run --config Caddyfile
7. Open: https://192.168.88.133:8443/login
8. Login with admin account.
9. Before coding run: git status --short
10. After coding run tests/build.
11. Write what changed.
12. Commit when ready.
```

## 15. Expert Notes

- Keep one source of truth for ports. Right now the Caddyfile expects Laravel on port 8000. Some older notes mention 8001. Choose one and update all docs/scripts to match.
- `composer run dev` is the best development start command because it already starts Laravel, queue, and Vite together.
- Caddy should stay in a separate terminal because it is the reverse proxy.
- Do not expose `.env` passwords in Git or documentation.
- Do not use `php artisan migrate:fresh --seed` unless you are comfortable deleting local data.
- Before production launch, add backups, audit logs, real SMTP, strong passwords, scheduler, queue service, and HTTPS with a real domain.
