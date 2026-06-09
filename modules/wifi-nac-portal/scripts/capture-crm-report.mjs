import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'reports', 'crm-review-report-assets');
const reportHtml = path.join(root, 'reports', 'NextGen-CRM-System-Review-Report.html');
const reportPdf = path.join(root, 'reports', 'NextGen-CRM-System-Review-Report.pdf');
const baseUrl = 'http://127.0.0.1:8001';
const chromePath = process.env.CHROME_PATH
    ?? path.join(process.env.LOCALAPPDATA ?? '', 'Google', 'Chrome', 'Application', 'chrome.exe');
const debugPort = 9222;

class Cdp {
    constructor(url) {
        this.url = url;
        this.nextId = 1;
        this.pending = new Map();
    }

    open() {
        this.ws = new WebSocket(this.url);

        this.ws.addEventListener('message', (event) => {
            const message = JSON.parse(event.data);
            if (message.id && this.pending.has(message.id)) {
                const { resolve, reject } = this.pending.get(message.id);
                this.pending.delete(message.id);
                message.error ? reject(new Error(message.error.message)) : resolve(message.result ?? {});
            }
        });

        return new Promise((resolve, reject) => {
            this.ws.addEventListener('open', resolve, { once: true });
            this.ws.addEventListener('error', reject, { once: true });
        });
    }

    send(method, params = {}, sessionId = undefined) {
        const id = this.nextId++;
        const payload = { id, method, params };
        if (sessionId) {
            payload.sessionId = sessionId;
        }

        this.ws.send(JSON.stringify(payload));

        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            setTimeout(() => {
                if (this.pending.has(id)) {
                    this.pending.delete(id);
                    reject(new Error(`CDP command timed out: ${method}`));
                }
            }, 15000);
        });
    }

    close() {
        this.ws.close();
    }
}

if (!existsSync(chromePath)) {
    throw new Error(`Chrome not found at ${chromePath}`);
}

await mkdir(outputDir, { recursive: true });

const userDataDir = path.join(outputDir, `chrome-profile-${Date.now()}`);
const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
], {
    stdio: 'ignore',
    detached: false,
});

process.on('exit', () => {
    try {
        chrome.kill();
    } catch {
        // Chrome may already be closed.
    }
});

const browserWs = await waitForChrome();
const cdp = new Cdp(browserWs);
await cdp.open();

const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await cdp.send('Target.attachToTarget', {
    targetId,
    flatten: true,
});

await cdp.send('Page.enable', {}, sessionId);
await cdp.send('Runtime.enable', {}, sessionId);
await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false,
}, sessionId);

const screenshots = [];
await navigate(sessionId, `${baseUrl}/login`);
await wait(1000);
await screenshot(sessionId, path.join(outputDir, 'login.png'));
screenshots.push({
    slug: 'login',
    route: '/login',
    title: 'Login and access control',
    fileName: 'login.png',
});

await login(sessionId);

const pages = [
    ['dashboard', '/dashboard', 'Customer dashboard and CRM metrics'],
    ['customers', '/customers', 'Client information register'],
    ['add-customer', '/add-customer', 'New client capture form'],
    ['subscriptions', '/subscriptions', 'Subscription, payment, invoice, and credit tracking'],
    ['renewals', '/renewals', 'Monthly expiry and renewal monitoring'],
    ['support-requests', '/support-requests', 'Support request tracking'],
    ['domain-registrations', '/domain-registrations', 'Domain registration workflow'],
    ['bulk-email-validator', '/bulk-email-validator', 'Bulk email validation and sending tool'],
    ['admin-settings', '/admin-settings', 'Administration and branding settings'],
];

for (const [slug, route, title] of pages) {
    await navigate(sessionId, `${baseUrl}${route}`);
    await wait(1200);
    const fileName = `${slug}.png`;
    const fullPath = path.join(outputDir, fileName);
    await screenshot(sessionId, fullPath);
    screenshots.push({ slug, route, title, fileName });
}

