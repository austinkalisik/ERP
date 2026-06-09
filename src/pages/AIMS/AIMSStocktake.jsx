import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { MdAdd, MdVisibility, MdAssessment, MdInventory } from "react-icons/md";
import Swal from "sweetalert2";

const fetchSessions = (params) =>
  baseApi.get("/api/aims/stocktake", { params }).then((r) => r.data);

const STATUS_BADGE = {
  draft:       { bg: "#f3f4f6", color: "#374151",  label: "Draft" },
  in_progress: { bg: "#dbeafe", color: "#1e40af",  label: "In Progress" },
  completed:   { bg: "#d1fae5", color: "#065f46",  label: "Completed" },
  cancelled:   { bg: "#fee2e2", color: "#991b1b",  label: "Cancelled" },
};

const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d) ? val : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export default function AIMSStocktake() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: "", type: "" });

  const cacheKey = ["aims_stocktake", filters];
  const { data, isLoading } = useQuery({
    queryKey: cacheKey,
    queryFn:  () => fetchSessions(filters),
    staleTime: 2 * 60 * 1000,
  });

  const sessions = data?.data ?? [];

  const handleCancel = async (id) => {
    const result = await Swal.fire({
      title: "Cancel Stocktake?",
      text: "This session will be deleted and cannot be recovered.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, cancel it",
    });
    if (!result.isConfirmed) return;
    try {
      await baseApi.delete(`/api/aims/stocktake/${id}`);
      queryClient.invalidateQueries({ queryKey: ["aims_stocktake"] });
      Swal.fire({ icon: "success", title: "Cancelled", confirmButtonColor: "#3b82f6", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed", text: err.response?.data?.message || "Could not cancel session.", confirmButtonColor: "#3b82f6" });
    }
  };

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 style={{ fontWeight: "700", fontSize: "clamp(20px,5vw,26px)", marginBottom: "2px" }}>Stocktaking</h1>
            <p className="text-muted mb-0" style={{ fontSize: "13px" }}>Manage full and cyclic stock counts</p>
          </div>
          <button
            className="btn btn-primary d-flex align-items-center gap-2"
            style={{ borderRadius: "8px", fontWeight: "600", padding: "9px 18px" }}
            onClick={() => navigate("/aims/stocktake/create")}
          >
            <MdAdd size={18} /> New Stocktake
          </button>
        </div>

        {/* Filters */}
        <div className="card shadow-sm mb-3" style={{ borderRadius: "10px", border: "1px solid #e5e7eb" }}>
          <div className="card-body py-2 px-3 d-flex flex-wrap gap-2 align-items-center">
            <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: "500" }}>Filter:</span>
            <select
              className="form-select form-select-sm"
              style={{ width: 150, borderRadius: "6px", fontSize: "13px" }}
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="">All Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              className="form-select form-select-sm"
              style={{ width: 150, borderRadius: "6px", fontSize: "13px" }}
              value={filters.type}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="">All Types</option>
              <option value="full">Full Count</option>
              <option value="cyclic">Cyclic Count</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="card shadow-sm" style={{ borderRadius: "10px", border: "1px solid #e5e7eb" }}>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0" style={{ fontSize: "14px" }}>
                <thead style={{ backgroundColor: "#2c3e50", color: "white" }}>
                  <tr>
                    {["Reference", "Type", "Count Date", "Scope", "Progress", "Status", "Actions"].map((h) => (
                      <th key={h} style={{ padding: "13px 16px", fontWeight: "600", fontSize: "13px", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan="7" className="text-center py-5 text-muted">Loading…</td></tr>
                  ) : sessions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        <MdInventory size={36} style={{ opacity: 0.25, display: "block", margin: "0 auto 8px" }} />
                        No stocktake sessions yet. Click <strong>New Stocktake</strong> to begin.
                      </td>
                    </tr>
                  ) : (
                    sessions.map((s) => {
                      const badge   = STATUS_BADGE[s.status] || STATUS_BADGE.draft;
                      const vs      = s.variance_summary || {};
                      const counted = (vs.over || 0) + (vs.under || 0) + (vs.matched || 0);
                      const total   = counted + (vs.uncounted || 0);
                      const pct     = total > 0 ? Math.round((counted / total) * 100) : 0;

                      return (
                        <tr key={s.id} style={{ verticalAlign: "middle" }}>
                          <td style={{ padding: "13px 16px" }}>
                            <span
                              style={{ color: "#3b82f6", fontWeight: "600", cursor: "pointer" }}
                              onClick={() => navigate(`/aims/stocktake/${s.id}`)}
                            >
                              {s.reference}
                            </span>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <span style={{
                              backgroundColor: s.type === "full" ? "#ede9fe" : "#e0f2fe",
                              color: s.type === "full" ? "#5b21b6" : "#0369a1",
                              padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600"
                            }}>
                              {s.type === "full" ? "Full" : "Cyclic"}
                            </span>
                          </td>
                          <td style={{ padding: "13px 16px", color: "#374151" }}>{formatDate(s.count_date)}</td>
                          <td style={{ padding: "13px 16px", color: "#6b7280", fontSize: "13px" }}>
                            {s.location && s.category
                              ? `${s.location} · ${s.category}`
                              : s.location || s.category || <span style={{ color: "#9ca3af" }}>All items</span>}
                          </td>
                          <td style={{ padding: "13px 16px", minWidth: 160 }}>
                            <div className="d-flex align-items-center gap-2">
                              <div style={{ flex: 1, height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
                                <div style={{
                                  width: `${pct}%`, height: "100%", borderRadius: 3,
                                  background: pct === 100 ? "#10b981" : "#3b82f6",
                                  transition: "width 0.3s"
                                }} />
                              </div>
                              <span style={{ fontSize: "12px", color: "#6b7280", whiteSpace: "nowrap", minWidth: 40 }}>
                                {counted}/{total}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <span style={{
                              backgroundColor: badge.bg, color: badge.color,
                              padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600"
                            }}>
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <div className="d-flex gap-1 flex-wrap">
                              <button
                                className="btn btn-sm"
                                style={{ background: "#eff6ff", color: "#2563eb", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "500", padding: "4px 10px" }}
                                onClick={() => navigate(`/aims/stocktake/${s.id}`)}
                              >
                                <MdVisibility size={14} className="me-1" />Count
                              </button>
                              {s.status === "completed" && (
                                <button
                                  className="btn btn-sm"
                                  style={{ background: "#f0fdf4", color: "#16a34a", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "500", padding: "4px 10px" }}
                                  onClick={() => navigate(`/aims/stocktake/${s.id}/variance`)}
                                >
                                  <MdAssessment size={14} className="me-1" />Report
                                </button>
                              )}
                              {["draft", "in_progress"].includes(s.status) && (
                                <button
                                  className="btn btn-sm"
                                  style={{ background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "500", padding: "4px 10px" }}
                                  onClick={() => handleCancel(s.id)}
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}