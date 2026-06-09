import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardList,
  Database,
  Download,
  Edit,
  FileText,
  Gauge,
  HardDrive,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  LogOut,
  MailCheck,
  Monitor,
  PackageCheck,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
  Users
} from "lucide-react";

const today = "2026-06-09";
const pngTimeZone = "Pacific/Port_Moresby";

function formatPngDateTime(date) {
  return new Intl.DateTimeFormat("en-PG", {
    timeZone: pngTimeZone,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }).format(date);
}

function usePngTime() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return formatPngDateTime(now);
}

const accounts = [
  { email: "admin@nextgenpng.net", password: "password", name: "System Admin", role: "Super Admin", modules: ["dashboard", "hrms", "payroll", "aims", "moms", "assets", "crm", "tickets", "monitoring", "reports", "settings", "users"], write: true },
  { email: "hr@nextgenpng.net", password: "password", name: "HR Officer", role: "HRMS Manager", modules: ["dashboard", "hrms", "reports"], write: true },
  { email: "payroll@nextgenpng.net", password: "password", name: "Payroll Officer", role: "Payroll Manager", modules: ["dashboard", "hrms", "payroll", "reports"], write: true },
  { email: "inventory@nextgenpng.net", password: "password", name: "Inventory Officer", role: "AIMS Manager", modules: ["dashboard", "aims", "assets", "reports"], write: true },
  { email: "assets@nextgenpng.net", password: "password", name: "Asset Manager", role: "Asset Manager", modules: ["dashboard", "assets", "tickets", "reports"], write: true },
  { email: "crm@nextgenpng.net", password: "password", name: "CRM Officer", role: "CRM Manager", modules: ["dashboard", "crm", "tickets", "reports"], write: true },
  { email: "support@nextgenpng.net", password: "password", name: "Support Desk", role: "Support Lead", modules: ["dashboard", "crm", "tickets", "monitoring", "reports"], write: true },
  { email: "noc@nextgenpng.net", password: "password", name: "NOC Operator", role: "Monitoring Operator", modules: ["dashboard", "tickets", "monitoring", "reports"], write: true },
  { email: "viewer@nextgenpng.net", password: "password", name: "Read Only Viewer", role: "Viewer", modules: ["dashboard", "hrms", "payroll", "aims", "moms", "assets", "crm", "tickets", "monitoring", "reports"], write: false }
];

const moduleConfig = [
  { id: "dashboard", label: "Dashboard", short: "Dashboard", icon: LayoutDashboard },
  { id: "hrms", label: "HRMS", short: "HRMS", icon: Users },
  { id: "payroll", label: "Payroll", short: "Payroll", icon: FileText },
  { id: "aims", label: "AIMS", short: "AIMS", icon: PackageCheck },
  { id: "moms", label: "MOMS", short: "MOMS", icon: Settings },
  { id: "assets", label: "Assets Management", short: "Assets", icon: HardDrive },
  { id: "crm", label: "CRM", short: "CRM", icon: BriefcaseBusiness },
  { id: "tickets", label: "Ticketing", short: "Tickets", icon: LifeBuoy },
  { id: "monitoring", label: "Monitoring", short: "Monitoring", icon: Monitor },
  { id: "reports", label: "Reports", short: "Reports", icon: FileText },
  { id: "settings", label: "Settings", short: "Settings", icon: Settings },
  { id: "users", label: "System Users", short: "Users", icon: ShieldCheck }
];

