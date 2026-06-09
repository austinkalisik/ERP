import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { useAuth } from "../../contexts/AuthContext";
import {
  MdPeople, MdSubscriptions, MdWarning, MdCheckCircle,
  MdAttachMoney, MdAdd, MdTrendingUp, MdWifi,
  MdDns, MdGpsFixed, MdArrowForward, MdAssessment,
  MdRefresh, MdSettings,
} from "react-icons/md";

const fetchStats    = () => baseApi.get("/api/crm/stats").then((r) => r.data);
const fetchExpiring = () => baseApi.get("/api/crm/subscriptions?filter=expiring_soon&per_page=8").then((r) => r.data);

export const SERVICE_ICON = {
  "Internet Service": <MdWifi size={16} />,
  "Domain Hosting":   <MdDns size={16} />,
  "GPS":              <MdGpsFixed size={16} />,
};

const STATUS_STYLE = {
  Active:    { bg: "#dcfce7", color: "#166534" },
  Expiring:  { bg: "#fef3c7", color: "#92400e" },
  Expired:   { bg: "#fee2e2", color: "#991b1b" },
  Suspended: { bg: "#f3f4f6", color: "#374151" },
};

export function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.Suspended;
  return (
    <span style={{
      backgroundColor: s.bg, color: s.color,
      padding: "3px 10px", borderRadius: "999px",
      fontSize: "11px", fontWeight: "700",
    }}>
      {status}
    </span>
  );
}

