import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import { can } from "../../utils/permissions";
import { MdAdd, MdSearch, MdSubscriptions } from "react-icons/md";
import { StatusBadge, SERVICE_ICON } from "./CRM";

const fetchSubscriptions = (page, search, status, service) =>
  baseApi.get(`/api/crm/subscriptions?page=${page}&per_page=20&search=${encodeURIComponent(search)}&filter=${status}&service=${service}`).then((r) => r.data);

const STATUSES     = ["", "active", "expiring_soon", "expired", "suspended"];
const STATUS_LABELS = { "": "All", "active": "Active", "expiring_soon": "Expiring Soon", "expired": "Expired", "suspended": "Suspended" };

export default function Subscriptions() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, permissions } = useAuth();
  const { formatCurrency }    = useSettings();
  const canManage = can(permissions, "crm.manage") || user?.role === "system_admin";

  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState(searchParams.get("filter") || "");
  const [service, setService] = useState("");

  const { data: servicesData = [] } = useQuery({
    queryKey: ["crm_services"],
    queryFn:  () => baseApi.get("/api/crm/services").then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  });

  const { data, isLoading } = useQuery({
    queryKey:  ["crm_subscriptions", page, search, status, service],
    queryFn:   () => fetchSubscriptions(page, search, status, service),
    staleTime: 60 * 1000,
    keepPreviousData: true,
  });

  const subs     = data?.data      || [];
  const lastPage = data?.last_page || 1;
  const total    = data?.total     || 0;

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">

        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h1 style={{ fontWeight: "bold", fontSize: "clamp(18px, 4vw, 26px)", margin: 0 }}>Subscriptions</h1>
            <p className="text-muted mb-0" style={{ fontSize: "14px" }}>All client subscriptions and their status</p>
          </div>
          {canManage && (
            <button className="btn btn-sm" style={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: "8px", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }} onClick={() => navigate("/crm/subscriptions/create")}>
              <MdAdd size={16} /> New Subscription
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="card shadow-sm mb-3" style={{ borderRadius: "12px" }}>
          <div className="card-body p-3">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-4">
                <div style={{ position: "relative" }}>
                  <MdSearch size={18} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                  <input type="text" className="form-control form-control-sm" placeholder="Search client or service..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: "34px", borderRadius: "8px" }} />
                </div>
              </div>
              <div className="col-6 col-md-3">
                <select className="form-select form-select-sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={{ borderRadius: "8px" }}>
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div className="col-6 col-md-3">
                <select className="form-select form-select-sm" value={service} onChange={(e) => { setService(e.target.value); setPage(1); }} style={{ borderRadius: "8px" }}>
                  <option value="">All Services</option>
                  {servicesData.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="col-12 col-md-2 text-md-end">
                <span className="text-muted" style={{ fontSize: "13px" }}>{total} total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
          <div className="card-body p-0">
            {isLoading ? (
              <div className="text-center py-5"><div className="spinner-border spinner-border-sm text-secondary" /><p className="text-muted mt-2">Loading...</p></div>
            ) : subs.length === 0 ? (
              <div className="text-center py-5">
                <MdSubscriptions size={40} style={{ color: "#d1d5db", marginBottom: "8px" }} />
                <p className="text-muted mb-1">No subscriptions found</p>
                {canManage && <button className="btn btn-sm mt-1" style={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: "8px" }} onClick={() => navigate("/crm/subscriptions/create")}>Add Subscription</button>}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead style={{ backgroundColor: "#f8fafc" }}>
                    <tr>
                      {["Client", "Service", "Billing", "Amount", "Start", "Expiry", "Days Left", "Credits", "Status"].map((h) => (
                        <th key={h} style={{ padding: "10px 14px", fontWeight: "600", fontSize: "12px", color: "#6b7280", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subs.map((sub) => {
                      const daysLeft = Math.ceil((new Date(sub.expiry_date) - new Date()) / 86400000);
                      return (
                        <tr key={sub.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/crm/subscriptions/${sub.id}`)}>
                          <td style={{ padding: "10px 14px", fontWeight: "600", fontSize: "13px" }}>{sub.client_name}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#6366f1" }}>
                              {SERVICE_ICON[sub.service_name] || <MdSubscriptions size={14} />} {sub.service_name}
                            </div>
                          </td>
                          <td style={{ padding: "10px 14px", fontSize: "12px", color: "#6b7280" }}>{sub.billing_cycle}</td>
                          <td style={{ padding: "10px 14px", fontSize: "13px", fontWeight: "700" }}>{formatCurrency(sub.amount)}</td>
                          <td style={{ padding: "10px 14px", fontSize: "12px", color: "#6b7280", whiteSpace: "nowrap" }}>{new Date(sub.start_date).toLocaleDateString("en-PG", { day: "numeric", month: "short", year: "numeric" })}</td>
                          <td style={{ padding: "10px 14px", fontSize: "12px", whiteSpace: "nowrap", fontWeight: "600", color: daysLeft <= 7 ? "#ef4444" : daysLeft <= 30 ? "#f59e0b" : "#374151" }}>{new Date(sub.expiry_date).toLocaleDateString("en-PG", { day: "numeric", month: "short", year: "numeric" })}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ fontSize: "13px", fontWeight: "700", color: daysLeft <= 0 ? "#ef4444" : daysLeft <= 7 ? "#ef4444" : daysLeft <= 30 ? "#f59e0b" : "#10b981" }}>
                              {daysLeft > 0 ? `${daysLeft}d` : "Expired"}
                            </span>
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            {sub.credit_days > 0
                              ? <span style={{ backgroundColor: "#e0f2fe", color: "#0369a1", fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px" }}>+{sub.credit_days}d</span>
                              : <span style={{ color: "#9ca3af", fontSize: "12px" }}>—</span>}
                          </td>
                          <td style={{ padding: "10px 14px" }}><StatusBadge status={sub.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {lastPage > 1 && (
            <div className="card-footer bg-white border-top d-flex justify-content-between align-items-center px-3 py-2" style={{ borderRadius: "0 0 12px 12px" }}>
              <button className="btn btn-sm btn-outline-secondary" style={{ borderRadius: "8px" }} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span style={{ fontSize: "13px", color: "#6b7280" }}>Page {page} of {lastPage}</span>
              <button className="btn btn-sm btn-outline-secondary" style={{ borderRadius: "8px" }} disabled={page === lastPage} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}