const schemas = {
  hrmsEmployees: {
    title: "Employees",
    description: "Employee master records from HRMS.",
    icon: Users,
    idPrefix: "EMP",
    fields: [["name", "Employee"], ["biometricId", "Biometric ID"], ["department", "Department"], ["position", "Position"], ["classification", "Classification"], ["status", "Status"], ["joined", "Date Hired"]],
    rows: [
      { id: "EMP-001", name: "System Admin", biometricId: "1001", department: "Administration", position: "System Administrator", classification: "Full time", status: "Active", joined: "2025-01-10" },
      { id: "EMP-002", name: "Jerome Natividad", biometricId: "1002", department: "NextGen Technology", position: "Technician", classification: "Full time", status: "Active", joined: "2025-07-16" },
      { id: "EMP-003", name: "Mathew Yuara", biometricId: "1003", department: "Marketing", position: "Marketing Officer", classification: "Full time", status: "Active", joined: "2026-02-01" }
    ]
  },
  hrmsAttendance: {
    title: "Attendance",
    description: "Daily employee attendance, shifts, and time records.",
    icon: Activity,
    idPrefix: "ATT",
    fields: [["employee", "Employee"], ["date", "Date"], ["shift", "Shift"], ["timeIn", "Time In"], ["timeOut", "Time Out"], ["hours", "Hours"], ["status", "Status"]],
    rows: [
      { id: "ATT-01", employee: "System Admin", date: today, shift: "Day", timeIn: "08:00", timeOut: "17:00", hours: "8", status: "Present" },
      { id: "ATT-02", employee: "Jerome Natividad", date: today, shift: "Field", timeIn: "08:20", timeOut: "17:15", hours: "8", status: "Present" }
    ]
  },
  hrmsApplications: {
    title: "Applications",
    description: "Leave, overtime, and HR requests awaiting action.",
    icon: ClipboardList,
    idPrefix: "APP",
    fields: [["employee", "Employee"], ["type", "Type"], ["from", "From"], ["to", "To"], ["reason", "Reason"], ["status", "Status"], ["approver", "Approver"]],
    rows: [
      { id: "APP-01", employee: "Mathew Yuara", type: "Leave", from: "2026-06-20", to: "2026-06-21", reason: "Personal", status: "Pending", approver: "HR Officer" },
      { id: "APP-02", employee: "Jerome Natividad", type: "Overtime", from: "2026-06-08", to: "2026-06-08", reason: "CCTV install", status: "Approved", approver: "System Admin" }
    ]
  },
  hrmsDepartments: {
    title: "HR Departments",
    description: "Departments, employment classifications, shifts, and HR setup.",
    icon: Building2,
    idPrefix: "HRD",
    fields: [["name", "Department"], ["manager", "Manager"], ["shift", "Default Shift"], ["classification", "Classification"], ["status", "Status"]],
    rows: [
      { id: "HRD-01", name: "Administration", manager: "System Admin", shift: "Day", classification: "Office", status: "Active" },
      { id: "HRD-02", name: "NextGen Technology", manager: "System Admin", shift: "Field", classification: "Operations", status: "Active" }
    ]
  },
  payrollRuns: {
    title: "Payroll Runs",
    description: "Payroll periods, pay dates, gross pay, deductions, and run status.",
    icon: FileText,
    idPrefix: "PAY",
    fields: [["period", "Period"], ["payDate", "Pay Date"], ["employees", "Employees"], ["gross", "Gross"], ["deductions", "Deductions"], ["net", "Net Pay"], ["status", "Status"]],
    rows: [
      { id: "PAY-01", period: "June 2026 - Fortnight 1", payDate: "2026-06-14", employees: "3", gross: "K 9,850", deductions: "K 1,140", net: "K 8,710", status: "Draft" },
      { id: "PAY-02", period: "May 2026 - Fortnight 2", payDate: "2026-05-31", employees: "3", gross: "K 9,850", deductions: "K 1,140", net: "K 8,710", status: "Posted" }
    ]
  },
  payrollEmployees: {
    title: "Payroll Employees",
    description: "Employee payroll setup, salary table, tax, NASFUND, NCSL, and bank details.",
    icon: Users,
    idPrefix: "PRE",
    fields: [["employee", "Employee"], ["salary", "Salary"], ["taxCode", "Tax Code"], ["nasfund", "NASFUND"], ["ncsl", "NCSL"], ["bank", "Bank"], ["status", "Status"]],
    rows: [
      { id: "PRE-01", employee: "System Admin", salary: "K 4,500", taxCode: "PNG-A", nasfund: "6%", ncsl: "2%", bank: "BSP", status: "Active" },
      { id: "PRE-02", employee: "Jerome Natividad", salary: "K 3,200", taxCode: "PNG-A", nasfund: "6%", ncsl: "0%", bank: "Kina", status: "Active" }
    ]
  },
  payrollCashAdvances: {
    title: "Cash Advances",
    description: "Employee cash advances and deduction recovery.",
    icon: FileText,
    idPrefix: "ADV",
    fields: [["employee", "Employee"], ["amount", "Amount"], ["balance", "Balance"], ["deduction", "Deduction"], ["reason", "Reason"], ["status", "Status"]],
    rows: [
      { id: "ADV-01", employee: "Jerome Natividad", amount: "K 500", balance: "K 250", deduction: "K 125", reason: "Field travel", status: "Active" }
    ]
  },
  aimsInventory: {
    title: "AIMS Inventory",
    description: "ERP inventory items, warehouses, units, stock movements, and reorder controls.",
    icon: PackageCheck,
    idPrefix: "AIM",
    fields: [["item", "Item"], ["sku", "SKU"], ["category", "Category"], ["warehouse", "Warehouse"], ["quantity", "Qty"], ["unit", "Unit"], ["status", "Status"]],
    rows: [
      { id: "AIM-01", item: "Network Cable Cat6", sku: "CAT6-305M", category: "Consumables", warehouse: "Main Store", quantity: "3", unit: "box", status: "Low stock" },
      { id: "AIM-02", item: "CCTV Bracket", sku: "CCTV-BRK", category: "CCTV", warehouse: "Main Store", quantity: "12", unit: "pcs", status: "Available" },
      { id: "AIM-03", item: "Router Power Supply", sku: "RTR-PSU", category: "Network", warehouse: "NOC Store", quantity: "8", unit: "pcs", status: "Available" }
    ]
  },
  aimsInvoices: {
    title: "Invoices",
    description: "Invoices, approvals, payments, and allocations.",
    icon: FileText,
    idPrefix: "INV",
    fields: [["customer", "Customer"], ["invoiceNo", "Invoice No"], ["amount", "Amount"], ["currency", "Currency"], ["dueDate", "Due Date"], ["status", "Status"], ["approval", "Approval"]],
    rows: [
      { id: "INV-01", customer: "Northstar", invoiceNo: "NG-2026-001", amount: "K 4,200", currency: "PGK", dueDate: "2026-06-21", status: "Unpaid", approval: "Approved" },
      { id: "INV-02", customer: "Bangtik Investments", invoiceNo: "NG-2026-002", amount: "K 12,000", currency: "PGK", dueDate: "2026-06-30", status: "Draft", approval: "Pending" }
    ]
  },
  aimsOrders: {
    title: "Request & Purchase Orders",
    description: "Request orders, purchase requests, sales orders, and approvals.",
    icon: ClipboardList,
    idPrefix: "ORD",
    fields: [["type", "Type"], ["requester", "Requester"], ["supplier", "Supplier"], ["items", "Items"], ["amount", "Amount"], ["status", "Status"], ["created", "Created"]],
    rows: [
      { id: "ORD-01", type: "Purchase Request", requester: "Inventory Officer", supplier: "TE PNG", items: "Router Power Supply", amount: "K 1,200", status: "Pending", created: today },
      { id: "ORD-02", type: "Sales Order", requester: "CRM Officer", supplier: "Internal", items: "Hosting Bundle", amount: "K 4,200", status: "Approved", created: today }
    ]
  },
  aimsLedger: {
    title: "General Ledger",
    description: "GL accounts, journal entries, payments, and subledger records.",
    icon: Database,
    idPrefix: "GL",
    fields: [["account", "Account"], ["code", "Code"], ["type", "Type"], ["debit", "Debit"], ["credit", "Credit"], ["status", "Status"]],
    rows: [
      { id: "GL-01", account: "Inventory Assets", code: "1200", type: "Asset", debit: "K 18,900", credit: "K 0", status: "Active" },
      { id: "GL-02", account: "Service Revenue", code: "4000", type: "Income", debit: "K 0", credit: "K 22,700", status: "Active" }
    ]
  },
  momsMachines: {
    title: "Machines",
    description: "Machine, fleet, operator, and availability records.",
    icon: Settings,
    idPrefix: "MCH",
    fields: [["machine", "Machine"], ["fleet", "Fleet"], ["operator", "Operator"], ["site", "Job Site"], ["hours", "Hours"], ["availability", "Availability"], ["status", "Status"]],
    rows: [
      { id: "MCH-01", machine: "Service Vehicle 01", fleet: "Field Fleet", operator: "Jerome Natividad", site: "Port Moresby", hours: "420", availability: "96%", status: "Active" },
      { id: "MCH-02", machine: "Generator 01", fleet: "Power", operator: "NOC Operator", site: "Remote CCTV", hours: "118", availability: "89%", status: "Maintenance" }
    ]
  },
  momsOperations: {
    title: "Daily Operations",
    description: "Shift operations, assignments, time entries, and production reports.",
    icon: Activity,
    idPrefix: "OPS",
    fields: [["date", "Date"], ["site", "Site"], ["operator", "Operator"], ["machine", "Machine"], ["start", "Start"], ["end", "End"], ["status", "Status"]],
    rows: [
      { id: "OPS-01", date: today, site: "Port Moresby", operator: "Jerome Natividad", machine: "Service Vehicle 01", start: "08:00", end: "17:00", status: "Open" },
      { id: "OPS-02", date: "2026-06-08", site: "Remote CCTV", operator: "NOC Operator", machine: "Generator 01", start: "09:30", end: "15:00", status: "Closed" }
    ]
  },
  momsMaintenance: {
    title: "Maintenance",
    description: "Maintenance schedules, logs, breakdowns, repair costs, and checklists.",
    icon: AlertTriangle,
    idPrefix: "MMT",
    fields: [["asset", "Asset"], ["task", "Task"], ["type", "Type"], ["cost", "Cost"], ["scheduled", "Scheduled"], ["status", "Status"], ["notes", "Notes"]],
    rows: [
      { id: "MMT-01", asset: "Generator 01", task: "Service check", type: "Preventive", cost: "K 650", scheduled: "2026-06-15", status: "Scheduled", notes: "Oil and filters" },
      { id: "MMT-02", asset: "Service Vehicle 01", task: "Tyre replacement", type: "Repair", cost: "K 1,100", scheduled: "2026-06-12", status: "Open", notes: "Front tyres" }
    ]
  },
  assetInventory: {
    title: "Inventory",
    description: "Tracked asset items, stock levels, depreciation, and asset identity.",
    icon: PackageCheck,
    idPrefix: "AST",
    fields: [
      ["name", "Asset Name"], ["sku", "Asset Tag / SKU"], ["category", "Category"], ["supplier", "Supplier"],
      ["quantity", "Qty"], ["unit", "Unit"], ["status", "Status"], ["condition", "Condition"], ["value", "Value"], ["nextService", "Next Service"]
    ],
    rows: [
      { id: "AST-1001", name: "Holowits AI Bullet Camera", sku: "CAM-NGN-018", category: "CCTV", supplier: "Holowits PNG", quantity: "1", unit: "unit", status: "Assigned", condition: "Good", value: "K 2,350", nextService: "2026-07-15" },
      { id: "AST-1002", name: "Lenovo LOQ Laptop", sku: "Laptop-0001", category: "Laptop", supplier: "Datec", quantity: "1", unit: "unit", status: "Assigned", condition: "Good", value: "K 5,800", nextService: "2026-08-01" },
      { id: "AST-1003", name: "Employee Uniform - XL", sku: "UNI-MKT-XL-04", category: "Uniform", supplier: "Local Supplier", quantity: "22", unit: "pcs", status: "Low stock", condition: "New", value: "K 70", nextService: "N/A" },
      { id: "AST-1004", name: "MikroTik Router", sku: "RTR-NOC-009", category: "Network", supplier: "TE PNG", quantity: "4", unit: "unit", status: "Available", condition: "Ready", value: "K 980", nextService: "2026-06-30" }
    ]
  },
  assetAssignments: {
    title: "Assignments",
    description: "Issue assets to receivers, return assets, and keep custody records.",
    icon: RotateCcw,
    idPrefix: "ASN",
    fields: [["asset", "Asset"], ["receiver", "Receiver"], ["department", "Department"], ["quantity", "Qty"], ["dateGiven", "Date Given"], ["status", "Status"], ["notes", "Notes"]],
    rows: [
      { id: "ASN-3001", asset: "Holowits AI Bullet Camera", receiver: "Jerome Natividad", department: "NextGen Technology", quantity: "1 unit", dateGiven: "2026-06-08 08:59", status: "Issued out", notes: "Site security install" },
      { id: "ASN-3002", asset: "Employee Uniform - Small", receiver: "Mathew Yuara", department: "Marketing", quantity: "2 pcs", dateGiven: "2026-06-03 15:56", status: "Issued out", notes: "No tag" },
      { id: "ASN-3003", asset: "Employee Uniform - Medium", receiver: "Mathew Yuara", department: "Marketing", quantity: "2 pcs", dateGiven: "2026-06-03 15:42", status: "Returned", notes: "Returned to store" },
      { id: "ASN-3004", asset: "Lenovo LOQ", receiver: "Jerome Natividad", department: "NextGen Technology", quantity: "1 unit", dateGiven: "2026-06-03 14:26", status: "Issued out", notes: "Laptop-0001" }
    ]
  },
  assetSuppliers: {
    title: "Suppliers",
    description: "Vendor records and contact details for asset procurement.",
    icon: Building2,
    idPrefix: "SUP",
    fields: [["name", "Supplier"], ["contact", "Contact"], ["phone", "Phone"], ["email", "Email"], ["address", "Address"], ["status", "Status"]],
    rows: [
      { id: "SUP-01", name: "Datec PNG", contact: "Sales Desk", phone: "+675 300 3000", email: "sales@datec.com.pg", address: "Port Moresby", status: "Active" },
      { id: "SUP-02", name: "TE PNG", contact: "Account Manager", phone: "+675 325 0000", email: "accounts@tepng.com", address: "Gordons", status: "Active" }
    ]
  },
  assetCategories: {
    title: "Categories",
    description: "Asset grouping for reporting, stock operations, and controls.",
    icon: Database,
    idPrefix: "CAT",
    fields: [["name", "Category"], ["description", "Description"], ["depreciable", "Depreciable"], ["status", "Status"]],
    rows: [
      { id: "CAT-01", name: "Laptop", description: "Computing devices", depreciable: "Yes", status: "Active" },
      { id: "CAT-02", name: "CCTV", description: "Security camera equipment", depreciable: "Yes", status: "Active" },
      { id: "CAT-03", name: "Uniform", description: "Staff issued uniforms", depreciable: "No", status: "Active" }
    ]
  },
  assetDepartments: {
    title: "Departments",
    description: "Departments available for assignments and reporting.",
    icon: Building2,
    idPrefix: "DEP",
    fields: [["name", "Department"], ["manager", "Manager"], ["description", "Description"], ["status", "Status"]],
    rows: [
      { id: "DEP-01", name: "NextGen Technology", manager: "System Administrator", description: "ICT and operations", status: "Active" },
      { id: "DEP-02", name: "Marketing", manager: "Mathew Yuara", description: "Sales and marketing", status: "Active" }
    ]
  },
  assetReceivers: {
    title: "Receivers",
    description: "People who can receive issued assets.",
    icon: Users,
    idPrefix: "RCV",
    fields: [["name", "Receiver"], ["department", "Department"], ["phone", "Phone"], ["email", "Email"], ["status", "Status"]],
    rows: [
      { id: "RCV-01", name: "Jerome Natividad", department: "NextGen Technology", phone: "+675 7000 1001", email: "jerome@nextgenpng.net", status: "Active" },
      { id: "RCV-02", name: "Mathew Yuara", department: "Marketing", phone: "+675 7000 1002", email: "mathew@nextgenpng.net", status: "Active" },
      { id: "RCV-03", name: "Taita Kei", department: "Marketing", phone: "+675 7000 1003", email: "taita@nextgenpng.net", status: "Active" }
    ]
  },
  assetNotifications: {
    title: "Notifications",
    description: "Low stock, maintenance, overdue, and assignment alerts.",
    icon: Bell,
    idPrefix: "NTF",
    fields: [["title", "Notification"], ["type", "Type"], ["message", "Message"], ["status", "Status"], ["created", "Created"]],
    rows: [
      { id: "NTF-01", title: "Uniform low stock", type: "Low stock", message: "Employee Uniform - XL is below reorder point", status: "Unread", created: today },
      { id: "NTF-02", title: "Router service due", type: "Maintenance", message: "MikroTik Router service date is near", status: "Unread", created: today }
    ]
  },
  assetActivity: {
    title: "Activity Logs",
    description: "Audit trail for asset changes, returns, stock movements, and users.",
    icon: Activity,
    idPrefix: "LOG",
    fields: [["actor", "Actor"], ["action", "Action"], ["record", "Record"], ["module", "Module"], ["created", "Created"]],
    rows: [
      { id: "LOG-01", actor: "System Administrator", action: "Issued asset", record: "Holowits AI Bullet Camera", module: "Assignments", created: "2026-06-08 08:59" },
      { id: "LOG-02", actor: "Asset Manager", action: "Updated stock", record: "Employee Uniform - XL", module: "Inventory", created: "2026-06-03 15:56" }
    ]
  },
  crmCustomers: {
    title: "Customers",
    description: "Customer profiles, contact details, owners, and service status.",
    icon: BriefcaseBusiness,
    idPrefix: "CRM",
    fields: [["company", "Customer"], ["contact", "Contact"], ["email", "Email"], ["phone", "Phone"], ["service", "Service"], ["owner", "Owner"], ["status", "Status"]],
    rows: [
      { id: "CRM-2201", company: "NextGen PNG", contact: "Operations Desk", email: "ops@nextgenpng.net", phone: "+675 7000 2001", service: "Managed Website", owner: "CRM Officer", status: "Active" },
      { id: "CRM-2202", company: "Northstar", contact: "ICT Manager", email: "ict@northstar.com.pg", phone: "+675 7000 2002", service: "Hosting + Email", owner: "Support Desk", status: "Renewal due" },
      { id: "CRM-2203", company: "Bangtik Investments", contact: "General Manager", email: "gm@bangtik.com", phone: "+675 7000 2003", service: "Domain + CCTV", owner: "CRM Officer", status: "Proposal" }
    ]
  },
  crmSubscriptions: {
    title: "Subscriptions",
    description: "Recurring service subscriptions, billing cycle, credits, and payments.",
    icon: FileText,
    idPrefix: "SUB",
    fields: [["customer", "Customer"], ["service", "Service"], ["cycle", "Cycle"], ["amount", "Amount"], ["paid", "Paid"], ["credit", "Credit"], ["nextBilling", "Next Billing"], ["status", "Status"]],
    rows: [
      { id: "SUB-01", customer: "Northstar", service: "Managed hosting", cycle: "Annual", amount: "K 4,200", paid: "K 4,200", credit: "K 0", nextBilling: "2026-06-21", status: "Renewal due" },
      { id: "SUB-02", customer: "Fubilan Mining", service: "Network Monitoring", cycle: "Monthly", amount: "K 1,850", paid: "K 1,850", credit: "K 200", nextBilling: "2026-07-01", status: "Active" }
    ]
  },
  crmHosting: {
    title: "Domain & Hosting Requests",
    description: "Domain registration, .pg, hosting, email, and service onboarding requests.",
    icon: MailCheck,
    idPrefix: "DHR",
    fields: [["customer", "Customer"], ["domain", "Domain"], ["requestType", "Request Type"], ["assignedTo", "Assigned To"], ["status", "Status"], ["dueDate", "Due Date"]],
    rows: [
      { id: "DHR-01", customer: "Bangtik Investments", domain: "bangtikinvestmentsltd.com", requestType: "Hosting setup", assignedTo: "Support Desk", status: "In progress", dueDate: "2026-06-12" },
      { id: "DHR-02", customer: "Northstar", domain: "northstar.com.pg", requestType: ".pg renewal", assignedTo: "CRM Officer", status: "Waiting payment", dueDate: "2026-06-21" }
    ]
  },
  crmSupport: {
    title: "Support Requests",
    description: "Customer service requests from CRM before or after sale.",
    icon: LifeBuoy,
    idPrefix: "CSR",
    fields: [["customer", "Customer"], ["subject", "Subject"], ["channel", "Channel"], ["priority", "Priority"], ["status", "Status"], ["owner", "Owner"]],
    rows: [
      { id: "CSR-01", customer: "Northstar", subject: "Email mailbox limit review", channel: "Email", priority: "Medium", status: "Open", owner: "Support Desk" },
      { id: "CSR-02", customer: "Bangtik Investments", subject: "CCTV quote follow up", channel: "Phone", priority: "Low", status: "In progress", owner: "CRM Officer" }
    ]
  },
  crmRenewals: {
    title: "Renewals",
    description: "Upcoming renewal dates and follow-up ownership.",
    icon: AlertTriangle,
    idPrefix: "REN",
    fields: [["customer", "Customer"], ["service", "Service"], ["renewalDate", "Renewal Date"], ["value", "Value"], ["owner", "Owner"], ["status", "Status"]],
    rows: [
      { id: "REN-01", customer: "Northstar", service: "Hosting + Email", renewalDate: "2026-06-21", value: "K 4,200", owner: "CRM Officer", status: "Due soon" },
      { id: "REN-02", customer: "NextGen PNG", service: "Managed Website", renewalDate: "2026-09-20", value: "K 8,500", owner: "System Administrator", status: "Scheduled" }
    ]
  },
  ticketTickets: {
    title: "Tickets",
    description: "Support queue with SLA, comments, attachments, priority, and status.",
    icon: ClipboardList,
    idPrefix: "NTS",
    fields: [["subject", "Subject"], ["client", "Client"], ["service", "Service"], ["priority", "Priority"], ["status", "Status"], ["assignee", "Assignee"], ["sla", "SLA"], ["lastComment", "Last Comment"]],
    rows: [
      { id: "NTS-5011", subject: "assets.nextgenpng.net manifest error after upload", client: "Internal", service: "Assets ERP", priority: "Critical", status: "Open", assignee: "Support Desk", sla: "1h", lastComment: "Investigating build manifest" },
      { id: "NTS-5012", subject: "Renew SSL certificate notice", client: "Northstar", service: "Hosting", priority: "High", status: "In progress", assignee: "NOC Operator", sla: "4h", lastComment: "Certificate check scheduled" },
      { id: "NTS-5013", subject: "Assign replacement laptop to field staff", client: "Internal", service: "Assets", priority: "Medium", status: "Waiting", assignee: "Asset Manager", sla: "8h", lastComment: "Waiting receiver approval" }
    ]
  },
  ticketClients: {
    title: "Clients",
    description: "Clients supported by the service desk.",
    icon: Users,
    idPrefix: "CLI",
    fields: [["name", "Client"], ["contact", "Contact"], ["email", "Email"], ["phone", "Phone"], ["status", "Status"]],
    rows: [
      { id: "CLI-01", name: "Internal", contact: "System Administrator", email: "admin@nextgenpng.net", phone: "+675 7000 0000", status: "Active" },
      { id: "CLI-02", name: "Northstar", contact: "ICT Manager", email: "ict@northstar.com.pg", phone: "+675 7000 2002", status: "Active" }
    ]
  },
  ticketServices: {
    title: "Services",
    description: "Service catalog used for ticket routing and reports.",
    icon: Settings,
    idPrefix: "SRV",
    fields: [["name", "Service"], ["category", "Category"], ["owner", "Owner"], ["defaultSla", "Default SLA"], ["status", "Status"]],
    rows: [
      { id: "SRV-01", name: "Assets ERP", category: "Internal Apps", owner: "Support Desk", defaultSla: "4h", status: "Active" },
      { id: "SRV-02", name: "Hosting", category: "Customer Service", owner: "NOC Operator", defaultSla: "4h", status: "Active" },
      { id: "SRV-03", name: "CCTV", category: "Field Service", owner: "Support Desk", defaultSla: "8h", status: "Active" }
    ]
  },
  ticketSla: {
    title: "SLA Contracts",
    description: "SLA rules and target response times.",
    icon: Gauge,
    idPrefix: "SLA",
    fields: [["name", "SLA"], ["priority", "Priority"], ["response", "Response"], ["resolution", "Resolution"], ["status", "Status"]],
    rows: [
      { id: "SLA-01", name: "Critical internal system", priority: "Critical", response: "15m", resolution: "1h", status: "Active" },
      { id: "SLA-02", name: "Customer hosting", priority: "High", response: "1h", resolution: "4h", status: "Active" }
    ]
  },
  ticketSystemStatus: {
    title: "System Status",
    description: "Status board for services managed by ticketing.",
    icon: Activity,
    idPrefix: "STS",
    fields: [["system", "System"], ["status", "Status"], ["incident", "Incident"], ["owner", "Owner"], ["updated", "Updated"]],
    rows: [
      { id: "STS-01", system: "Assets ERP", status: "Warning", incident: "Live manifest error report", owner: "Support Desk", updated: today },
      { id: "STS-02", system: "CRM", status: "Operational", incident: "None", owner: "CRM Officer", updated: today }
    ]
  },
  ticketKnowledge: {
    title: "Knowledge Base",
    description: "Support articles and known fixes.",
    icon: FileText,
    idPrefix: "KB",
    fields: [["title", "Article"], ["category", "Category"], ["owner", "Owner"], ["status", "Status"], ["updated", "Updated"]],
    rows: [
      { id: "KB-01", title: "Fix Vite manifest missing CSS on cPanel", category: "Deployment", owner: "Support Desk", status: "Published", updated: today },
      { id: "KB-02", title: "How to assign and return assets", category: "Assets", owner: "Asset Manager", status: "Draft", updated: today }
    ]
  },
  monitoringDevices: {
    title: "Devices",
    description: "Sites, services, devices, and gateways monitored by NextGen.",
    icon: Monitor,
    idPrefix: "DEV",
    fields: [["name", "Device / Service"], ["location", "Location"], ["type", "Type"], ["target", "Target"], ["status", "Status"], ["uptime", "Uptime"], ["owner", "Owner"]],
    rows: [
      { id: "DEV-01", name: "nextgenpng.net HTTPS", location: "Cloud", type: "Website", target: "https://nextgenpng.net/", status: "Online", uptime: "99.98%", owner: "NOC Operator" },
      { id: "DEV-02", name: "assets.nextgenpng.net", location: "cPanel", type: "ERP Service", target: "https://assets.nextgenpng.net/", status: "Warning", uptime: "99.12%", owner: "Support Desk" },
      { id: "DEV-03", name: "Client CCTV gateway", location: "Remote site", type: "CCTV", target: "Remote camera gateway", status: "Offline", uptime: "96.40%", owner: "NOC Operator" }
    ]
  },
  monitoringReadings: {
    title: "Readings",
    description: "Latest service readings, response times, and metrics.",
    icon: Gauge,
    idPrefix: "READ",
    fields: [["device", "Device"], ["metric", "Metric"], ["value", "Value"], ["status", "Status"], ["captured", "Captured"]],
    rows: [
      { id: "READ-01", device: "nextgenpng.net HTTPS", metric: "Response time", value: "184 ms", status: "Normal", captured: "2026-06-09 17:01" },
      { id: "READ-02", device: "assets.nextgenpng.net", metric: "Response time", value: "516 ms", status: "Warning", captured: "2026-06-09 17:01" },
      { id: "READ-03", device: "Client CCTV gateway", metric: "Ping", value: "Timeout", status: "Critical", captured: "2026-06-09 17:01" }
    ]
  },
  monitoringEvents: {
    title: "Events & Alarms",
    description: "Alerts, alarms, acknowledgements, and incident events.",
    icon: AlertTriangle,
    idPrefix: "EVT",
    fields: [["device", "Device"], ["severity", "Severity"], ["event", "Event"], ["status", "Status"], ["acknowledgedBy", "Acknowledged By"], ["created", "Created"]],
    rows: [
      { id: "EVT-01", device: "Client CCTV gateway", severity: "Critical", event: "Gateway unreachable", status: "Open", acknowledgedBy: "-", created: "2026-06-09 16:55" },
      { id: "EVT-02", device: "assets.nextgenpng.net", severity: "Warning", event: "Slow response", status: "Acknowledged", acknowledgedBy: "Support Desk", created: "2026-06-09 16:20" }
    ]
  },
  monitoringMaintenance: {
    title: "Maintenance",
    description: "Maintenance logs and planned work.",
    icon: Settings,
    idPrefix: "MNT",
    fields: [["device", "Device"], ["task", "Task"], ["assignedTo", "Assigned To"], ["scheduled", "Scheduled"], ["status", "Status"], ["notes", "Notes"]],
    rows: [
      { id: "MNT-01", device: "MikroTik Router", task: "Firmware review", assignedTo: "NOC Operator", scheduled: "2026-06-30", status: "Scheduled", notes: "Check backup first" },
      { id: "MNT-02", device: "Client CCTV gateway", task: "Field check", assignedTo: "Support Desk", scheduled: "2026-06-10", status: "Open", notes: "Confirm power and WAN" }
    ]
  },
  monitoringIntegrations: {
    title: "Integrations",
    description: "MQTT, ONVIF, BACnet, Modbus, email, and API integration settings.",
    icon: Settings,
    idPrefix: "INT",
    fields: [["name", "Integration"], ["type", "Type"], ["endpoint", "Endpoint"], ["status", "Status"], ["owner", "Owner"]],
    rows: [
      { id: "INT-01", name: "Website probe API", type: "HTTPS", endpoint: "https://nextgenpng.net/", status: "Enabled", owner: "NOC Operator" },
      { id: "INT-02", name: "CCTV ONVIF gateway", type: "ONVIF", endpoint: "Remote camera gateway", status: "Enabled", owner: "Support Desk" }
    ]
  },
  reportCenter: {
    title: "Report Center",
    description: "ERP reports across HRMS, payroll, inventory, assets, CRM, ticketing, monitoring, and MOMS.",
    icon: FileText,
    idPrefix: "RPT",
    fields: [["name", "Report"], ["module", "Module"], ["period", "Period"], ["format", "Format"], ["owner", "Owner"], ["status", "Status"]],
    rows: [
      { id: "RPT-01", name: "Asset Assignment Report", module: "Assets", period: "This month", format: "CSV/PDF", owner: "Asset Manager", status: "Ready" },
      { id: "RPT-02", name: "Payroll Summary", module: "Payroll", period: "June 2026", format: "PDF", owner: "Payroll Officer", status: "Draft" },
      { id: "RPT-03", name: "Monitoring Uptime", module: "Monitoring", period: "Last 7 days", format: "CSV", owner: "NOC Operator", status: "Ready" }
    ]
  },
  auditReports: {
    title: "Audit Logs",
    description: "Recent activities, login/logout events, CRUD changes, and module access logs.",
    icon: Activity,
    idPrefix: "AUD",
    fields: [["time", "Time"], ["user", "User"], ["action", "Action"], ["module", "Module"], ["description", "Description"], ["status", "Status"]],
    rows: [
      { id: "AUD-01", time: "-8s ago", user: "System Admin", action: "LOGIN", module: "Users", description: "System Admin logged in", status: "Recorded" },
      { id: "AUD-02", time: "10m ago", user: "System Admin", action: "LOGOUT", module: "Users", description: "System Admin logged out", status: "Recorded" },
      { id: "AUD-03", time: "11m ago", user: "System Admin", action: "UPDATE", module: "Assets", description: "Assignment status changed", status: "Recorded" }
    ]
  },
  systemSettings: {
    title: "System Settings",
    description: "ERP configuration, security, notifications, currencies, units, and module setup.",
    icon: Settings,
    idPrefix: "SET",
    fields: [["setting", "Setting"], ["module", "Module"], ["value", "Value"], ["owner", "Owner"], ["status", "Status"]],
    rows: [
      { id: "SET-01", setting: "Company Name", module: "General", value: "NextGen PNG", owner: "System Admin", status: "Enabled" },
      { id: "SET-02", setting: "Low Stock Threshold", module: "AIMS", value: "5", owner: "Inventory Officer", status: "Enabled" },
      { id: "SET-03", setting: "Ticket SLA Alerts", module: "Ticketing", value: "Enabled", owner: "Support Desk", status: "Enabled" }
    ]
  },
  securitySettings: {
    title: "Security Settings",
    description: "Roles, permissions, password rules, and access control.",
    icon: ShieldCheck,
    idPrefix: "SEC",
    fields: [["role", "Role"], ["access", "Access"], ["permission", "Permission"], ["write", "Write"], ["status", "Status"]],
    rows: [
      { id: "SEC-01", role: "Super Admin", access: "All modules", permission: "Full control", write: "Yes", status: "Active" },
      { id: "SEC-02", role: "Viewer", access: "All permitted modules", permission: "Read only", write: "No", status: "Active" }
    ]
  }
};

