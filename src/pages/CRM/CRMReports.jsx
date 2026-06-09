import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { useSettings } from "../../contexts/SettingsContext";
import {
  MdAttachMoney, MdSchedule, MdCreditScore,
  MdSearch, MdPhone, MdEmail,
} from "react-icons/md";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

const STATUS_STYLE = {
  Active:    { bg: "#dcfce7", color: "#166534" },
  Expiring:  { bg: "#fef3c7", color: "#92400e" },
  Expired:   { bg: "#fee2e2", color: "#991b1b" },
  Suspended: { bg: "#f3f4f6", color: "#374151" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.Suspended;
  return (
    <span style={{ backgroundColor: s.bg, color: s.color, padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "700" }}>
      {status}
    </span>
  );
}

// ── Revenue Report ────────────────────────────────────────────────────────────
function RevenueReport() {
  const { formatCurrency } = useSettings();
  const [groupBy,  setGroupBy]  = useState("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  const { data, isLoading } = useQuery({
    queryKey:  ["crm_report_revenue", groupBy, dateFrom, dateTo],
    queryFn:   () => baseApi.get(`/api/crm/reports/revenue?group_by=${groupBy}&date_from=${dateFrom}&date_to=${dateTo}`).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const rows    = data?.data    || [];
  const summary = data?.summary || {};

  return (
    <div>
      {/* Controls */}
      <div className="card shadow-sm mb-4" style={{ borderRadius: "12px" }}>
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-3">
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "3px", display: "block" }}>Group By</label>
              <select className="form-select form-select-sm" value={groupBy} onChange={(e) => setGroupBy(e.target.value)} style={{ borderRadius: "8px" }}>
                <option value="month">Month</option>
                <option value="service">Service</option>
                <option value="client">Client (Top 20)</option>
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "3px", display: "block" }}>From</label>
              <input type="date" className="form-control form-control-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ borderRadius: "8px" }} />
            </div>
            <div className="col-6 col-md-3">
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "3px", display: "block" }}>To</label>
              <input type="date" className="form-control form-control-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ borderRadius: "8px" }} />
            </div>
            <div className="col-12 col-md-3 d-flex align-items-end gap-2">
              <button className="btn btn-sm btn-outline-secondary" style={{ borderRadius: "8px" }} onClick={() => { setDateFrom(""); setDateTo(""); }}>Clear</button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: "Total Payments",  value: summary.total_payments ?? 0,                        color: "#6366f1" },
          { label: "Total Revenue",   value: formatCurrency(summary.total_revenue ?? 0),         color: "#10b981" },
          { label: "Average Payment", value: formatCurrency(summary.average ?? 0),               color: "#f59e0b" },
        ].map((c) => (
          <div key={c.label} className="col-12 col-md-4">
            <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-body p-3">
                <p className="text-muted mb-1" style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>{c.label}</p>
                <h4 style={{ fontWeight: "800", color: c.color, margin: 0 }}>{c.value}</h4>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-5"><div className="spinner-border spinner-border-sm text-secondary" /></div>
      ) : rows.length === 0 ? (
        <div className="text-center py-5"><p className="text-muted">No payment data found for the selected filters.</p></div>
      ) : (
        <div className="row g-3">
          {/* Chart */}
          <div className="col-12 col-lg-7">
            <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-header bg-white p-3 border-bottom">
                <h6 className="mb-0" style={{ fontWeight: "600" }}>
                  Revenue by {groupBy === "month" ? "Month" : groupBy === "service" ? "Service" : "Client"}
                </h6>
              </div>
              <div className="card-body p-3" style={{ height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  {groupBy === "service" ? (
                    <PieChart>
                      <Pie data={rows.map((r) => ({ name: r.label, value: r.total }))} cx="50%" cy="45%" outerRadius={90} dataKey="value" nameKey="name" labelLine={false}>
                        {rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [formatCurrency(v), "Revenue"]} />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                    </PieChart>
                  ) : (
                    <BarChart data={rows} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => [formatCurrency(v), "Revenue"]} />
                      <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="col-12 col-lg-5">
            <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-header bg-white p-3 border-bottom">
                <h6 className="mb-0" style={{ fontWeight: "600" }}>Breakdown</h6>
              </div>
              <div className="card-body p-0" style={{ maxHeight: "300px", overflowY: "auto" }}>
                <table className="table table-hover align-middle mb-0">
                  <thead style={{ backgroundColor: "#f8fafc", position: "sticky", top: 0 }}>
                    <tr>
                      <th style={{ padding: "8px 14px", fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Label</th>
                      <th style={{ padding: "8px 14px", fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Payments</th>
                      <th style={{ padding: "8px 14px", fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i}>
                        <td style={{ padding: "8px 14px", fontSize: "13px", fontWeight: "500" }}>{r.label}</td>
                        <td style={{ padding: "8px 14px", fontSize: "13px", color: "#6b7280" }}>{r.payment_count}</td>
                        <td style={{ padding: "8px 14px", fontSize: "13px", fontWeight: "700", color: "#6366f1" }}>{formatCurrency(r.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Expiry Report ─────────────────────────────────────────────────────────────
function ExpiryReport() {
  const { formatCurrency } = useSettings();
  const [window_, setWindow] = useState("30");
  const [status,  setStatus] = useState("");
  const [search,  setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey:  ["crm_report_expiry", window_, status],
    queryFn:   () => baseApi.get(`/api/crm/reports/expiry?window=${window_}&status=${status}`).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const rows    = data?.data    || [];
  const summary = data?.summary || {};

  const filtered = search
    ? rows.filter((r) => r.client_name.toLowerCase().includes(search.toLowerCase()) || r.service_name.toLowerCase().includes(search.toLowerCase()))
    : rows;

  const urgencyColor = (d) => d < 0 ? "#ef4444" : d <= 7 ? "#ef4444" : d <= 14 ? "#f97316" : d <= 30 ? "#f59e0b" : "#374151";

  return (
    <div>
      <div className="card shadow-sm mb-4" style={{ borderRadius: "12px" }}>
        <div className="card-body p-3">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-4">
              <div style={{ position: "relative" }}>
                <MdSearch size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                <input type="text" className="form-control form-control-sm" placeholder="Search client or service..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: "32px", borderRadius: "8px" }} />
              </div>
            </div>
            <div className="col-6 col-md-3">
              <select className="form-select form-select-sm" value={window_} onChange={(e) => setWindow(e.target.value)} style={{ borderRadius: "8px" }}>
                <option value="30">Next 30 days</option>
                <option value="60">Next 60 days</option>
                <option value="90">Next 90 days</option>
                <option value="all">All</option>
              </select>
            </div>
            <div className="col-6 col-md-3">
              <select className="form-select form-select-sm" value={status} onChange={(e) => setStatus(e.target.value)} style={{ borderRadius: "8px" }}>
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Expiring">Expiring</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="row g-3 mb-4">
        {[
          { label: "Active",   value: summary.active   ?? 0, color: "#10b981" },
          { label: "Expiring", value: summary.expiring ?? 0, color: "#f59e0b" },
          { label: "Expired",  value: summary.expired  ?? 0, color: "#ef4444" },
        ].map((c) => (
          <div key={c.label} className="col-4">
            <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-body p-3 text-center">
                <p className="text-muted mb-1" style={{ fontSize: "12px", fontWeight: "600" }}>{c.label}</p>
                <h4 style={{ fontWeight: "800", color: c.color, margin: 0 }}>{c.value}</h4>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
        <div className="card-body p-0">
          {isLoading ? (
            <div className="text-center py-5"><div className="spinner-border spinner-border-sm text-secondary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5"><p className="text-muted">No subscriptions found.</p></div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ backgroundColor: "#f8fafc" }}>
                  <tr>
                    {["Client", "Service", "Contact", "Billing", "Amount", "Expiry", "Days Left", "Credits", "Status"].map((h) => (
                      <th key={h} style={{ padding: "10px 14px", fontWeight: "600", fontSize: "11px", color: "#6b7280", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr key={i}>
                      <td style={{ padding: "10px 14px" }}><p style={{ margin: 0, fontWeight: "700", fontSize: "13px" }}>{r.client_name}</p></td>
                      <td style={{ padding: "10px 14px", fontSize: "13px", color: "#6366f1" }}>{r.service_name}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          {r.phone && <span style={{ fontSize: "11px", color: "#6b7280", display: "flex", alignItems: "center", gap: "3px" }}><MdPhone size={11} />{r.phone}</span>}
                          {r.email && <span style={{ fontSize: "11px", color: "#6b7280", display: "flex", alignItems: "center", gap: "3px" }}><MdEmail size={11} />{r.email}</span>}
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: "12px", color: "#6b7280" }}>{r.billing_cycle}</td>
                      <td style={{ padding: "10px 14px", fontSize: "13px", fontWeight: "700" }}>{formatCurrency(r.amount)}</td>
                      <td style={{ padding: "10px 14px", fontSize: "13px", fontWeight: "600", color: urgencyColor(r.days_left), whiteSpace: "nowrap" }}>
                        {new Date(r.expiry_date).toLocaleDateString("en-PG", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontSize: "13px", fontWeight: "800", color: urgencyColor(r.days_left) }}>
                          {r.days_left < 0 ? `${Math.abs(r.days_left)}d overdue` : `${r.days_left}d`}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {r.credit_days > 0
                          ? <span style={{ backgroundColor: "#e0f2fe", color: "#0369a1", fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px" }}>+{r.credit_days}d</span>
                          : <span style={{ color: "#9ca3af", fontSize: "12px" }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 14px" }}><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Credits Report ────────────────────────────────────────────────────────────
function CreditsReport() {
  const { data, isLoading } = useQuery({
    queryKey:  ["crm_report_credits"],
    queryFn:   () => baseApi.get("/api/crm/reports/credits").then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });

  const clients       = data?.clients       || [];
  const interruptions = data?.interruptions || [];
  const summary       = data?.summary       || {};

  return (
    <div>
      <div className="row g-3 mb-4">
        {[
          { label: "Clients with Credits", value: summary.clients_with_credits ?? 0,         color: "#6366f1" },
          { label: "Total Credit Days",    value: `${summary.total_credit_days ?? 0} days`,  color: "#0891b2" },
          { label: "Total Interruptions",  value: summary.total_interruptions  ?? 0,         color: "#f59e0b" },
        ].map((c) => (
          <div key={c.label} className="col-12 col-md-4">
            <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-body p-3">
                <p className="text-muted mb-1" style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>{c.label}</p>
                <h4 style={{ fontWeight: "800", color: c.color, margin: 0 }}>{c.value}</h4>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-5"><div className="spinner-border spinner-border-sm text-secondary" /></div>
      ) : (
        <div className="row g-3">
          <div className="col-12 col-lg-5">
            <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-header bg-white p-3 border-bottom">
                <h6 className="mb-0" style={{ fontWeight: "600" }}>Clients with Credits</h6>
              </div>
              <div className="card-body p-0">
                {clients.length === 0 ? (
                  <div className="text-center py-4"><p className="text-muted mb-0" style={{ fontSize: "13px" }}>No clients with credits</p></div>
                ) : (
                  <table className="table table-hover align-middle mb-0">
                    <thead style={{ backgroundColor: "#f8fafc" }}>
                      <tr>
                        <th style={{ padding: "8px 14px", fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Client</th>
                        <th style={{ padding: "8px 14px", fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Subs</th>
                        <th style={{ padding: "8px 14px", fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Credit Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((c, i) => (
                        <tr key={i}>
                          <td style={{ padding: "8px 14px" }}>
                            <p style={{ margin: 0, fontSize: "13px", fontWeight: "600" }}>{c.client_name}</p>
                            {c.phone && <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{c.phone}</p>}
                          </td>
                          <td style={{ padding: "8px 14px", fontSize: "13px", color: "#6b7280" }}>{c.subscription_count}</td>
                          <td style={{ padding: "8px 14px" }}>
                            <span style={{ backgroundColor: "#e0f2fe", color: "#0369a1", fontSize: "12px", fontWeight: "700", padding: "3px 10px", borderRadius: "999px" }}>
                              +{c.total_credit_days}d
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-7">
            <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-header bg-white p-3 border-bottom">
                <h6 className="mb-0" style={{ fontWeight: "600" }}>Interruption Log (Last 50)</h6>
              </div>
              <div className="card-body p-0" style={{ maxHeight: "400px", overflowY: "auto" }}>
                {interruptions.length === 0 ? (
                  <div className="text-center py-4"><p className="text-muted mb-0" style={{ fontSize: "13px" }}>No interruptions recorded</p></div>
                ) : (
                  <table className="table table-hover align-middle mb-0">
                    <thead style={{ backgroundColor: "#f8fafc", position: "sticky", top: 0 }}>
                      <tr>
                        {["Client", "Service", "Period", "Credit", "Reason"].map((h) => (
                          <th key={h} style={{ padding: "8px 14px", fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {interruptions.map((r, i) => (
                        <tr key={i}>
                          <td style={{ padding: "8px 14px", fontSize: "13px", fontWeight: "600" }}>{r.client_name}</td>
                          <td style={{ padding: "8px 14px", fontSize: "13px", color: "#6366f1" }}>{r.service_name}</td>
                          <td style={{ padding: "8px 14px", fontSize: "12px", color: "#6b7280", whiteSpace: "nowrap" }}>
                            {new Date(r.from_date).toLocaleDateString("en-PG", { day: "numeric", month: "short" })} –{" "}
                            {new Date(r.to_date).toLocaleDateString("en-PG", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td style={{ padding: "8px 14px" }}>
                            <span style={{ backgroundColor: "#e0f2fe", color: "#0369a1", fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px" }}>+{r.credit_days}d</span>
                          </td>
                          <td style={{ padding: "8px 14px", fontSize: "12px", color: "#6b7280" }}>{r.reason || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main CRMReports page ──────────────────────────────────────────────────────
const TABS = [
  { key: "revenue", label: "Revenue", icon: <MdAttachMoney size={16} /> },
  { key: "expiry",  label: "Expiry",  icon: <MdSchedule    size={16} /> },
  { key: "credits", label: "Credits", icon: <MdCreditScore  size={16} /> },
];

export default function CRMReports() {
  const [tab, setTab] = useState("revenue");

  const tabBtn = (t) => ({
    padding: "8px 16px", border: "none", borderRadius: "8px",
    fontSize: "13px", fontWeight: "600", cursor: "pointer",
    backgroundColor: tab === t.key ? "#6366f1" : "transparent",
    color: tab === t.key ? "#fff" : "#6b7280",
    display: "flex", alignItems: "center", gap: "6px",
    transition: "all 0.15s",
  });

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h1 style={{ fontWeight: "bold", fontSize: "clamp(18px, 4vw, 26px)", margin: 0 }}>CRM Reports</h1>
            <p className="text-muted mb-0" style={{ fontSize: "14px" }}>Revenue, expiry, and credit analytics</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "4px", backgroundColor: "#f3f4f6", borderRadius: "10px", padding: "4px", marginBottom: "24px", width: "fit-content" }}>
          {TABS.map((t) => (
            <button key={t.key} style={tabBtn(t)} onClick={() => setTab(t.key)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === "revenue" && <RevenueReport />}
        {tab === "expiry"  && <ExpiryReport />}
        {tab === "credits" && <CreditsReport />}
      </div>
    </Layout>
  );
}