# NextGen CRM ERD and Wireframe

Generated from the current Laravel models, migrations, and routes.

## ERD

```mermaid
erDiagram
    CUSTOMERS ||--o{ USERS : "has portal users"
    CUSTOMERS ||--o{ DOMAIN_HOSTING_REQUESTS : "owns requests"
    USERS ||--o{ DOMAIN_HOSTING_REQUESTS : "assigned to"
    USERS ||--o{ SESSIONS : "auth sessions"

    CUSTOMERS {
        bigint id PK
        string company_name
        string contact_name
        string email UK
        string phone
        string industry
        string status
        string website
        text address
        text notes
        date next_follow_up_at
        timestamps timestamps
    }

    USERS {
        bigint id PK
        string name
        string email UK
        string role
        bigint customer_id FK
        string phone
        boolean is_active
        timestamp email_verified_at
        string password
        timestamps timestamps
    }

    DOMAIN_HOSTING_REQUESTS {
        bigint id PK
        bigint customer_id FK
        bigint assigned_to FK
        string domain_name
        string service_type
        string plan
        string status
        date requested_start_date
        date renewal_date
        decimal quoted_amount
        text requirements
        text internal_notes
        timestamps timestamps
    }

    SYSTEM_SETTINGS {
        bigint id PK
        string key UK
        text value
        timestamps timestamps
    }

    SESSIONS {
        string id PK
        bigint user_id FK
        string ip_address
        text user_agent
        longtext payload
        int last_activity
    }
```

## Staff/Admin Wireframe

```text
+--------------------------------------------------------------------------+
| Header: notifications | account menu                                     |
+----------------------+---------------------------------------------------+
| Brand logo/name      | Page title + breadcrumbs                          |
| User identity        |                                                   |
|                      | Dashboard metrics                                 |
| Navigation           | [Customers] [Domains] [Suspended] [Support] [Reg] |
| - Customers          |                                                   |
| - Renewals           | Customer listing / forms / support tables         |
| - Add Customer       |                                                   |
| - Support            | Support Request Detail                            |
|   - Support Requests | - Customer / assignee / dates / quote             |
|   - Registrations    | - Requirements                                    |
| - Bulk Email Tool    | - Internal notes                                  |
| - Admin Settings     |                                                   |
+----------------------+---------------------------------------------------+
```

## Admin Settings Wireframe

```text
+--------------------------------------------------------------------------+
| Admin User and Email Settings                               Save Settings |
+--------------------------------------------------------------------------+
| Admin User Listing                                                       |
| Name | Email | Send Emails                                               |
|                                                                          |
| Header Branding                                                          |
| System Name [____________________]                                       |
| Logo Image  [Choose File]                                                |
| Current logo preview                                                     |
|                                                                          |
| Email Settings                                                           |
| From Address | From Name | Mail Host | Mail Port                         |
+--------------------------------------------------------------------------+
```

## Customer Portal Wireframe

```text
+--------------------------------------------------------------------------+
| Customer Portal                                                          |
+--------------------------------------------------------------------------+
| Customer account summary                                                 |
| Own service requests                                                     |
| Submit new domain, hosting, email, ISP, CCTV, document, or dev request   |
+--------------------------------------------------------------------------+
```