await writeFile(reportHtml, buildReport(screenshots), 'utf8');

const pdf = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    `--print-to-pdf=${reportPdf}`,
    `file:///${reportHtml.replaceAll('\\', '/')}`,
], {
    stdio: 'ignore',
});

await new Promise((resolve, reject) => {
    pdf.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`Chrome PDF export failed with code ${code}`)));
});

await cdp.close();
chrome.kill();

console.log(JSON.stringify({
    reportHtml,
    reportPdf,
    screenshots: screenshots.map((item) => path.join(outputDir, item.fileName)),
}, null, 2));

async function waitForChrome() {
    const deadline = Date.now() + 15000;

    while (Date.now() < deadline) {
        try {
            const response = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
            const payload = await response.json();

            if (payload.webSocketDebuggerUrl) {
                return payload.webSocketDebuggerUrl;
            }
        } catch {
            await wait(250);
        }
    }

    throw new Error('Chrome DevTools endpoint did not start.');
}

async function login(sessionId) {
    await navigate(sessionId, `${baseUrl}/login`);
    await wait(1000);
    await evaluate(sessionId, `
        document.querySelector('#email').value = 'admin@nextgenpng.net';
        document.querySelector('#email').dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelector('#password').value = 'password';
        document.querySelector('#password').dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelector('[data-test="login-button"]').click();
    `);
    await waitForUrl(sessionId, '/dashboard', 10000);
}

async function navigate(sessionId, url) {
    await cdp.send('Page.navigate', { url }, sessionId);
    await waitForLoad(sessionId);
}

async function waitForLoad(sessionId) {
    await wait(800);
    const deadline = Date.now() + 10000;

    while (Date.now() < deadline) {
        const readyState = await evaluate(sessionId, 'document.readyState');

        if (readyState === 'complete') {
            return;
        }

        await wait(250);
    }
}

async function waitForUrl(sessionId, expected, timeoutMs) {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        const href = await evaluate(sessionId, 'location.href');

        if (href.includes(expected)) {
            return;
        }

        await wait(300);
    }

    const href = await evaluate(sessionId, 'location.href');
    throw new Error(`Login did not reach ${expected}. Current URL: ${href}`);
}

async function screenshot(sessionId, file) {
    const { data } = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        fromSurface: true,
        captureBeyondViewport: true,
    }, sessionId);

    await writeFile(file, Buffer.from(data, 'base64'));
}

