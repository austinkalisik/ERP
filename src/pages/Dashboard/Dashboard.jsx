import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { useAuth } from "../../contexts/AuthContext";

import {
  MdPeople, MdAttachMoney, MdInventory, MdWarning,
  MdHistory, MdManageAccounts, MdPerson, MdRefresh,
  MdContactPhone,
} from "react-icons/md";

// ── Fetch functions ──────────────────────────────────────────────────────────
const fetchDashboard  = () => baseApi.get("/api/dashboard").then((r) => r.data);
const fetchAuditLogs  = () => baseApi.get("/api/audit-logs?per_page=8&page=1").then((r) => r.data);
const fetchAuditStats = () => baseApi.get("/api/audit-logs/statistics").then((r) => r.data);

// ── Helpers ──────────────────────────────────────────────────────────────────
const ACTION_BADGE = {
  created:   { bg: "#d1fae5", color: "#065f46" },
  approved:  { bg: "#d1fae5", color: "#065f46" },
  fulfilled: { bg: "#d1fae5", color: "#065f46" },
  updated:   { bg: "#dbeafe", color: "#1e40af" },
  stock_in:  { bg: "#dbeafe", color: "#1e40af" },
  deleted:   { bg: "#fee2e2", color: "#991b1b" },
  rejected:  { bg: "#fee2e2", color: "#991b1b" },
  cancelled: { bg: "#fef3c7", color: "#92400e" },
  stock_out: { bg: "#fef3c7", color: "#92400e" },
  login:     { bg: "#f3f4f6", color: "#374151" },
  logout:    { bg: "#f3f4f6", color: "#374151" },
};
const getBadgeStyle = (action) => ACTION_BADGE[action] || { bg: "#f3f4f6", color: "#374151" };

