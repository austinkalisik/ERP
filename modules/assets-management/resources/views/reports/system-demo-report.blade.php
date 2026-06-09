<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $appName }} Demo Report</title>
    <style>
        @page {
            margin: 28px 28px 36px 28px;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            color: #162033;
            font-size: 11px;
            line-height: 1.55;
        }

        h1, h2, h3 {
            margin: 0 0 10px 0;
            color: #0f172a;
        }

        h1 {
            font-size: 26px;
        }

        h2 {
            font-size: 18px;
            border-bottom: 1px solid #d8e2f0;
            padding-bottom: 6px;
            margin-top: 18px;
        }

        h3 {
            font-size: 14px;
            margin-top: 14px;
        }

        p {
            margin: 0 0 10px 0;
        }

        ul, ol {
            margin: 0 0 10px 18px;
            padding: 0;
        }

        li {
            margin: 0 0 5px 0;
        }

        .cover {
            background: linear-gradient(135deg, #0f172a 0%, #163b6d 55%, #e2e8f0 55%, #f8fafc 100%);
            color: #fff;
            padding: 28px;
            border-radius: 18px;
            min-height: 420px;
        }

        .cover h1,
        .cover h2,
        .cover p {
            color: #fff;
        }

        .cover .panel {
            width: 56%;
        }

        .meta {
            margin-top: 22px;
            background: rgba(255, 255, 255, 0.12);
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 12px;
            padding: 14px 16px;
        }

        .chip {
            display: inline-block;
            padding: 4px 8px;
            margin: 0 6px 6px 0;
            border-radius: 999px;
            background: #e8f0ff;
            color: #1d4ed8;
            font-weight: bold;
            font-size: 10px;
        }

        .section {
            margin-top: 18px;
        }

        .grid {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0 14px 0;
        }

        .grid th,
        .grid td {
            border: 1px solid #d8e2f0;
            padding: 8px;
            vertical-align: top;
            text-align: left;
        }

        .grid th {
            background: #eef4ff;
            color: #0f172a;
        }

        .callout {
            background: #f8fbff;
            border: 1px solid #d5e4ff;
            border-left: 4px solid #2563eb;
            border-radius: 10px;
            padding: 12px 14px;
            margin: 10px 0 12px 0;
        }

        .warning {
            background: #fff9ed;
            border-color: #f3d188;
            border-left-color: #d97706;
        }

        .page-break {
            page-break-before: always;
        }

        .small {
            font-size: 10px;
            color: #475569;
        }

        .footer-note {
            margin-top: 18px;
            padding-top: 10px;
            border-top: 1px solid #d8e2f0;
            font-size: 10px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="cover">
        <div class="panel">
            <div class="chip">System Demo Guide</div>
            <div class="chip">Non-Technical Explanation</div>
            <div class="chip">Logic Flow Walkthrough</div>

            <h1>{{ $appName }}</h1>
            <h2>{{ $tagline }}</h2>

            <p style="font-size: 14px; margin-top: 16px;">
                A clear presentation report for explaining the full Nextgen Assets Management System to senior leadership,
                office staff, and non-technical audiences.
            </p>

            <div class="meta">
                <p><strong>Prepared For:</strong> Office operations and asset management handover</p>
                <p><strong>Company:</strong> {{ $companyName }}</p>
                <p><strong>Website:</strong> {{ $companyWebsite }}</p>
                <p><strong>Support Email:</strong> {{ $supportEmail }}</p>
                <p><strong>Generated:</strong> {{ $generatedAt }}</p>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>1. Executive Summary</h2>
        <p>
            {{ $appName }} is an office asset management system. Its job is to help an organization know
            what assets it owns, where those assets are, who is using them, when they were issued, and when they were returned.
            In simple terms, it is the system that keeps equipment, supplies, and office resources organized.
        </p>
        <p>
            The system combines inventory tracking, assignment records, notifications, user control, search, activity history,
            and business settings into one application. Instead of relying on paper, memory, or scattered spreadsheets,
            staff can use one place to manage the full life of each asset.
        </p>
        <div class="callout">
            <strong>One-sentence explanation for your senior:</strong><br>
            This system is a digital control center for office assets, helping the organization track stock, issue items,
            monitor returns, record history, and reduce confusion or loss.
        </div>
    </div>

    <div class="section">
        <h2>2. Explain It Like I Am a Kid</h2>
        <p>
            Imagine the office has many important things like laptops, printers, routers, keyboards, and other equipment.
            If nobody keeps track of them, people can forget where they are, who borrowed them, or how many are left.
        </p>
        <p>
            This system works like a very smart notebook for the whole office:
        </p>
        <ul>
            <li>It remembers every item.</li>
            <li>It counts how many are left.</li>
            <li>It remembers who received an item.</li>
            <li>It tells the team when stock is getting low.</li>
            <li>It records every important action so nothing is a mystery.</li>
        </ul>
        <p>
            So if someone asks, “Where is this laptop?” or “Do we still have printer supplies?” the system can answer.
        </p>
    </div>

    <div class="section">
        <h2>3. Main Purpose of the System</h2>
        <table class="grid">
            <thead>
                <tr>
                    <th>Business Need</th>
                    <th>How the System Helps</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Know what assets exist</td>
                    <td>Stores asset records with name, SKU, brand, category, supplier, serial number, quantity, and location.</td>
                </tr>
                <tr>
                    <td>Know who is using assets</td>
                    <td>Assignments record who received the item, from which department, in what quantity, and when.</td>
                </tr>
                <tr>
                    <td>Prevent stock confusion</td>
                    <td>Stock movements increase or decrease quantities in a controlled way.</td>
                </tr>
                <tr>
                    <td>Respond quickly to issues</td>
                    <td>Notifications warn admins about low stock, maintenance, assignments, returns, and updates.</td>
                </tr>
                <tr>
                    <td>Keep accountability</td>
                    <td>Activity logs and asset logs create a traceable history of what happened.</td>
                </tr>
                <tr>
                    <td>Support leadership reporting</td>
                    <td>Dashboard and report views show current stock, assignments, and trends in one place.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="page-break"></div>

    <div class="section">
        <h2>4. Who Uses the System</h2>
        <table class="grid">
            <thead>
                <tr>
                    <th>User Type</th>
                    <th>Typical Responsibility</th>
                    <th>Why It Matters</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Admin</td>
                    <td>Full control of settings, users, branding, records, and oversight.</td>
                    <td>Ensures governance, support, and system-wide monitoring.</td>
                </tr>
                <tr>
                    <td>Manager</td>
                    <td>Supervises asset availability, usage, and reporting.</td>
                    <td>Supports decision-making and accountability.</td>
                </tr>
                <tr>
                    <td>Asset Officer</td>
                    <td>Creates inventory, issues assets, receives returns, and updates stock.</td>
                    <td>Runs daily operations.</td>
                </tr>
                <tr>
                    <td>Regular User / Officer</td>
                    <td>Can receive assigned assets and view profile-related data.</td>
                    <td>Represents the person or office receiving resources.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>5. Main System Modules</h2>
        <table class="grid">
            <thead>
                <tr>
                    <th>Module</th>
                    <th>What It Does</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Login</td>
                    <td>Protects the system and allows only authorized users to enter.</td>
                </tr>
                <tr>
                    <td>Dashboard</td>
                    <td>Shows totals for assets, available stock, assigned items, maintenance items, overdue assignments, and unread notifications.</td>
                </tr>
                <tr>
                    <td>Inventory / Items</td>
                    <td>Creates and manages the master record for each asset or stock item.</td>
                </tr>
                <tr>
                    <td>Assignments</td>
                    <td>Issues items to people or departments and records returns.</td>
                </tr>
                <tr>
                    <td>Suppliers</td>
                    <td>Stores supplier details for reference and inventory relationships.</td>
                </tr>
                <tr>
                    <td>Categories</td>
                    <td>Groups assets into business-friendly types like laptops, networking, printers, or accessories.</td>
                </tr>
                <tr>
                    <td>Departments</td>
                    <td>Tracks which office department receives or manages assigned items.</td>
                </tr>
                <tr>
                    <td>Users</td>
                    <td>Manages people who can log in and interact with the system.</td>
                </tr>
                <tr>
                    <td>Notifications</td>
                    <td>Shows alerts for important events such as assignments, returns, low stock, and maintenance.</td>
                </tr>
                <tr>
                    <td>Activity Logs</td>
                    <td>Acts like a history book of important actions taken in the system.</td>
                </tr>
                <tr>
                    <td>Settings</td>
                    <td>Controls branding, thresholds, alert behavior, pagination, and feature toggles.</td>
                </tr>
                <tr>
                    <td>Profile</td>
                    <td>Lets the current user update their photo and profile details.</td>
                </tr>
                <tr>
                    <td>Global Search</td>
                    <td>Searches across system records from one place.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>6. End-to-End Logic Flow</h2>
        <ol>
            <li>An authorized user logs in to the system.</li>
            <li>The dashboard loads a high-level summary of what is happening.</li>
            <li>The asset officer creates or updates inventory records.</li>
            <li>When stock comes in, quantity is increased through stock-in logic.</li>
            <li>When items are issued, quantity is decreased and an assignment record is created.</li>
            <li>When items are returned, quantity is added back and the assignment is closed.</li>
            <li>If quantity becomes low, the system can alert admins.</li>
            <li>If an item is moved into maintenance, the system can create maintenance alerts.</li>
            <li>Every important action creates a trace in logs and notifications.</li>
            <li>Admins and managers can review current status through reports, search, and history pages.</li>
        </ol>
        <div class="callout">
            <strong>Simple flow:</strong><br>
            Asset comes in -> system stores it -> item gets assigned -> stock reduces -> return happens -> stock increases again ->
            alerts and logs keep everyone informed.
        </div>
    </div>

    <div class="page-break"></div>

    <div class="section">
        <h2>7. Detailed Functional Explanation</h2>

        <h3>7.1 Authentication and Access</h3>
        <p>
            The system uses protected login access. Users must sign in before they can reach protected modules.
            Once signed in, the interface and permissions depend on the user role. This keeps sensitive inventory
            and operational actions limited to the right staff.
        </p>

        <h3>7.2 Dashboard</h3>
        <p>
            The dashboard is the manager's quick control panel. It summarizes the total number of assets, how many are available,
            how many units are currently assigned out, how many are in maintenance, how many are low in stock, and how many assignments
            are overdue. It also shows recent assignments and recently added items to help users understand recent activity quickly.
        </p>

        <h3>7.3 Inventory and Items</h3>
        <p>
            This is the heart of the system. Each item record stores information such as the item name, category, supplier, SKU,
            asset tag, serial number, quantity, reorder level, unit cost, location, and purchase date.
        </p>
        <p>
            The system also contains smart inventory behavior:
        </p>
        <ul>
            <li>If a user tries to create a matching non-serialized stock item that already exists, the system can increase the quantity instead of creating a duplicate record.</li>
            <li>Serialized assets are treated more strictly. If a serial number is used, the quantity must be one because that item is tracked individually.</li>
            <li>Low-stock logic checks the quantity against either the item's own reorder level or the system default threshold.</li>
            <li>Deletion is intentionally restricted when an item has active assignments, stock movement history, or audit history, which protects accountability.</li>
        </ul>

        <h3>7.4 Stock Management</h3>
        <p>
            The stock service controls quantity changes carefully. Stock-in adds quantity. Stock-out removes quantity.
            Adjustments allow corrections with a reason. Returns add stock back after items come back from users.
        </p>
        <p>
            This is important because it prevents casual edits from breaking inventory numbers. The quantity changes are handled through
            dedicated stock movement records instead of random manual typing.
        </p>

        <h3>7.5 Assignments</h3>
        <p>
            Assignments record who received an asset, which department it belongs to, how many units were assigned, and when the assignment happened.
            When an assignment is created, the system reduces available stock. When the asset is returned, the system adds stock back and marks the assignment as returned.
        </p>
        <p>
            The report logic also organizes assignment history into three useful views:
        </p>
        <ul>
            <li>Item-level view showing available quantity and active assigned quantity.</li>
            <li>Receiver-level view showing what each person or receiver has received.</li>
            <li>History view showing a chronological record of assignments and returns.</li>
        </ul>

        <h3>7.6 Categories, Suppliers, and Departments</h3>
        <p>
            These modules make the system structured and easier to understand. Categories describe what kind of item it is.
            Suppliers show where the item came from. Departments show which business unit or office area is involved in assignments.
        </p>
        <p>
            There are protective rules here too. For example, categories with linked items cannot simply be deleted without dealing with those linked records first.
        </p>
    </div>

    <div class="section">
        <h3>7.7 Notifications</h3>
        <p>
            Notifications help the system speak back to the team. When something important happens, such as an assignment,
            return, low stock event, asset update, or maintenance action, the system creates an in-app notification.
        </p>
        <p>
            Email copies can also be sent when the Email Notifications setting is turned on. In your current setup,
            email delivery is using the log mailer, which means the email content is written to the Laravel log unless
            a real mail service like SMTP is configured.
        </p>

        <h3>7.8 Activity Logs</h3>
        <p>
            Activity logs are the memory of the system. They help answer questions like:
        </p>
        <ul>
            <li>Who changed this asset?</li>
            <li>When was it assigned?</li>
            <li>Who returned it?</li>
            <li>Who updated important records?</li>
        </ul>
        <p>
            This supports accountability and makes it easier to investigate issues.
        </p>

        <h3>7.9 Global Search</h3>
        <p>
            Global Search allows staff to search across multiple data areas from a single search bar. This saves time because the user does not need
            to open each page one by one to find a matching item, supplier, category, department, or assignment-related record.
        </p>

        <h3>7.10 Settings and Branding</h3>
        <p>
            The Settings page lets the organization shape the system to match the office. It stores the system name, tagline,
            company information, support email, low-stock threshold, overdue assignment days, items-per-page setting,
            and feature controls.
        </p>
    </div>

    <div class="page-break"></div>

    <div class="section">
        <h2>8. Feature Controls Explained</h2>
        <table class="grid">
            <thead>
                <tr>
                    <th>Setting</th>
                    <th>What It Does</th>
                    <th>What Happens When It Is ON</th>
                    <th>What Happens When It Is OFF</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Email Notifications</td>
                    <td>Controls whether the system sends email copies of notifications.</td>
                    <td>In-app notifications are created and email copies are also sent to the target user's email address.</td>
                    <td>In-app notifications still appear, but no email copy is sent.</td>
                </tr>
                <tr>
                    <td>Maintenance Alerts</td>
                    <td>Controls whether maintenance notifications are created.</td>
                    <td>When an item is moved into maintenance, maintenance-related alerts can be generated.</td>
                    <td>Maintenance notification delivery is suppressed.</td>
                </tr>
                <tr>
                    <td>Switch User Access</td>
                    <td>Controls whether admins can impersonate another user for support.</td>
                    <td>Admins can switch into another account when support access is allowed.</td>
                    <td>The backend blocks impersonation attempts.</td>
                </tr>
            </tbody>
        </table>
        <div class="callout warning">
            <strong>Important practical note:</strong><br>
            In the current setup, email notifications are functionally working, but the email output goes to the Laravel log until a real mail server is configured.
        </div>
    </div>

    <div class="section">
        <h2>9. Logic Rules That Protect Data</h2>
        <ul>
            <li>Items cannot be assigned if they are not in an available state.</li>
            <li>Users cannot assign more quantity than the stock currently has.</li>
            <li>Serialized items cannot pretend to be bulk stock.</li>
            <li>Items with audit or movement history are protected from unsafe deletion.</li>
            <li>Active assignments must be returned before certain destructive actions are allowed.</li>
            <li>Low-stock thresholds are checked automatically.</li>
            <li>Impersonation is controlled by backend settings, not just by hiding a button.</li>
        </ul>
    </div>

    <div class="section">
        <h2>10. Sample Demo Flow for Presentation</h2>
        <p>
            Use the following sequence when introducing the system to office staff:
        </p>
        <ol>
            <li>Start at the login page and explain that only authorized users can access the system.</li>
            <li>Open the dashboard and show total assets, available stock, assigned units, maintenance items, low stock, overdue items, and notifications.</li>
            <li>Open Inventory or Items and show how each asset record stores useful business data.</li>
            <li>Create or open an existing item and explain the difference between bulk stock and serialized assets.</li>
            <li>Open Assignments and issue an item to a receiver and department.</li>
            <li>Explain that the system automatically reduces available quantity when an assignment is made.</li>
            <li>Return the assignment and explain that quantity is added back automatically.</li>
            <li>Open Notifications and show how the system records alerts for important events.</li>
            <li>Open Activity Logs and explain that every key action leaves a history trail.</li>
            <li>Open Settings and explain how the organization can control thresholds, branding, and feature behavior.</li>
            <li>Open Global Search and show how a user can find records quickly from one place.</li>
        </ol>
    </div>

    <div class="section">
        <h2>11. Suggested Talk Track for a Non-Technical Senior</h2>
        <p>
            “This system helps us control our office assets from one central place. We can register every item,
            track how much stock we have, assign assets to people or departments, and record returns. The dashboard gives management
            a quick summary, and the logs give us accountability. Notifications help us react to low stock, maintenance,
            and assignment activity. Overall, it reduces manual work, improves visibility, and helps prevent loss or confusion.”
        </p>
    </div>

    <div class="page-break"></div>

    <div class="section">
        <h2>12. Strengths of the Current System</h2>
        <ul>
            <li>Clear module separation for inventory, assignments, users, settings, and notifications.</li>
            <li>Protective business rules that help preserve inventory accuracy.</li>
            <li>Strong assignment and return workflow.</li>
            <li>Useful dashboard summaries for quick operational awareness.</li>
            <li>Activity logs and notifications improve accountability.</li>
            <li>Branding and settings make the system more organization-ready.</li>
            <li>Global search improves navigation and speed for users.</li>
        </ul>
    </div>

    <div class="section">
        <h2>13. Questions Your Senior May Ask</h2>
        <table class="grid">
            <thead>
                <tr>
                    <th>Possible Question</th>
                    <th>Simple Answer</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Can we track who received assets?</td>
                    <td>Yes. The assignment module stores the receiver, department, quantity, and date issued.</td>
                </tr>
                <tr>
                    <td>Can we know when stock is low?</td>
                    <td>Yes. The system compares quantity against a threshold and can generate alerts.</td>
                </tr>
                <tr>
                    <td>Can we see what changed and who changed it?</td>
                    <td>Yes. Activity logs and asset logs record important actions.</td>
                </tr>
                <tr>
                    <td>Can we search across the system?</td>
                    <td>Yes. Global Search helps users find records from one place.</td>
                </tr>
                <tr>
                    <td>Can admins support other users?</td>
                    <td>Yes, if Switch User Access is enabled. Then admins can impersonate users for support.</td>
                </tr>
                <tr>
                    <td>Does it support alerts?</td>
                    <td>Yes. It supports in-app notifications and optional email copies.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>14. Final Summary</h2>
        <p>
            {{ $appName }} is a practical business system for organizing office assets. It is designed to answer the most important operational questions:
            what do we own, how much do we have, where is it, who is using it, and what needs attention right now?
        </p>
        <p>
            For a presentation to leadership, the strongest message is this: the system gives the organization control, visibility,
            traceability, and a more disciplined workflow for handling assets.
        </p>
        <div class="callout">
            <strong>Very short closing line for your presentation:</strong><br>
            This system turns office asset management from guesswork into a clear, trackable, and accountable process.
        </div>
    </div>

    <div class="footer-note">
        Generated from the current Nextgen Assets Management System codebase on {{ $generatedAt }}.
        This report is intended as an operational explanation guide for office use.
    </div>
</body>
</html>
