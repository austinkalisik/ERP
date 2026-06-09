import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { useSettings } from "../../contexts/SettingsContext";
import Swal from "sweetalert2";
import {
  MdAdd, MdFilterList, MdViewKanban, MdTableRows,
  MdTrendingUp, MdPerson, MdCalendarToday,
} from "react-icons/md";

const STAGES = ["Lead", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

const STAGE_COLORS = {
  "Lead":        { bg: "#eff6ff", border: "#3b82f6", text: "#1d4ed8" },
  "Qualified":   { bg: "#f0fdf4", border: "#22c55e", text: "#15803d" },
  "Proposal":    { bg: "#fefce8", border: "#eab308", text: "#854d0e" },
  "Negotiation": { bg: "#fff7ed", border: "#f97316", text: "#c2410c" },
  "Closed Won":  { bg: "#f0fdf4", border: "#16a34a", text: "#14532d" },
  "Closed Lost": { bg: "#fef2f2", border: "#ef4444", text: "#991b1b" },
};

const PRIORITY_COLORS = {
  High:   { bg: "#fef2f2", color: "#dc2626" },
  Medium: { bg: "#fefce8", color: "#ca8a04" },
  Low:    { bg: "#f0fdf4", color: "#16a34a" },
};

const fetchDeals    = (params) => baseApi.get("/api/crm/deals",          { params }).then((r) => r.data);
const fetchPipeline = ()       => baseApi.get("/api/crm/deals/pipeline"           ).then((r) => r.data);

// Client initials avatar
function ClientAvatar({ name }) {
  const initials = (name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const colors   = ["#6366f1","#10b981","#f59e0b","#3b82f6","#8b5cf6","#ec4899"];
  const color    = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: color + "22", border: `1px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color }}>{initials}</span>
    </div>
  );
}

// Days until close with urgency color
function CloseBadge({ dateStr, formatDate }) {
  if (!dateStr) return null;
  const days = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  const color = days < 0 ? "#ef4444" : days <= 7 ? "#f97316" : days <= 30 ? "#f59e0b" : "#9ca3af";
  const label = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color, fontWeight: 600 }}>
      <MdCalendarToday size={10} />
      {label}
    </div>
  );
}

export default function Deals() {
  const navigate                       = useNavigate();
  const qc                             = useQueryClient();
  const { formatCurrency, formatDate } = useSettings();

  const [view,       setView]       = useState("kanban");
  const [search,     setSearch]     = useState("");
  const [filters,    setFilters]    = useState({ priority: "", stage: "" });
  const [showCreate, setShowCreate] = useState(false);

  const { data: dealsData } = useQuery({
    queryKey:  ["crm_deals", filters, search],
    queryFn:   () => fetchDeals({ ...filters, search, per_page: 200 }),
    staleTime: 2 * 60 * 1000,
  });

  const { data: pipeline = [] } = useQuery({
    queryKey:  ["crm_pipeline"],
    queryFn:   fetchPipeline,
    staleTime: 2 * 60 * 1000,
  });

  const deals        = dealsData?.data || [];
  const dealsByStage = (stage) => deals.filter((d) => d.stage === stage);
  const totalValue   = pipeline.reduce((s, p) => s + parseFloat(p.value || 0), 0);

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">

        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h1 style={{ fontWeight: 700, fontSize: "clamp(18px,4vw,26px)", margin: 0 }}>Deals</h1>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>Manage your CRM pipeline</p>
          </div>
          <button
            className="btn btn-sm d-flex align-items-center gap-2"
            style={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: 8, fontWeight: 600, padding: "7px 14px" }}
            onClick={() => setShowCreate(true)}
          >
            <MdAdd size={16} /> New Deal
          </button>
        </div>

        {/* Pipeline summary cards */}
        <div className="row g-3 mb-4">
          {pipeline.map((p) => {
            const sc      = STAGE_COLORS[p.stage] || {};
            const pct     = totalValue > 0 ? Math.round((parseFloat(p.value || 0) / totalValue) * 100) : 0;
            return (
              <div key={p.stage} className="col-6 col-md-2">
                <div className="card shadow-sm h-100" style={{ borderRadius: 12, borderTop: `3px solid ${sc.border || "#6b7280"}`, cursor: "pointer" }}
                  onClick={() => setFilters((f) => ({ ...f, stage: f.stage === p.stage ? "" : p.stage }))}
                >
                  <div className="card-body p-3">
                    <div style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", marginBottom: 6, letterSpacing: "0.5px" }}>{p.stage}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: sc.text || "#111", lineHeight: 1 }}>{p.count}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 8px" }}>{formatCurrency(parseFloat(p.value || 0))}</div>
                    {/* Mini progress bar */}
                    <div style={{ height: 3, background: "#f3f4f6", borderRadius: 99 }}>
                      <div style={{ height: 3, width: `${pct}%`, background: sc.border || "#6b7280", borderRadius: 99, transition: "width 0.3s" }} />
                    </div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 3 }}>{pct}% of total</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="card shadow-sm mb-4" style={{ borderRadius: 12 }}>
          <div className="card-body p-3" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <MdFilterList size={16} color="#6b7280" />
            <input
              type="text" className="form-control form-control-sm" placeholder="Search by title, client…"
              style={{ width: 220, borderRadius: 8 }} value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="form-select form-select-sm" style={{ width: 140, borderRadius: 8 }}
              value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
              <option value="">All Priorities</option>
              <option>High</option><option>Medium</option><option>Low</option>
            </select>
            <select className="form-select form-select-sm" style={{ width: 160, borderRadius: 8 }}
              value={filters.stage} onChange={(e) => setFilters((f) => ({ ...f, stage: e.target.value }))}>
              <option value="">All Stages</option>
              {STAGES.map((s) => <option key={s}>{s}</option>)}
            </select>
            {(filters.priority || filters.stage || search) && (
              <button className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 8, fontSize: 12 }}
                onClick={() => { setFilters({ priority: "", stage: "" }); setSearch(""); }}>
                Clear
              </button>
            )}
            {/* View toggle pinned to right */}
            <div style={{ marginLeft: "auto", display: "flex", gap: 2, background: "#f3f4f6", borderRadius: 8, padding: 3 }}>
              <button
                onClick={() => setView("kanban")} title="Kanban view"
                style={{ border: "none", borderRadius: 6, background: view === "kanban" ? "#6366f1" : "transparent", color: view === "kanban" ? "#fff" : "#6b7280", padding: "5px 9px", cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center" }}
              ><MdViewKanban size={16} /></button>
              <button
                onClick={() => setView("table")} title="Table view"
                style={{ border: "none", borderRadius: 6, background: view === "table" ? "#6366f1" : "transparent", color: view === "table" ? "#fff" : "#6b7280", padding: "5px 9px", cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center" }}
              ><MdTableRows size={16} /></button>
            </div>
          </div>
        </div>

        {/* Kanban View */}
        {view === "kanban" && (
          <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 16, alignItems: "flex-start" }}>
            {STAGES.map((stage) => {
              const stageDeals = dealsByStage(stage);
              const sc         = STAGE_COLORS[stage];
              const stageTotal = stageDeals.reduce((s, d) => s + parseFloat(d.value || 0), 0);
              return (
                <div key={stage} style={{ minWidth: 270, flex: "0 0 270px" }}>
                  {/* Column header */}
                  <div style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 12, color: sc.text, textTransform: "uppercase", letterSpacing: "0.5px" }}>{stage}</span>
                      <span style={{ background: sc.border, color: "#fff", borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "1px 8px" }}>{stageDeals.length}</span>
                    </div>
                    {stageTotal > 0 && (
                      <div style={{ fontSize: 11, color: sc.text, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>
                        <MdTrendingUp size={11} /> {formatCurrency(stageTotal)}
                      </div>
                    )}
                  </div>

                  {/* Cards */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {stageDeals.length === 0 ? (
                      <div style={{ background: "#f8fafc", borderRadius: 10, padding: "24px 14px", textAlign: "center", color: "#d1d5db", fontSize: 12, border: "1px dashed #e5e7eb" }}>
                        <MdTrendingUp size={20} style={{ display: "block", margin: "0 auto 6px" }} />
                        No deals
                      </div>
                    ) : stageDeals.map((deal) => {
                      const days = deal.expected_close_date
                        ? Math.ceil((new Date(deal.expected_close_date) - new Date()) / 86400000)
                        : null;
                      return (
                        <div
                          key={deal.id}
                          onClick={() => navigate(`/crm/deals/${deal.id}`)}
                          style={{ background: "#fff", borderRadius: 10, padding: "12px 14px", border: "1px solid #e5e7eb", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", transition: "all 0.15s" }}
                          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 16px rgba(99,102,241,0.12)"; e.currentTarget.style.borderColor = "#c7d2fe"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)"; e.currentTarget.style.borderColor = "#e5e7eb"; }}
                        >
                          {/* Title + Priority */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginBottom: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 13, color: "#111", lineHeight: 1.3 }}>{deal.title}</span>
                            <span style={{ background: PRIORITY_COLORS[deal.priority]?.bg, color: PRIORITY_COLORS[deal.priority]?.color, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999, whiteSpace: "nowrap", flexShrink: 0, textTransform: "uppercase" }}>
                              {deal.priority}
                            </span>
                          </div>

                          {/* Client with avatar */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                            <ClientAvatar name={deal.client?.name} />
                            <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{deal.client?.name}</span>
                          </div>

                          {/* Value */}
                          {deal.value && (
                            <div style={{ fontSize: 14, fontWeight: 800, color: "#10b981", marginBottom: 6 }}>
                              {formatCurrency(parseFloat(deal.value))}
                            </div>
                          )}

                          {/* Footer row: category + close date */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                            {deal.category ? (
                              <span style={{ background: "#eff6ff", color: "#1d4ed8", fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 999 }}>{deal.category}</span>
                            ) : <span />}
                            <CloseBadge dateStr={deal.expected_close_date} formatDate={formatDate} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Table View */}
        {view === "table" && (
          <div className="card shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-body p-0">
              {deals.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <MdTrendingUp size={36} style={{ opacity: 0.2, display: "block", margin: "0 auto 8px" }} />
                  No deals found.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: 13 }}>
                    <thead style={{ background: "#f8fafc" }}>
                      <tr>
                        {["Title", "Client", "Stage", "Priority", "Category", "Value", "Close Date", "Days Left", "Status"].map((h) => (
                          <th key={h} style={{ padding: "11px 14px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {deals.map((deal) => {
                        const days  = deal.expected_close_date ? Math.ceil((new Date(deal.expected_close_date) - new Date()) / 86400000) : null;
                        const dColor = days === null ? "#9ca3af" : days < 0 ? "#ef4444" : days <= 7 ? "#f97316" : days <= 30 ? "#f59e0b" : "#10b981";
                        return (
                          <tr key={deal.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/crm/deals/${deal.id}`)}>
                            <td style={{ padding: "10px 14px", fontWeight: 600 }}>{deal.title}</td>
                            <td style={{ padding: "10px 14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                <ClientAvatar name={deal.client?.name} />
                                <span style={{ color: "#374151" }}>{deal.client?.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              <span style={{ background: STAGE_COLORS[deal.stage]?.bg, color: STAGE_COLORS[deal.stage]?.text, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>{deal.stage}</span>
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              <span style={{ background: PRIORITY_COLORS[deal.priority]?.bg, color: PRIORITY_COLORS[deal.priority]?.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>{deal.priority}</span>
                            </td>
                            <td style={{ padding: "10px 14px", color: "#6b7280" }}>{deal.category || "—"}</td>
                            <td style={{ padding: "10px 14px", fontWeight: 700, color: "#10b981" }}>
                              {deal.value ? formatCurrency(parseFloat(deal.value)) : "—"}
                            </td>
                            <td style={{ padding: "10px 14px", color: "#6b7280" }}>{deal.expected_close_date ? formatDate(deal.expected_close_date) : "—"}</td>
                            <td style={{ padding: "10px 14px" }}>
                              {days !== null ? (
                                <span style={{ fontSize: 12, fontWeight: 700, color: dColor }}>
                                  {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `${days}d`}
                                </span>
                              ) : <span style={{ color: "#9ca3af" }}>—</span>}
                            </td>
                            <td style={{ padding: "10px 14px", color: "#6b7280" }}>{deal.project_status || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateDealModal
          onHide={() => setShowCreate(false)}
          onSuccess={() => {
            qc.invalidateQueries(["crm_deals"]);
            qc.invalidateQueries(["crm_pipeline"]);
            setShowCreate(false);
          }}
        />
      )}
    </Layout>
  );
}

// ── Create Deal Modal ─────────────────────────────────────────────────────────
function CreateDealModal({ onHide, onSuccess }) {
  const { settings } = useSettings();
  const currency     = settings?.currency || "PGK";

  const [form, setForm] = useState({
    title: "", client_id: "", service_id: "", category: "",
    priority: "Medium", stage: "Lead", value: "",
    expected_close_date: "", description: "", project_status: "Active",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const { data: clients = [] } = useQuery({
    queryKey: ["crm_clients_all"],
    queryFn:  () => baseApi.get("/api/crm/clients?per_page=200").then((r) => r.data.data || []),
    staleTime: 5 * 60 * 1000,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["crm_services"],
    queryFn:  () => baseApi.get("/api/crm/services").then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  });

  const field = (key) => ({
    value: form[key],
    onChange: (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setErrors((er) => ({ ...er, [key]: undefined })); },
  });

  const handleSubmit = async () => {
    const errs = {};
    if (!form.title)     errs.title     = "Required";
    if (!form.client_id) errs.client_id = "Required";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      await baseApi.post("/api/crm/deals", form);
      onSuccess();
      Swal.fire({ icon: "success", title: "Deal Created!", text: `${form.title} has been added.`, confirmButtonColor: "#3b82f6", timer: 2000, showConfirmButton: false });
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      Swal.fire({ icon: "error", title: "Failed", text: err.response?.data?.message || "Failed to create deal.", confirmButtonColor: "#3b82f6" });
    } finally { setSaving(false); }
  };

  const lbl = (text, required) => (
    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>
      {text} {required && <span className="text-danger">*</span>}
    </label>
  );

  return (
    <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content" style={{ borderRadius: 16 }}>
          <div className="modal-header" style={{ borderBottom: "1px solid #e5e7eb" }}>
            <h5 className="modal-title fw-bold">New Deal</h5>
            <button className="btn-close" onClick={onHide} />
          </div>
          <div className="modal-body px-4 py-3">
            <div className="row g-3">
              <div className="col-12">
                {lbl("Title", true)}
                <input type="text" className={`form-control ${errors.title ? "is-invalid" : ""}`} style={{ borderRadius: 8, fontSize: 13 }} placeholder="e.g. Internet Service for ACME Corp" {...field("title")} />
                {errors.title && <div className="invalid-feedback">{errors.title}</div>}
              </div>
              <div className="col-12 col-md-6">
                {lbl("Client", true)}
                <select className={`form-select ${errors.client_id ? "is-invalid" : ""}`} style={{ borderRadius: 8, fontSize: 13 }} {...field("client_id")}>
                  <option value="">Select client…</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.client_id && <div className="invalid-feedback">{errors.client_id}</div>}
              </div>
              <div className="col-12 col-md-6">
                {lbl("Service")}
                <select className="form-select" style={{ borderRadius: 8, fontSize: 13 }} {...field("service_id")}>
                  <option value="">Select service…</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="col-12 col-md-4">
                {lbl("Priority")}
                <select className="form-select" style={{ borderRadius: 8, fontSize: 13 }} {...field("priority")}>
                  <option>Low</option><option>Medium</option><option>High</option>
                </select>
              </div>
              <div className="col-12 col-md-4">
                {lbl("Stage")}
                <select className="form-select" style={{ borderRadius: 8, fontSize: 13 }} {...field("stage")}>
                  {STAGES.slice(0, 4).map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-12 col-md-4">
                {lbl("Category")}
                <input type="text" className="form-control" style={{ borderRadius: 8, fontSize: 13 }} placeholder="e.g. ISP, IT, Telecom…" {...field("category")} />
              </div>
              <div className="col-12 col-md-6">
                {lbl(`Deal Value (${currency})`)}
                <input type="number" min="0" step="0.01" className="form-control" style={{ borderRadius: 8, fontSize: 13 }} placeholder="0.00" {...field("value")} />
              </div>
              <div className="col-12 col-md-6">
                {lbl("Expected Close Date")}
                <input type="date" className="form-control" style={{ borderRadius: 8, fontSize: 13 }} {...field("expected_close_date")} />
              </div>
              <div className="col-12 col-md-6">
                {lbl("Project Status")}
                <select className="form-select" style={{ borderRadius: 8, fontSize: 13 }} {...field("project_status")}>
                  <option>Active</option><option>On Hold</option><option>Completed</option><option>Cancelled</option>
                </select>
              </div>
              <div className="col-12">
                {lbl("Description")}
                <textarea className="form-control" rows={3} style={{ borderRadius: 8, fontSize: 13 }} placeholder="Brief description of this deal…" {...field("description")} />
              </div>
            </div>
          </div>
          <div className="modal-footer" style={{ borderTop: "1px solid #e5e7eb", gap: 8 }}>
            <button className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={onHide}>Cancel</button>
            <button
              className="btn btn-sm d-flex align-items-center gap-1"
              style={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: 8, fontWeight: 600, padding: "7px 16px" }}
              disabled={saving} onClick={handleSubmit}
            >
              {saving ? "Creating…" : "Create Deal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}