export default function CRM() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: stats = {}, refetch: refetchStats } = useQuery({
    queryKey:  ["crm_stats"],
    queryFn:   fetchStats,
    staleTime: 5 * 60 * 1000,
  });

  const { data: expiringData } = useQuery({
    queryKey:  ["crm_expiring"],
    queryFn:   fetchExpiring,
    staleTime: 2 * 60 * 1000,
  });

  const expiring = expiringData?.data || [];

  const statCards = [
    { label: "Total Clients",        value: stats.totalClients        ?? 0, color: "#6366f1", icon: <MdPeople size={24} color="#fff" />,       path: "/crm/clients" },
    { label: "Active Subscriptions", value: stats.activeSubscriptions ?? 0, color: "#10b981", icon: <MdCheckCircle size={24} color="#fff" />,   path: "/crm/subscriptions" },
    { label: "Expiring (30 days)",   value: stats.expiringSoon        ?? 0, color: "#f59e0b", icon: <MdWarning size={24} color="#fff" />,        path: "/crm/renewals" },
    { label: "Expired",              value: stats.expired             ?? 0, color: "#ef4444", icon: <MdSubscriptions size={24} color="#fff" />,  path: "/crm/subscriptions?filter=expired" },
    { label: "Monthly Revenue",      value: `K${(stats.monthlyRevenue ?? 0).toLocaleString()}`, color: "#8b5cf6", icon: <MdAttachMoney size={24} color="#fff" />, path: "/crm/reports" },
    { label: "Total Credits",        value: `${stats.totalCredits ?? 0} days`,                  color: "#0891b2", icon: <MdTrendingUp size={24} color="#fff" />,  path: "/crm/reports" },
  ];

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">

        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h1 style={{ fontWeight: "bold", fontSize: "clamp(20px, 5vw, 28px)", margin: 0 }}>
              CRM Dashboard
            </h1>
            <p className="text-muted mb-0">Client Subscription &amp; Billing Management</p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              style={{ borderRadius: "8px" }}
              onClick={() => navigate("/crm/services")}
            >
              <MdSettings size={16} /> Services
            </button>
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              style={{ borderRadius: "8px" }}
              onClick={() => navigate("/crm/reports")}
            >
              <MdAssessment size={16} /> Reports
            </button>
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              style={{ borderRadius: "8px" }}
              onClick={() => navigate("/crm/renewals")}
            >
              <MdRefresh size={16} /> Renewals
            </button>
            <button
              className="btn btn-sm"
              style={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: "8px", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}
              onClick={() => navigate("/crm/clients/create")}
            >
              <MdAdd size={16} /> New Client
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="row g-3 mb-4">
          {statCards.map((c) => (
            <div key={c.label} className="col-6 col-md-4 col-lg-2">
              <div
                className="card shadow-sm h-100"
                style={{ borderRadius: "12px", border: "none", cursor: c.path ? "pointer" : "default" }}
                onClick={() => c.path && navigate(c.path)}
                onMouseEnter={(e) => c.path && (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)")}
                onMouseLeave={(e) => c.path && (e.currentTarget.style.boxShadow = "")}
              >
                <div className="card-body p-3">
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: c.color, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
                    {c.icon}
                  </div>
                  <p className="text-muted mb-1" style={{ fontSize: "12px", fontWeight: "500" }}>{c.label}</p>
                  <h4 className="mb-0" style={{ fontWeight: "bold", fontSize: "20px" }}>{c.value}</h4>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Service Breakdown */}
        {stats.byService && stats.byService.length > 0 && (
          <div className="row g-3 mb-4">
            {stats.byService.map((s) => (
              <div key={s.service} className="col-12 col-md-4">
                <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
                  <div className="card-body p-3 d-flex align-items-center gap-3">
                    <div style={{ width: "44px", height: "44px", borderRadius: "10px", backgroundColor: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1", flexShrink: 0 }}>
                      {SERVICE_ICON[s.service] || <MdSubscriptions size={20} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="mb-0" style={{ fontWeight: "600", fontSize: "14px" }}>{s.service}</p>
                      <p className="mb-0 text-muted" style={{ fontSize: "12px" }}>{s.count} active · K{Number(s.revenue).toLocaleString()}/mo</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Expiring Soon Table */}
        <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
          <div className="card-header bg-white p-3 border-bottom d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <MdWarning size={18} color="#f59e0b" />
              <h5 className="mb-0" style={{ fontWeight: "600", fontSize: "16px" }}>Expiring Within 30 Days</h5>
              {expiring.length > 0 && (
                <span style={{ backgroundColor: "#fef3c7", color: "#92400e", fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px" }}>
                  {expiring.length}
                </span>
              )}
            </div>
            <button
              className="btn btn-sm btn-link text-decoration-none p-0"
              style={{ color: "#6366f1", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}
              onClick={() => navigate("/crm/renewals")}
            >
              View All <MdArrowForward size={14} />
            </button>
          </div>
          <div className="card-body p-0">
            {expiring.length === 0 ? (
              <div className="text-center py-5">
                <MdCheckCircle size={36} style={{ color: "#d1d5db", marginBottom: "8px" }} />
                <p className="text-muted mb-0" style={{ fontSize: "14px" }}>No subscriptions expiring soon</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead style={{ backgroundColor: "#f8fafc" }}>
                    <tr>
                      {["Client", "Service", "Expiry Date", "Days Left", "Amount", "Status"].map((h) => (
                        <th key={h} style={{ padding: "10px 16px", fontWeight: "600", fontSize: "12px", color: "#6b7280", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {expiring.map((sub) => {
                      const daysLeft = Math.ceil((new Date(sub.expiry_date) - new Date()) / 86400000);
                      return (
                        <tr
                          key={sub.id}
                          style={{ cursor: "pointer" }}
                          onClick={() => navigate(`/crm/subscriptions/${sub.id}`)}
                        >
                          <td style={{ padding: "10px 16px", fontWeight: "600", fontSize: "13px" }}>{sub.client_name}</td>
                          <td style={{ padding: "10px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#6366f1" }}>
                              {SERVICE_ICON[sub.service_name] || <MdSubscriptions size={14} />}
                              {sub.service_name}
                            </div>
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: "13px" }}>
                            {new Date(sub.expiry_date).toLocaleDateString("en-PG", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td style={{ padding: "10px 16px" }}>
                            <span style={{ fontSize: "13px", fontWeight: "700", color: daysLeft <= 7 ? "#ef4444" : daysLeft <= 14 ? "#f59e0b" : "#374151" }}>
                              {daysLeft}d
                            </span>
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: "13px", fontWeight: "600" }}>K{Number(sub.amount).toLocaleString()}</td>
                          <td style={{ padding: "10px 16px" }}><StatusBadge status={sub.status} /></td>
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
    </Layout>
  );
}