async function evaluate(sessionId, expression) {
    const result = await cdp.send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
    }, sessionId);

    if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.text);
    }

    return result.result?.value;
}

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildReport(screenshots) {
    const today = new Intl.DateTimeFormat('en-PG', {
        dateStyle: 'long',
        timeZone: 'Pacific/Port_Moresby',
    }).format(new Date());

    const screenshotSections = screenshots.map((shot, index) => `
        <section class="page-break">
            <h2>${index + 1}. ${shot.title}</h2>
            <p class="muted">Screen: <strong>${shot.route}</strong></p>
            <img class="screenshot" src="crm-review-report-assets/${shot.fileName}" alt="${shot.title}">
        </section>
    `).join('');

    return `<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>NextGen CRM System Review Report</title>
    <style>
        @page { size: A4; margin: 15mm; }
        * { box-sizing: border-box; }
        body { color: #172033; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.45; margin: 0; }
        h1 { color: #10213f; font-size: 30px; margin: 0 0 8px; }
        h2 { border-bottom: 2px solid #d8e1ef; color: #10213f; font-size: 19px; margin: 22px 0 10px; padding-bottom: 5px; }
        h3 { color: #243b63; font-size: 14px; margin: 14px 0 6px; }
        p { margin: 5px 0 9px; }
        ul { margin: 6px 0 12px 18px; padding: 0; }
        li { margin: 3px 0; }
        table { border-collapse: collapse; margin: 8px 0 14px; width: 100%; }
        th, td { border: 1px solid #cfd8e6; padding: 7px; text-align: left; vertical-align: top; }
        th { background: #edf3fb; color: #10213f; }
        .cover { align-items: flex-start; background: #f4f7fb; border-left: 8px solid #1f65d6; display: flex; flex-direction: column; min-height: 260px; padding: 32px; }
        .subtitle { color: #526079; font-size: 15px; margin-bottom: 22px; }
        .meta { background: #fff; border: 1px solid #d7dfeb; padding: 12px; width: 100%; }
        .muted { color: #5d687b; }
        .status { color: #0f7a3b; font-weight: 700; }
        .gap { color: #9a5700; font-weight: 700; }
        .screenshot { border: 1px solid #c9d3e3; display: block; max-height: 900px; max-width: 100%; object-fit: contain; width: 100%; }
        .page-break { break-before: page; page-break-before: always; }
        .two-col { display: grid; gap: 12px; grid-template-columns: 1fr 1fr; }
        .box { background: #f8fafc; border: 1px solid #d9e2ef; padding: 10px; }
    </style>
</head>
<body>
    <section class="cover">
        <h1>NextGen CRM System Review Report</h1>
        <p class="subtitle">Feature coverage, implementation details, screenshots, and recommended next review items.</p>
        <div class="meta">
            <p><strong>Prepared for:</strong> Senior management / senior technical review</p>
            <p><strong>Prepared on:</strong> ${today}</p>
            <p><strong>System:</strong> NextGen CRM, Laravel 13, React 19, Inertia, MySQL, Tailwind CSS/shadcn UI</p>
            <p><strong>Local review URL:</strong> ${baseUrl}/login</p>
        </div>
    </section>

    <h2>Executive Summary</h2>
    <p>The CRM is currently built as a Laravel and React business system for managing Nextgen Technology Limited PNG customer records, service requests, subscriptions, domain hosting, renewals, payments, invoice files, credits, users, roles, and customer self-service access.</p>
    <p>The system already covers the main operational goals requested for client listing, subscriptions by service category, renewal monitoring, invoice/payment attachments, and service outage credits that extend expiry dates.</p>

    <h2>Requirement Coverage</h2>
    <table>
        <thead><tr><th>Requirement</th><th>Status</th><th>Implemented Details</th></tr></thead>
        <tbody>
            <tr><td>List all client information</td><td class="status">Available</td><td>Customer register stores company name, contact person, email, phone, industry, status, website, address, notes, follow-up date, and related request counts.</td></tr>
            <tr><td>List subscriptions for each client by service</td><td class="status">Available</td><td>Subscription register links each subscription to a client and categorizes services as Domain Hosting, Internet Service, GPS, Email Hosting, Website Hosting, or Other.</td></tr>
            <tr><td>Monitor expiry dates and renewals</td><td class="status">Available</td><td>Subscriptions store start date, expiry date, renewal cycle, and status. The Renewals page searches renewal records by month and updates selected renewal dates.</td></tr>
            <tr><td>Attach payment and invoice files</td><td class="status">Available</td><td>Payment records support PDF, image, Word, and Excel attachments up to 10 MB, including invoice number, payment reference, payment date, covered period, amount, and notes.</td></tr>
            <tr><td>Track payments and unused credits</td><td class="status">Available</td><td>Credits record outage start/end dates, month count, value, reason, and automatically extend the subscription expiry date. Example: a March-April 2026 ISP outage creates a two-month credit beyond the original expiry.</td></tr>
            <tr><td>Automatic reminder notifications</td><td class="gap">Needs decision</td><td>Renewal monitoring exists through the Renewals page. Automated email/SMS reminders are not confirmed as implemented and should be reviewed as a next enhancement.</td></tr>
        </tbody>
    </table>

    <h2>Features Added</h2>
    <div class="two-col">
        <div class="box">
            <h3>Customer Management</h3>
            <ul>
                <li>Customer dashboard and customer listing.</li>
                <li>Create, update, and admin delete customer records.</li>
                <li>Customer status tracking for lead, active, inactive, and suspended clients.</li>
                <li>Follow-up date and notes for account management.</li>
            </ul>
        </div>
        <div class="box">
            <h3>Subscriptions</h3>
            <ul>
                <li>Client-linked subscription register.</li>
                <li>Service categories for domain hosting, internet service, GPS, email hosting, website hosting, and other services.</li>
                <li>Start date, expiry date, renewal cycle, status, amount, reference, and notes.</li>
                <li>Search and service summary counts.</li>
            </ul>
        </div>
        <div class="box">
            <h3>Payments and Invoices</h3>
            <ul>
                <li>Payment records per subscription.</li>
                <li>Payment period start and end dates.</li>
                <li>Invoice number, payment reference, amount, and notes.</li>
                <li>Invoice/payment file upload and secure download by staff users.</li>
            </ul>
        </div>
        <div class="box">
            <h3>Credits</h3>
            <ul>
                <li>Service outage credit records.</li>
                <li>Credit start/end dates and calculated credit months.</li>
                <li>Optional credit value and required reason.</li>
                <li>Automatic subscription expiry extension when a credit is applied.</li>
            </ul>
        </div>
    </div>

    <h2>Additional Modules</h2>
    <ul>
        <li><strong>Renewals:</strong> monthly renewal search covering subscription expiry and domain/hosting renewal records.</li>
        <li><strong>Service Requests:</strong> support request tracking with customer, assignee, status, priority, service type, quote, renewal, and internal notes.</li>
        <li><strong>Domain Registrations:</strong> domain registration workflow and domain listing/reporting.</li>
        <li><strong>User and Role Management:</strong> admin, staff, and customer roles with customer-linked portal access.</li>
        <li><strong>Customer Portal:</strong> customer users can view their own service requests and submit requests.</li>
        <li><strong>Bulk Email Validator:</strong> validates email lists and supports sending bulk email when SMTP credentials are configured.</li>
        <li><strong>Admin Settings:</strong> branding, logo, SMTP, and system settings support.</li>
        <li><strong>Security:</strong> Laravel Fortify authentication, email verification middleware, role checks, two-factor support, and restricted staff/admin actions.</li>
    </ul>

    <h2>Data Model Summary</h2>
    <table>
        <thead><tr><th>Area</th><th>Main Records</th><th>Important Fields</th></tr></thead>
        <tbody>
            <tr><td>Clients</td><td>customers</td><td>Company, contact, email, phone, industry, status, website, address, notes, follow-up date.</td></tr>
            <tr><td>Subscriptions</td><td>customer_subscriptions</td><td>Customer, service type, service name, reference, status, start date, expiry date, renewal cycle, amount, notes.</td></tr>
            <tr><td>Payments</td><td>subscription_payments</td><td>Subscription, paid date, payment period, amount, reference, invoice number, uploaded file metadata, notes.</td></tr>
            <tr><td>Credits</td><td>subscription_credits</td><td>Subscription, credit type, start date, end date, months, amount, applied expiry date, reason.</td></tr>
            <tr><td>Requests</td><td>domain_hosting_requests</td><td>Customer, service type, domain/request details, status, priority, quote, assignee, renewal date, notes.</td></tr>
            <tr><td>Access</td><td>users</td><td>Name, email, role, active status, linked customer, password, two-factor fields.</td></tr>
        </tbody>
    </table>

    <h2>Recommended Next Review Items</h2>
    <ul>
        <li>Confirm whether management wants automatic renewal reminders by email, SMS, or dashboard-only alerts.</li>
        <li>Confirm exact report exports required: client list, subscriptions by service, expired/soon-to-expire renewals, payment ledger, and credit ledger.</li>
        <li>Confirm whether customer portal users should see invoices, payments, and credits, or only service requests.</li>
        <li>Confirm approval workflow for service credits so outage credits cannot be applied without manager approval.</li>
        <li>Confirm backup, production hosting, SSL, and user account policy before production rollout.</li>
    </ul>

    ${screenshotSections}
</body>
</html>`;
}