const moduleSections = {
  hrms: ["hrmsEmployees", "hrmsAttendance", "hrmsApplications", "hrmsDepartments"],
  payroll: ["payrollRuns", "payrollEmployees", "payrollCashAdvances"],
  aims: ["aimsInventory", "aimsInvoices", "aimsOrders", "aimsLedger"],
  moms: ["momsMachines", "momsOperations", "momsMaintenance"],
  assets: ["assetInventory", "assetAssignments", "assetSuppliers", "assetCategories", "assetDepartments", "assetReceivers", "assetNotifications", "assetActivity"],
  crm: ["crmCustomers", "crmSubscriptions", "crmHosting", "crmSupport", "crmRenewals"],
  tickets: ["ticketTickets", "ticketClients", "ticketServices", "ticketSla", "ticketSystemStatus", "ticketKnowledge"],
  monitoring: ["monitoringDevices", "monitoringReadings", "monitoringEvents", "monitoringMaintenance", "monitoringIntegrations"],
  reports: ["reportCenter", "auditReports"],
  settings: ["systemSettings", "securitySettings"]
};

const roleDescriptions = [
  ["Super Admin", "Everything", "Full create, edit, delete, export, settings, and user control"],
  ["HRMS Manager", "HRMS + Reports", "Employee master files, attendance, applications, departments, and HR reports"],
  ["Payroll Manager", "HRMS + Payroll", "Payroll runs, salary setup, deductions, cash advances, and payslip records"],
  ["AIMS Manager", "AIMS + Assets", "Inventory, stock movements, orders, invoices, GL, and asset register support"],
  ["Asset Manager", "Assets + Tickets", "Asset inventory, assignments, suppliers, departments, notifications, and linked tickets"],
  ["CRM Manager", "CRM + Tickets", "Customers, subscriptions, renewals, hosting requests, support requests, and linked tickets"],
  ["Support Lead", "CRM + Tickets + Monitoring", "Customer support, tickets, service status, and monitoring events"],
  ["Monitoring Operator", "Tickets + Monitoring", "NOC checks, devices, readings, events, maintenance, and ticket escalation"],
  ["Viewer", "Read-only", "Can view operational records but cannot change or delete data"]
];

