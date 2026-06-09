# NextGen CRM Daily System Report

**Report Date:** 15 May 2026
**Prepared For:** Daily progress report upload
**System URL:** http://192.168.88.133:8001/

## Executive Summary
- The NextGen CRM system has been updated into a working operational CRM for customers, domain services, support requests, domain registrations, subscriptions, renewals, payments, invoice attachments, and service credits.
- Dashboard counts have been corrected so each metric uses clear business logic instead of mixing unrelated request types.
- Seed data has been added across the system so the dashboard, domains page, support pages, registrations, subscriptions, payments, and credits can all be tested immediately.
- Automated verification passed after the latest updates.

## Dashboard Logic
- Total Customers counts all customer records.
- Total Domains counts domain services plus open domain registrations, excluding cancelled records.
- Total Suspended Customers counts customers with suspended account status.
- New Support Requests counts open support-service requests only.
- New Domain Registrations counts open domain registration requests only.
- The Total Domains View Detail card now opens a dedicated /domains listing page.

## Core Features Completed
- Customer listing and customer creation workflows.
- Domain listing page with searchable customer/domain table.
- Support request listing, support request detail view, and clickable notification links.
- Domain registration listing and detail access.
- Admin settings for branding, system name, logo, and email/SMTP settings.
- Admin user creation and role assignment.
- Bulk email validation and SMTP-backed sending to valid addresses.
- Professional Add Customer form layout with corrected start date and renewal date fields.
- Subscription module for Domain Hosting, Internet Service, GPS, Email Hosting, Website Hosting, and Other services.
- Renewal monitoring now includes both hosting requests and subscriptions.
- Payment and invoice attachment tracking for subscriptions.
- Service credit tracking that extends expiry dates for outages or unused service periods.
- ERD and wireframe documentation added under docs/nextgen-crm-erd-wireframe.md.
- LAN run support for http://192.168.88.133:8001/.

## Seeded Test Data
- 5 customer records.
- 6 domain/domain-registration records.
- 1 suspended customer record.
- 3 open support requests.
- 3 open domain registrations.
- 3 subscription records.
- 3 payment records with invoice attachment files.
- 2 service credit records.
- 3 user accounts: admin, staff, and customer portal login.

## Verification Results
- php artisan test passed: 55 tests.
- npm run format:check passed.
- npm run types:check passed.
- npm run lint:check passed.
- npm run build passed.
- php artisan db:seed completed successfully.

## Important Files Updated
- app/Http/Controllers/Crm/DashboardController.php
- app/Http/Controllers/Crm/DomainHostingRequestController.php
- app/Http/Controllers/Crm/CustomerSubscriptionController.php
- app/Http/Middleware/HandleInertiaRequests.php
- app/Models/DomainHostingRequest.php
- app/Models/CustomerSubscription.php
- app/Models/SubscriptionPayment.php
- app/Models/SubscriptionCredit.php
- database/seeders/DatabaseSeeder.php
- database/migrations/2026_05_15_000001_create_customer_subscriptions_tables.php
- resources/js/pages/dashboard.tsx
- resources/js/pages/domains/index.tsx
- resources/js/pages/subscriptions/index.tsx
- resources/js/pages/support/show.tsx
- resources/css/app.css
- routes/web.php

## Operational Notes
- The app is available on the local network at http://192.168.88.133:8001/ when Laravel is served with --host=0.0.0.0 --port=8001.
- SMTP sending requires real SMTP username and password in Admin Settings before emails can be delivered externally.
- Seed data is idempotent and can be run again with php artisan db:seed without intentionally duplicating the demo records.
- Production data should be backed up before running destructive commands such as migrate:fresh.

