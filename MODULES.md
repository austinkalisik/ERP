# ERP Module Inventory

This workspace uses the existing Laravel/React ERP application as the main single-login shell.

## Core Integrated Modules

- HRMS: `/hrms`
- Payroll: `/payroll`
- AIMS inventory/accounting: `/aims`
- MOMS operations: `/moms`
- CRM: `/crm`
- Reports: `/reports`
- Settings and user management: `/settings`
- Integrated Systems launcher: `/systems`

## Included Standalone Source Modules

The following standalone projects were copied into `modules/` for future full merge work:

- `modules/assets-management`
- `modules/monitoring-system`
- `modules/wifi-nac-portal`
- `modules/crm-standalone`
- `modules/ticketing-system`

Dependency folders such as `vendor`, `node_modules`, and generated storage caches were not copied for these standalone modules. Their lock files and source files are present, so dependencies can be installed per module when a deeper merge is required.

## Role Control

The ERP shell uses one login and checks role/permission data from `/api/me`.

- `system_admin`: all modules
- `aims_manager`, `aims_staff`: AIMS and asset inventory
- `crm_manager`, `crm_staff`: CRM and ticketing source visibility
- `moms_manager`, `moms_supervisor`, `moms_operator`: MOMS
- `hr`, `dept_head`, `employee`: HRMS and employee workflows

The `/systems` page filters visible modules using the logged-in user's role and permissions.