const formatTimeAgo = (dateString) => {
  try {
    const diff = Math.floor((Date.now() - new Date(dateString)) / 1000);
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch { return "—"; }
};

const inferModule = (log) => {
  if (log.module) return log.module;
  if (log.action === "login" || log.action === "logout") return "System";
  const desc = (log.description || "").toLowerCase();
  if (desc.includes("employee") || desc.includes("department") || desc.includes("shift"))                              return "HRMS";
  if (desc.includes("payroll")  || desc.includes("payslip")    || desc.includes("salary"))                             return "Payroll";
  if (desc.includes("inventory")|| desc.includes("stock")      || desc.includes("item"))                               return "AIMS";
  if (desc.includes("machine")  || desc.includes("fuel")       || desc.includes("maintenance") || desc.includes("breakdown")) return "MOMS";
  if (desc.includes("client")   || desc.includes("subscription"))                                                       return "CRM";
  if (desc.includes("user")     || desc.includes("logged"))                                                             return "System";
  return null;
};

export default function Dashboard() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const { user }    = useAuth();

  const isAdmin    = user?.role === "system_admin";
  const isEmployee = user?.role === "employee";
  const hasPermission = (p) => isAdmin || (user?.permissions || []).includes(p);

  const { data: dashData } = useQuery({
    queryKey:  ["dashboard_stats"],
    queryFn:   fetchDashboard,
    staleTime: 10 * 60 * 1000,
  });

  const stats = {
    employees:           dashData?.employees           ?? 0,
    payroll:             dashData?.payroll             ?? 0,
    inventory:           dashData?.inventory           ?? 0,
    lowStock:            dashData?.lowStock            ?? 0,
    systemUsers:         dashData?.systemUsers         ?? 0,
    // CRM — active subscriptions count (more meaningful than pipeline value
    // for a subscription management system)
    crmActiveClients:    dashData?.crmActiveClients    ?? 0,
    crmExpiringSoon:     dashData?.crmExpiringSoon     ?? 0,
  };

  const { data: logsData, isFetching: logsLoading } = useQuery({
    queryKey:  ["dashboard_audit_logs"],
    queryFn:   fetchAuditLogs,
    staleTime: 5 * 60 * 1000,
    enabled:   isAdmin,
  });

  const { data: auditStats } = useQuery({
    queryKey:  ["dashboard_audit_stats"],
    queryFn:   fetchAuditStats,
    staleTime: 5 * 60 * 1000,
    enabled:   isAdmin,
  });

  const recentLogs = logsData?.data  ?? [];
  const totalLogs  = auditStats?.total_logs ?? 0;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard_audit_logs"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard_audit_stats"] });
  };

  return (
    <Layout>
      <h1 className="mb-4" style={{ fontWeight: "bold", fontSize: "clamp(20px, 5vw, 28px)" }}>
        Dashboard
      </h1>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        {hasPermission("access_hrms") && !isEmployee && (
          <DashboardCard title="Employees"      value={stats.employees}   color="#3b82f6" icon={<MdPeople size={30} color="#fff" />}      onView={() => navigate("/hrms/employee-overview")} />
        )}
        {hasPermission("access_payroll") && (
          <DashboardCard title="Payroll"         value={stats.payroll}     color="#8b5cf6" icon={<MdAttachMoney size={30} color="#fff" />} onView={() => navigate("/payroll")} />
        )}
        {hasPermission("access_aims") && (
          <DashboardCard title="Inventory"       value={stats.inventory}   color="#10b981" icon={<MdInventory size={30} color="#fff" />}   onView={() => navigate("/aims/items")} />
        )}
        {hasPermission("access_aims") && (
          <DashboardCard title="Low Stock Items" value={stats.lowStock}    color="#f59e0b" icon={<MdWarning size={30} color="#fff" />}     onView={() => navigate("/aims/stock-movements")} />
        )}
        {hasPermission("access_crm") && !isEmployee && (
          <DashboardCard
            title="Active Clients"
            value={stats.crmActiveClients}
            color="#6366f1"
            icon={<MdContactPhone size={30} color="#fff" />}
            onView={() => navigate("/crm")}
          />
        )}
        {hasPermission("access_crm") && !isEmployee && stats.crmExpiringSoon > 0 && (
          <DashboardCard
            title="Expiring Soon"
            value={stats.crmExpiringSoon}
            color="#f97316"
            icon={<MdWarning size={30} color="#fff" />}
            onView={() => navigate("/crm/subscriptions?filter=expiring_soon")}
          />
        )}
        {isAdmin && (
          <DashboardCard title="System Users"  value={stats.systemUsers} color="#ef4444" icon={<MdManageAccounts size={30} color="#fff" />} />
        )}
        {isAdmin && (
          <DashboardCard
            title="Activity Logs"
            value={logsLoading ? "..." : totalLogs.toLocaleString()}
            color="#6366f1"
            icon={<MdHistory size={30} color="#fff" />}
            onView={() => navigate("/settings?tab=audit")}
          />
        )}
      </div>

      {/* Recent Activities — admin only */}
      {isAdmin && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm" style={{ borderRadius: "15px" }}>
              <div className="card-header bg-white p-3 d-flex align-items-center justify-content-between" style={{ borderRadius: "15px 15px 0 0", borderBottom: "1px solid #e5e7eb" }}>
                <div className="d-flex align-items-center gap-2">
                  <MdHistory size={20} color="#6366f1" />
                  <h5 className="mb-0 fw-semibold">Recent Activities</h5>
                  {recentLogs.length > 0 && (
                    <span style={{ backgroundColor: "#ede9fe", color: "#5b21b6", fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px" }}>
                      {recentLogs.length} entries
                    </span>
                  )}
                </div>
                <button
                  className="btn btn-sm"
                  style={{ color: "#6b7280", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  onClick={handleRefresh}
                  disabled={logsLoading}
                >
                  <MdRefresh size={16} className={logsLoading ? "spin" : ""} />
                  Refresh
                </button>
              </div>

              <div className="card-body p-0">
                {logsLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-secondary me-2" role="status" />
                    Loading activity...
                  </div>
                ) : recentLogs.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <MdHistory size={36} style={{ opacity: 0.3, marginBottom: "8px" }} />
                    <p className="mb-0">No recent activity found.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                        <tr>
                          {["Time", "User", "Action", "Module", "Description"].map((h) => (
                            <th key={h} style={{ padding: "12px 16px", fontWeight: "600", fontSize: "12px", color: "#666", textTransform: "uppercase" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {recentLogs.map((log) => {
                          const badge  = getBadgeStyle(log.action);
                          const module = inferModule(log);
                          return (
                            <tr key={log.id}>
                              <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                                <span style={{ fontSize: "13px", color: "#6b7280" }}>{formatTimeAgo(log.created_at)}</span>
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <MdPerson size={16} color="#5b21b6" />
                                  </div>
                                  <div>
                                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#111827" }}>{log.user_name || "System"}</div>
                                    {log.user_role && (
                                      <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "capitalize" }}>
                                        {log.user_role.replace(/_/g, " ")}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                <span style={{ backgroundColor: badge.bg, color: badge.color, padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                                  {log.action}
                                </span>
                              </td>
                              <td style={{ padding: "12px 16px" }}>
                                {module
                                  ? <span style={{ backgroundColor: "#f3f4f6", color: "#374151", padding: "3px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "500" }}>{module}</span>
                                  : <span style={{ color: "#9ca3af", fontSize: "12px" }}>—</span>
                                }
                              </td>
                              <td style={{ padding: "12px 16px", fontSize: "13px", color: "#374151", maxWidth: "300px" }}>
                                <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {log.description}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </Layout>
  );
}

function DashboardCard({ title, value, color, icon, onView }) {
  return (
    <div className="col-12 col-sm-6 col-lg-4">
      <div className="card shadow-sm" style={{ background: color, color: "white", borderRadius: 15, padding: 20, minHeight: onView ? 170 : 140, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div className="d-flex align-items-center gap-3">
          <div style={{ background: "rgba(255,255,255,0.25)", width: 55, height: 55, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {icon}
          </div>
          <h6 className="fw-bold m-0">{title}</h6>
        </div>
        <h2 className="fw-bold m-0">{value}</h2>
        {onView && (
          <button className="btn btn-light fw-semibold mt-2" style={{ borderRadius: 8 }} onClick={onView}>View</button>
        )}
      </div>
    </div>
  );
}