const defaultUi = {
  dashboard: "dashboard",
  hrms: "hrmsEmployees",
  payroll: "payrollRuns",
  aims: "aimsInventory",
  moms: "momsMachines",
  assets: "assetInventory",
  crm: "crmCustomers",
  tickets: "ticketTickets",
  monitoring: "monitoringDevices",
  reports: "reportCenter",
  settings: "systemSettings",
  users: "users"
};

function cloneSeed() {
  const state = { audit: ["ERP workspace initialized from full system analysis"] };
  Object.entries(schemas).forEach(([key, schema]) => {
    state[key] = schema.rows.map((row) => ({ ...row }));
  });
  return state;
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem("nextgen-full-erp-state"));
    return parsed || cloneSeed();
  } catch {
    return cloneSeed();
  }
}

function persistState(next) {
  localStorage.setItem("nextgen-full-erp-state", JSON.stringify(next));
}

function tone(value) {
  const text = String(value || "").toLowerCase();
  if (["critical", "offline", "open", "unread", "low stock", "overdue"].some((word) => text.includes(word))) return "danger";
  if (["warning", "progress", "waiting", "renewal", "due", "scheduled"].some((word) => text.includes(word))) return "warning";
  if (["active", "online", "available", "normal", "resolved", "returned", "enabled", "published", "operational"].some((word) => text.includes(word))) return "success";
  return "neutral";
}

function App() {
  const [user, setUser] = useState(() => accounts.find((item) => item.email === localStorage.getItem("nextgen-full-erp-user")) || null);
  const [state, setState] = useState(loadState);
  const [activeModule, setActiveModule] = useState("dashboard");
  const [activeSection, setActiveSection] = useState(defaultUi);
  const [query, setQuery] = useState("");
  const pngTime = usePngTime();

  function updateState(next, auditMessage) {
    const withAudit = auditMessage ? { ...next, audit: [auditMessage, ...(next.audit || [])].slice(0, 12) } : next;
    setState(withAudit);
    persistState(withAudit);
  }

  if (!user) return <Login onLogin={setUser} />;

  const allowedModules = moduleConfig.filter((item) => user.modules.includes(item.id));
  const module = allowedModules.some((item) => item.id === activeModule) ? activeModule : "dashboard";

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">NG</div>
          <div>
            <strong>NextGen ERP</strong>
            <span>All-in-one operations</span>
          </div>
        </div>
        <nav>
          {allowedModules.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={module === item.id ? "active" : ""} onClick={() => setActiveModule(item.id)}>
                <Icon size={18} />
                {item.short}
              </button>
            );
          })}
        </nav>
        <div className="profile">
          <UserRound size={18} />
          <div>
            <strong>{user.name}</strong>
            <span>{user.role}</span>
          </div>
        </div>
        <button className="signout" onClick={() => { localStorage.removeItem("nextgen-full-erp-user"); setUser(null); }}>
          <LogOut size={17} />
          Sign out
        </button>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <div>
            <p>Role-controlled ERP access</p>
            <h1>{moduleConfig.find((item) => item.id === module)?.label}</h1>
          </div>
          <div className="png-clock" aria-label="Papua New Guinea time">
            <span>PNG Time</span>
            <strong>{pngTime}</strong>
          </div>
          <label className="search">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search every visible record..." />
          </label>
          <button className="icon-button" title="Notifications"><Bell size={18} /></button>
        </header>
        {module === "dashboard" && <Dashboard state={state} setActiveModule={setActiveModule} user={user} />}
        {Object.keys(moduleSections).includes(module) && (
          <ModuleWorkspace
            module={module}
            state={state}
            updateState={updateState}
            activeSection={activeSection[module]}
            setActiveSection={(section) => setActiveSection({ ...activeSection, [module]: section })}
            query={query}
            user={user}
          />
        )}
        {module === "users" && <UsersAndRoles />}
      </main>
    </div>
  );
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@nextgenpng.net");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const pngTime = usePngTime();

  function submit(event) {
    event.preventDefault();
    const account = accounts.find((item) => item.email === email.trim() && item.password === password);
    if (!account) {
      setError("Invalid email or password.");
      return;
    }
    localStorage.setItem("nextgen-full-erp-user", account.email);
    onLogin(account);
  }

  return (
    <div className="login">
      <div className="login-bg-grid" />
      <section className="login-panel">
        <div className="login-header">
          <div className="brand large">
            <div className="brand-mark">NG</div>
            <div>
              <strong>NextGen Unified ERP</strong>
              <span>Enterprise operations platform</span>
            </div>
          </div>
          <div className="login-clock">
            <span>Papua New Guinea Time</span>
            <strong>{pngTime}</strong>
          </div>
        </div>
        <div className="login-intro">
          <h1>Secure ERP Access</h1>
          <p>Assets, HRMS, payroll, CRM, ticketing, monitoring, and management controls in one governed workspace.</p>
        </div>
        <form onSubmit={submit}>
          <label>Email address<input value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error && <p className="error">{error}</p>}
          <button className="primary" type="submit"><Lock size={17} /> Sign in</button>
        </form>
        <div className="demo-users">
          {accounts.map((account) => (
            <button key={account.email} onClick={() => { setEmail(account.email); setPassword("password"); }}>
              {account.role}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function Dashboard({ state, setActiveModule, user }) {
  const stats = [
    ["Employees", state.hrmsEmployees.length, "View", "hrms", Users, "blue"],
    ["Payroll", state.payrollRuns.filter((row) => row.status !== "Posted").length, "View", "payroll", FileText, "purple"],
    ["Inventory", state.aimsInventory.length, "View", "aims", PackageCheck, "green"],
    ["Low Stock Items", state.aimsInventory.filter((row) => String(row.status).toLowerCase().includes("low")).length + state.assetInventory.filter((row) => String(row.status).toLowerCase().includes("low")).length, "View", "aims", AlertTriangle, "orange"],
    ["Active Clients", state.crmCustomers.filter((row) => row.status === "Active").length, "View", "crm", BriefcaseBusiness, "indigo"],
    ["System Users", accounts.length, "Manage", "users", Users, "red"],
    ["Activity Logs", (state.auditReports?.length || 0) + (state.assetActivity?.length || 0), "View", "reports", Activity, "indigo"]
  ].filter((item) => user.modules.includes(item[3]) || item[3] === "dashboard");

  return (
    <section className="stack">
      <div className="breadcrumb">
        <span>Home</span>
        <span>›</span>
        <strong>Dashboard</strong>
      </div>
      <div className="erp-title">
        <h2>Dashboard</h2>
      </div>
      <div className="erp-card-grid">
        {stats.map(([label, value, note, target, Icon, color]) => (
          <button className={`erp-card ${color}`} key={label} onClick={() => setActiveModule(target)}>
            <span className="card-icon"><Icon size={24} /></span>
            <strong>{label}</strong>
            <b>{value}</b>
            <small>{note}</small>
          </button>
        ))}
      </div>
      <div className="hero-panel secondary-hero">
        <div>
          <span className="eyebrow"><CheckCircle2 size={14} /> System overview</span>
          <h2>Integrated ERP System</h2>
          <p>Operational control center for assets, customer work, ticket SLAs, and nextgenpng.net monitoring.</p>
          <div className="hero-actions">
            <button onClick={() => setActiveModule("assets")}><HardDrive size={16} /> Open Assets</button>
            <button onClick={() => setActiveModule("crm")}><BriefcaseBusiness size={16} /> Open CRM</button>
            <button onClick={() => setActiveModule("tickets")}><LifeBuoy size={16} /> Open Tickets</button>
          </div>
        </div>
        <div className="hero-kpis">
          <Kpi label="Live alerts" value={state.monitoringEvents.filter((row) => row.status === "Open").length} />
          <Kpi label="Due renewals" value={state.crmRenewals.filter((row) => row.status.includes("Due")).length} />
          <Kpi label="Warnings" value={state.ticketSystemStatus.filter((row) => row.status === "Warning").length} />
        </div>
      </div>
      <div className="split">
        <Panel title="Recent Activities" badge={`${state.auditReports.length} entries`}>
          <MiniTable rows={state.auditReports.slice(0, 6)} columns={["time", "user", "action", "module", "description"]} />
        </Panel>
        <Panel title="Merged Systems" badge="Live modules">
          <ul className="activity-list">
            <li>Assets Management merged with inventory, assignments, suppliers, departments, receivers, notifications, and activity logs.</li>
            <li>CRM merged with clients, subscriptions, renewals, hosting requests, support, and service tracking.</li>
            <li>Ticketing merged with clients, services, SLA, tickets, knowledge base, and system status.</li>
            <li>Monitoring merged with devices, readings, events, maintenance, integrations, and nextgenpng.net checks.</li>
          </ul>
        </Panel>
      </div>
    </section>
  );
}

function ModuleWorkspace({ module, state, updateState, activeSection, setActiveSection, query, user }) {
  const sections = moduleSections[module];
  const section = sections.includes(activeSection) ? activeSection : sections[0];
  const schema = schemas[section];

  return (
    <section className="stack">
      <div className="section-tabs">
        {sections.map((key) => {
          const Icon = schemas[key].icon;
          return (
            <button key={key} className={key === section ? "active" : ""} onClick={() => setActiveSection(key)}>
              <Icon size={16} />
              {schemas[key].title}
            </button>
          );
        })}
      </div>
      <RecordsPanel stateKey={section} schema={schema} state={state} updateState={updateState} query={query} user={user} />
    </section>
  );
}

function RecordsPanel({ stateKey, schema, state, updateState, query, user }) {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(makeEmpty(schema));
  const [selected, setSelected] = useState(null);
  const rows = useMemo(() => {
    const all = state[stateKey] || [];
    return all.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
  }, [state, stateKey, query]);

  function reset() {
    setEditingId(null);
    setForm(makeEmpty(schema));
  }

  function save(event) {
    event.preventDefault();
    if (!user.write) return;
    const nextRow = editingId ? { ...form, id: editingId } : { ...form, id: `${schema.idPrefix}-${Math.floor(1000 + Math.random() * 9000)}` };
    const current = state[stateKey] || [];
    const nextRows = editingId ? current.map((row) => row.id === editingId ? nextRow : row) : [nextRow, ...current];
    updateState({ ...state, [stateKey]: nextRows }, `${user.name} ${editingId ? "updated" : "created"} ${nextRow.id} in ${schema.title}`);
    reset();
  }

  function beginEdit(row) {
    setEditingId(row.id);
    setForm({ ...row });
  }

  function remove(row) {
    if (!user.write) return;
    updateState({ ...state, [stateKey]: (state[stateKey] || []).filter((item) => item.id !== row.id) }, `${user.name} deleted ${row.id} from ${schema.title}`);
  }

  function quickAction(row) {
    if (!user.write) return;
    const next = { ...row };
    if (String(next.status).toLowerCase().includes("issued")) next.status = "Returned";
    else if (String(next.status).toLowerCase().includes("open")) next.status = "In progress";
    else if (String(next.status).toLowerCase().includes("warning")) next.status = "Operational";
    else if (String(next.status).toLowerCase().includes("offline")) next.status = "Warning";
    else next.status = "Active";
    updateState({ ...state, [stateKey]: (state[stateKey] || []).map((item) => item.id === row.id ? next : item) }, `${user.name} changed ${row.id} status to ${next.status}`);
  }

  function exportCsv() {
    const header = ["id", ...schema.fields.map(([key]) => key)];
    const csv = [header.join(","), ...rows.map((row) => header.map((key) => quoteCsv(row[key])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${schema.title.toLowerCase().replaceAll(" ", "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="module-grid">
      <Panel title={schema.title} badge={`${rows.length} records`} description={schema.description}>
        {user.write ? (
          <form className="record-form" onSubmit={save}>
            {schema.fields.map(([key, label]) => (
              <label key={key}>
                {label}
                <input value={form[key] || ""} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
              </label>
            ))}
            <div className="form-actions">
              <button className="primary" type="submit"><Plus size={17} /> {editingId ? "Save" : "Add"}</button>
              {editingId && <button type="button" onClick={reset}>Cancel</button>}
              <button type="button" onClick={exportCsv}><Download size={16} /> CSV</button>
            </div>
          </form>
        ) : (
          <div className="readonly"><Lock size={17} /> Your role is read-only for this ERP workspace.</div>
        )}
      </Panel>
      <Panel title={`${schema.title} Records`} badge="Manage">
        <DataTable
          rows={rows}
          fields={schema.fields}
          onView={setSelected}
          onEdit={beginEdit}
          onDelete={remove}
          onQuickAction={quickAction}
          canWrite={user.write}
        />
      </Panel>
      {selected && (
        <aside className="detail-panel">
          <div className="panel-head">
            <h2>{selected.id}</h2>
            <button className="icon-button" onClick={() => setSelected(null)}>×</button>
          </div>
          <dl>
            {Object.entries(selected).map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      )}
    </div>
  );
}

function DataTable({ rows, fields, onView, onEdit, onDelete, onQuickAction, canWrite }) {
  const visibleFields = fields.slice(0, 7);
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {visibleFields.map(([, label]) => <th key={label}>{label}</th>)}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {visibleFields.map(([key]) => (
                <td key={key}>{key === "status" || key === "priority" || key === "severity" ? <Badge tone={tone(row[key])}>{row[key]}</Badge> : row[key]}</td>
              ))}
              <td>
                <div className="actions">
                  <button className="icon-button" title="View" onClick={() => onView(row)}><FileText size={15} /></button>
                  {canWrite && <button className="icon-button" title="Quick status action" onClick={() => onQuickAction(row)}><CheckCircle2 size={15} /></button>}
                  {canWrite && <button className="icon-button" title="Edit" onClick={() => onEdit(row)}><Edit size={15} /></button>}
                  {canWrite && <button className="icon-button danger-action" title="Delete" onClick={() => onDelete(row)}><Trash2 size={15} /></button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <div className="empty"><Database size={22} /> No records match the current search.</div>}
    </div>
  );
}

function UsersAndRoles() {
  return (
    <section className="stack">
      <Panel title="One Login Access Control" badge="Role matrix" description="Users enter one ERP login. Their role decides which systems and actions they can access.">
        <div className="role-grid">
          {roleDescriptions.map(([role, access, detail]) => (
            <article className="role-card" key={role}>
              <strong>{role}</strong>
              <Badge>{access}</Badge>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Demo Users" badge={`${accounts.length} accounts`}>
        <MiniTable rows={accounts.map(({ password, modules, write, ...rest }) => ({ ...rest, access: modules.join(", "), permission: write ? "Write" : "Read only" }))} columns={["email", "name", "role", "access", "permission"]} />
      </Panel>
    </section>
  );
}

function Panel({ title, badge, description, children }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {badge && <Badge>{badge}</Badge>}
      </div>
      {children}
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <div className="kpi">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MiniTable({ rows, columns }) {
  return (
    <div className="table-wrap compact">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || row.email || index}>
              {columns.map((column) => <td key={column}>{column === "status" ? <Badge tone={tone(row[column])}>{row[column]}</Badge> : row[column]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Badge({ children, tone: badgeTone = "neutral" }) {
  return <span className={`badge ${badgeTone}`}>{children}</span>;
}

function makeEmpty(schema) {
  const row = {};
  schema.fields.forEach(([key]) => { row[key] = ""; });
  return row;
}

function quoteCsv(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export default App;
