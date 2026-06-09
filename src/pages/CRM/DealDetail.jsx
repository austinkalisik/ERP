import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { useSettings } from "../../contexts/SettingsContext";
import Swal from "sweetalert2";
import {
  MdArrowBack, MdEdit, MdSave, MdClose, MdUploadFile,
  MdDelete, MdDescription, MdAttachMoney, MdOpenInNew,
  MdCheckCircle, MdTrendingUp,
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
const PROJECT_STATUS_COLORS = {
  "Active":    { bg: "#dcfce7", color: "#15803d" },
  "On Hold":   { bg: "#fef3c7", color: "#92400e" },
  "Completed": { bg: "#ede9fe", color: "#5b21b6" },
  "Cancelled": { bg: "#fee2e2", color: "#991b1b" },
};
const INVOICE_STATUS_COLORS = {
  Draft:     { bg: "#f3f4f6", color: "#374151" },
  Sent:      { bg: "#eff6ff", color: "#1d4ed8" },
  Paid:      { bg: "#f0fdf4", color: "#15803d" },
  Overdue:   { bg: "#fef2f2", color: "#dc2626" },
  Cancelled: { bg: "#f3f4f6", color: "#6b7280" },
};
const DOC_TYPES = ["Contract", "SLA", "Proposal", "Invoice", "NDA", "Other"];

// Client initials avatar
function ClientAvatar({ name, size = 36 }) {
  const initials = (name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const colors   = ["#6366f1","#10b981","#f59e0b","#3b82f6","#8b5cf6","#ec4899"];
  const color    = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", backgroundColor: color + "22", border: `2px solid ${color}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: size * 0.35, fontWeight: 800, color }}>{initials}</span>
    </div>
  );
}

export default function DealDetail() {
  const { id }                                      = useParams();
  const navigate                                    = useNavigate();
  const qc                                          = useQueryClient();
  const { formatCurrency, formatDate, settings }    = useSettings();
  const currency                                    = settings?.currency || "PGK";

  const [tab,         setTab]         = useState("overview");
  const [editing,     setEditing]     = useState(false);
  const [form,        setForm]        = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [showUpload,  setShowUpload]  = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  const { data: deal, isLoading } = useQuery({
    queryKey:  ["crm_deal", id],
    queryFn:   () => baseApi.get(`/api/crm/deals/${id}`).then((r) => r.data),
    onSuccess: (d) => { if (!form) setForm({ ...d }); },
  });

  const refresh = () => qc.invalidateQueries(["crm_deal", id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await baseApi.put(`/api/crm/deals/${id}`, form);
      refresh();
      setEditing(false);
      Swal.fire({ icon: "success", title: "Saved!", text: "Deal updated successfully.", confirmButtonColor: "#3b82f6", timer: 2000, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Save Failed", text: e.response?.data?.message || "Failed to update deal.", confirmButtonColor: "#3b82f6" });
    } finally { setSaving(false); }
  };

  const handleStageChange = async (stage) => {
    // Confirm if moving to Closed Lost
    if (stage === "Closed Lost") {
      const result = await Swal.fire({
        title: "Mark as Closed Lost?",
        text: "This deal will be marked as lost. You can reopen it anytime by changing the stage.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, close as lost",
      });
      if (!result.isConfirmed) return;
    }
    try {
      await baseApi.put(`/api/crm/deals/${id}`, { stage });
      refresh();
      Swal.fire({ icon: "success", title: "Stage Updated", text: `Moved to ${stage}.`, confirmButtonColor: "#3b82f6", timer: 1500, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Failed", text: e.response?.data?.message || "Failed to update stage.", confirmButtonColor: "#3b82f6" });
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete Deal?",
      text: `This will permanently delete "${deal.title}" and all its documents and invoices.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });
    if (!result.isConfirmed) return;
    try {
      await baseApi.delete(`/api/crm/deals/${id}`);
      qc.invalidateQueries(["crm_deals"]);
      qc.invalidateQueries(["crm_pipeline"]);
      Swal.fire({ icon: "success", title: "Deleted", text: "Deal has been deleted.", confirmButtonColor: "#3b82f6", timer: 2000, showConfirmButton: false })
        .then(() => navigate("/crm/deals"));
    } catch (e) {
      Swal.fire({ icon: "error", title: "Failed", text: "Failed to delete deal.", confirmButtonColor: "#3b82f6" });
    }
  };

  const handleDeleteDoc = async (docId) => {
    const result = await Swal.fire({
      title: "Delete Document?", text: "This file will be permanently deleted.",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#dc2626", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, delete",
    });
    if (!result.isConfirmed) return;
    try {
      await baseApi.delete(`/api/crm/deals/${id}/documents/${docId}`);
      refresh();
      Swal.fire({ icon: "success", title: "Deleted", text: "Document removed.", confirmButtonColor: "#3b82f6", timer: 2000, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Failed", text: "Failed to delete document.", confirmButtonColor: "#3b82f6" });
    }
  };

  const handleDeleteInvoice = async (invId) => {
    const result = await Swal.fire({
      title: "Delete Invoice?", text: "This invoice record will be permanently deleted.",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#dc2626", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, delete",
    });
    if (!result.isConfirmed) return;
    try {
      await baseApi.delete(`/api/crm/deals/${id}/invoices/${invId}`);
      refresh();
      Swal.fire({ icon: "success", title: "Deleted", text: "Invoice removed.", confirmButtonColor: "#3b82f6", timer: 2000, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Failed", text: "Failed to delete invoice.", confirmButtonColor: "#3b82f6" });
    }
  };

  if (isLoading) return <Layout><div className="text-center py-5"><div className="spinner-border text-primary" /></div></Layout>;
  if (!deal)     return <Layout><div className="text-center py-5 text-muted">Deal not found.</div></Layout>;

  const sc  = STAGE_COLORS[deal.stage]    || {};
  const pc  = PRIORITY_COLORS[deal.priority] || {};
  const psc = PROJECT_STATUS_COLORS[deal.project_status] || { bg: "#f3f4f6", color: "#374151" };

  const currentStageIdx = STAGES.indexOf(deal.stage);
  const daysLeft        = deal.expected_close_date
    ? Math.ceil((new Date(deal.expected_close_date) - new Date()) / 86400000)
    : null;

  const totalInvoiced = (deal.invoices || []).reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  const totalPaid     = (deal.invoices || []).filter((i) => i.status === "Paid").reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  const paidPct       = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

  const lbl = (text) => (
    <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", margin: "0 0 3px 0", letterSpacing: "0.4px" }}>{text}</p>
  );

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">

        {/* ── Header ── */}
        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ borderRadius: 8 }} onClick={() => navigate(-1)}>
            <MdArrowBack size={16} /> Back
          </button>
          <div className="d-flex gap-2 flex-wrap">
            {!editing ? (
              <>
                <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" style={{ borderRadius: 8 }} onClick={() => { setForm({ ...deal }); setEditing(true); }}>
                  <MdEdit size={15} /> Edit
                </button>
                <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" style={{ borderRadius: 8 }} onClick={handleDelete}>
                  <MdDelete size={15} /> Delete
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ borderRadius: 8 }} onClick={() => setEditing(false)}>
                  <MdClose size={15} /> Cancel
                </button>
                <button
                  className="btn btn-sm d-flex align-items-center gap-1"
                  style={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: 8, fontWeight: 600 }}
                  disabled={saving} onClick={handleSave}
                >
                  <MdSave size={15} /> {saving ? "Saving…" : "Save"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Deal Hero Card ── */}
        <div className="card shadow-sm mb-4" style={{ borderRadius: 14, border: `1px solid ${sc.border || "#e5e7eb"}` }}>
          <div className="card-body p-4">
            <div className="d-flex align-items-start gap-3 flex-wrap">
              <ClientAvatar name={deal.client?.name} size={48} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                  <h2 style={{ fontWeight: 800, fontSize: "clamp(16px,4vw,22px)", margin: 0, color: "#111" }}>{deal.title}</h2>
                  <span style={{ background: pc.bg, color: pc.color, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 999, textTransform: "uppercase" }}>{deal.priority}</span>
                  <span style={{ background: sc.bg, color: sc.text, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>{deal.stage}</span>
                  {deal.project_status && (
                    <span style={{ background: psc.bg, color: psc.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>{deal.project_status}</span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                  {deal.client?.name}
                  {deal.service?.name && <> · {deal.service.name}</>}
                  {deal.category && <> · <span style={{ color: "#1d4ed8" }}>{deal.category}</span></>}
                </p>
              </div>
              {deal.value && (
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#10b981" }}>{formatCurrency(parseFloat(deal.value))}</div>
                  {daysLeft !== null && (
                    <div style={{ fontSize: 12, fontWeight: 600, color: daysLeft < 0 ? "#ef4444" : daysLeft <= 7 ? "#f97316" : daysLeft <= 30 ? "#f59e0b" : "#6b7280" }}>
                      {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "Due today" : `${daysLeft}d until close`}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Pipeline Stage Progress ── */}
        <div className="card shadow-sm mb-4" style={{ borderRadius: 12 }}>
          <div className="card-body p-3">
            <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 12px 0" }}>Pipeline Stage</p>
            <div style={{ display: "flex", gap: 0, position: "relative" }}>
              {STAGES.map((stage, i) => {
                const isCurrent = deal.stage === stage;
                const isPast    = currentStageIdx > i;
                const isLost    = stage === "Closed Lost";
                const sc2       = STAGE_COLORS[stage];
                return (
                  <button
                    key={stage}
                    onClick={() => handleStageChange(stage)}
                    title={`Move to ${stage}`}
                    style={{
                      flex: 1,
                      padding: "8px 4px",
                      border: "none",
                      borderTop: `3px solid ${isCurrent ? sc2.border : isPast ? sc2.border + "88" : "#e5e7eb"}`,
                      background: isCurrent ? sc2.bg : isPast ? sc2.bg + "66" : "#f9fafb",
                      color: isCurrent ? sc2.text : isPast ? sc2.text + "99" : "#9ca3af",
                      fontSize: 11,
                      fontWeight: isCurrent ? 800 : 600,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 3,
                      minWidth: 0,
                    }}
                    onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = sc2.bg; }}
                    onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.background = isPast ? sc2.bg + "66" : "#f9fafb"; }}
                  >
                    {isCurrent && <MdCheckCircle size={13} />}
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", padding: "0 2px" }}>
                      {i + 1}. {stage}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Tabs + Action Button ── */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div style={{ display: "flex", gap: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            {[
              { key: "overview",  label: "Overview",                          icon: "📋" },
              { key: "documents", label: `Documents (${deal.documents?.length ?? 0})`, icon: "📄" },
              { key: "invoices",  label: `Invoices (${deal.invoices?.length ?? 0})`,   icon: "💰" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: "8px 18px", border: "none", borderRadius: 9, fontSize: 13,
                  fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                  backgroundColor: tab === t.key ? "#6366f1" : "transparent",
                  color: tab === t.key ? "#fff" : "#6b7280",
                  boxShadow: tab === t.key ? "0 2px 8px rgba(99,102,241,0.3)" : "none",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                <span style={{ fontSize: 14 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Action button for active tab */}
          {tab === "documents" && (
            <button
              className="btn btn-sm d-flex align-items-center gap-1"
              style={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: 8, fontWeight: 600, padding: "8px 14px" }}
              onClick={() => setShowUpload(true)}
            >
              <MdUploadFile size={15} /> Upload Document
            </button>
          )}
          {tab === "invoices" && (
            <button
              className="btn btn-sm d-flex align-items-center gap-1"
              style={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: 8, fontWeight: 600, padding: "8px 14px" }}
              onClick={() => setShowInvoice(true)}
            >
              <MdAttachMoney size={15} /> Add Invoice
            </button>
          )}
        </div>

        {/* ── Overview Tab ── */}
        {tab === "overview" && (
          <div className="row g-3">
            {/* Left: Deal Info */}
            <div className="col-12 col-lg-8">
              <div className="card shadow-sm" style={{ borderRadius: 12 }}>
                <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-bold" style={{ fontSize: 14 }}>Deal Information</h6>
                </div>
                <div className="card-body p-4">
                  {editing && form ? (
                    <div className="row g-3">
                      <div className="col-12">
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Title</label>
                        <input type="text" className="form-control" style={{ borderRadius: 8, fontSize: 13 }} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                      </div>
                      <div className="col-12 col-md-6">
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Priority</label>
                        <select className="form-select" style={{ borderRadius: 8, fontSize: 13 }} value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                          <option>Low</option><option>Medium</option><option>High</option>
                        </select>
                      </div>
                      <div className="col-12 col-md-6">
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Category</label>
                        <input type="text" className="form-control" style={{ borderRadius: 8, fontSize: 13 }} value={form.category || ""} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
                      </div>
                      <div className="col-12 col-md-6">
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Deal Value ({currency})</label>
                        <input type="number" className="form-control" style={{ borderRadius: 8, fontSize: 13 }} value={form.value || ""} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} />
                      </div>
                      <div className="col-12 col-md-6">
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Expected Close Date</label>
                        <input type="date" className="form-control" style={{ borderRadius: 8, fontSize: 13 }} value={form.expected_close_date || ""} onChange={(e) => setForm((f) => ({ ...f, expected_close_date: e.target.value }))} />
                      </div>
                      <div className="col-12 col-md-6">
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Project Status</label>
                        <select className="form-select" style={{ borderRadius: 8, fontSize: 13 }} value={form.project_status || ""} onChange={(e) => setForm((f) => ({ ...f, project_status: e.target.value }))}>
                          <option>Active</option><option>On Hold</option><option>Completed</option><option>Cancelled</option>
                        </select>
                      </div>
                      <div className="col-12">
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Description</label>
                        <textarea className="form-control" rows={3} style={{ borderRadius: 8, fontSize: 13 }} value={form.description || ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                      </div>
                      <div className="col-12">
                        <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Notes</label>
                        <textarea className="form-control" rows={3} style={{ borderRadius: 8, fontSize: 13 }} value={form.notes || ""} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
                      </div>
                    </div>
                  ) : (
                    <div className="row g-4">
                      {[
                        { label: "Client",         value: deal.client?.name },
                        { label: "Service",        value: deal.service?.name || "—" },
                        { label: "Category",       value: deal.category || "—" },
                        { label: "Priority",       value: deal.priority },
                        { label: "Deal Value",     value: deal.value ? formatCurrency(parseFloat(deal.value)) : "—" },
                        { label: "Expected Close", value: deal.expected_close_date ? formatDate(deal.expected_close_date) : "—" },
                        { label: "Actual Close",   value: deal.actual_close_date  ? formatDate(deal.actual_close_date)  : "—" },
                        { label: "Project Status", value: deal.project_status || "—" },
                      ].map((row) => (
                        <div key={row.label} className="col-12 col-md-6">
                          {lbl(row.label)}
                          <p style={{ fontSize: 14, fontWeight: 600, color: "#111", margin: 0 }}>{row.value}</p>
                        </div>
                      ))}
                      {deal.description && (
                        <div className="col-12">
                          {lbl("Description")}
                          <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.6 }}>{deal.description}</p>
                        </div>
                      )}
                      {deal.notes && (
                        <div className="col-12">
                          {lbl("Notes")}
                          <p style={{ fontSize: 13, color: "#374151", margin: 0, lineHeight: 1.6 }}>{deal.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Stats sidebar */}
            <div className="col-12 col-lg-4">
              <div className="card shadow-sm mb-3" style={{ borderRadius: 12 }}>
                <div className="card-header bg-white border-bottom p-3">
                  <h6 className="mb-0 fw-bold" style={{ fontSize: 14 }}>Summary</h6>
                </div>
                <div className="card-body p-3">
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <span style={{ fontSize: 13, color: "#6b7280" }}>Documents</span>
                      <span style={{ fontSize: 13, fontWeight: 700, backgroundColor: "#ede9fe", color: "#6366f1", padding: "2px 10px", borderRadius: 999 }}>{deal.documents?.length ?? 0}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span style={{ fontSize: 13, color: "#6b7280" }}>Invoices</span>
                      <span style={{ fontSize: 13, fontWeight: 700, backgroundColor: "#ede9fe", color: "#6366f1", padding: "2px 10px", borderRadius: 999 }}>{deal.invoices?.length ?? 0}</span>
                    </div>
                    <hr style={{ margin: "4px 0", borderColor: "#f3f4f6" }} />
                    <div className="d-flex justify-content-between align-items-center">
                      <span style={{ fontSize: 13, color: "#6b7280" }}>Total Invoiced</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{formatCurrency(totalInvoiced)}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span style={{ fontSize: 13, color: "#6b7280" }}>Paid</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>{formatCurrency(totalPaid)}</span>
                    </div>
                    {/* Payment progress bar */}
                    {totalInvoiced > 0 && (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: "#9ca3af" }}>Collection Progress</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981" }}>{paidPct}%</span>
                        </div>
                        <div style={{ height: 6, background: "#f3f4f6", borderRadius: 99 }}>
                          <div style={{ height: 6, width: `${paidPct}%`, background: "#10b981", borderRadius: 99, transition: "width 0.4s" }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Close date card */}
              {deal.expected_close_date && (
                <div className="card shadow-sm" style={{ borderRadius: 12, borderLeft: `4px solid ${daysLeft < 0 ? "#ef4444" : daysLeft <= 7 ? "#f97316" : daysLeft <= 30 ? "#f59e0b" : "#10b981"}` }}>
                  <div className="card-body p-3">
                    {lbl("Expected Close")}
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: "0 0 2px" }}>{formatDate(deal.expected_close_date)}</p>
                    <p style={{ fontSize: 12, fontWeight: 600, margin: 0, color: daysLeft < 0 ? "#ef4444" : daysLeft <= 7 ? "#f97316" : daysLeft <= 30 ? "#f59e0b" : "#10b981" }}>
                      {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : daysLeft === 0 ? "Due today" : `${daysLeft} days remaining`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Documents Tab ── */}
        {tab === "documents" && (
          <div className="card shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom p-3">
              <h6 className="mb-0 fw-bold" style={{ fontSize: 14 }}>Documents</h6>
            </div>
            <div className="card-body p-0">
              {!deal.documents?.length ? (
                <div className="text-center py-5">
                  <MdDescription size={40} style={{ color: "#d1d5db", display: "block", margin: "0 auto 8px" }} />
                  <p className="text-muted mb-1" style={{ fontSize: 14 }}>No documents uploaded yet</p>
                  <button className="btn btn-sm mt-1" style={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: 8 }} onClick={() => setShowUpload(true)}>
                    Upload First Document
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: 13 }}>
                    <thead style={{ background: "#f8fafc" }}>
                      <tr>
                        {["Name", "Type", "Size", "Uploaded By", "Date", ""].map((h) => (
                          <th key={h} style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {deal.documents.map((doc) => (
                        <tr key={doc.id}>
                          <td style={{ padding: "10px 14px", fontWeight: 600 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <MdDescription size={16} color="#6366f1" />
                              </div>
                              {doc.name}
                            </div>
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            <span style={{ background: "#eff6ff", color: "#1d4ed8", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999 }}>{doc.type}</span>
                          </td>
                          <td style={{ padding: "10px 14px", color: "#6b7280" }}>
                            {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : "—"}
                          </td>
                          <td style={{ padding: "10px 14px", color: "#6b7280" }}>{doc.uploader?.name || "—"}</td>
                          <td style={{ padding: "10px 14px", color: "#6b7280" }}>{doc.created_at ? formatDate(doc.created_at) : "—"}</td>
                          <td style={{ padding: "10px 14px" }}>
                            <div className="d-flex gap-2">
                              <a href={`${import.meta.env.VITE_API_URL}/api/crm/deals/${id}/documents/${doc.id}/download`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary" style={{ borderRadius: 6 }} title="Open">
                                <MdOpenInNew size={14} />
                              </a>
                              <button className="btn btn-sm btn-outline-danger" style={{ borderRadius: 6 }} onClick={() => handleDeleteDoc(doc.id)} title="Delete">
                                <MdDelete size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Invoices Tab ── */}
        {tab === "invoices" && (
          <div className="card shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom p-3">
              <div>
                <h6 className="mb-0 fw-bold" style={{ fontSize: 14 }}>Invoice History</h6>
                {totalInvoiced > 0 && (
                  <p className="text-muted mb-0" style={{ fontSize: 12 }}>
                    {formatCurrency(totalPaid)} of {formatCurrency(totalInvoiced)} collected ({paidPct}%)
                  </p>
                )}
              </div>
            </div>
            <div className="card-body p-0">
              {!deal.invoices?.length ? (
                <div className="text-center py-5">
                  <MdAttachMoney size={40} style={{ color: "#d1d5db", display: "block", margin: "0 auto 8px" }} />
                  <p className="text-muted mb-1" style={{ fontSize: 14 }}>No invoices recorded yet</p>
                  <button className="btn btn-sm mt-1" style={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: 8 }} onClick={() => setShowInvoice(true)}>
                    Add First Invoice
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: 13 }}>
                    <thead style={{ background: "#f8fafc" }}>
                      <tr>
                        {["Invoice #", "Amount", "Status", "Issued", "Due", "Paid", "Recorded By", ""].map((h) => (
                          <th key={h} style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {deal.invoices.map((inv) => {
                        const isc = INVOICE_STATUS_COLORS[inv.status] || {};
                        return (
                          <tr key={inv.id}>
                            <td style={{ padding: "10px 14px", fontWeight: 700, color: "#6366f1" }}>{inv.invoice_number}</td>
                            <td style={{ padding: "10px 14px", fontWeight: 700 }}>{formatCurrency(parseFloat(inv.amount))}</td>
                            <td style={{ padding: "10px 14px" }}>
                              <span style={{ background: isc.bg, color: isc.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>{inv.status}</span>
                            </td>
                            <td style={{ padding: "10px 14px", color: "#6b7280" }}>{inv.issue_date ? formatDate(inv.issue_date) : "—"}</td>
                            <td style={{ padding: "10px 14px", color: "#6b7280" }}>{inv.due_date ? formatDate(inv.due_date) : "—"}</td>
                            <td style={{ padding: "10px 14px", color: inv.paid_date ? "#16a34a" : "#6b7280" }}>{inv.paid_date ? formatDate(inv.paid_date) : "—"}</td>
                            <td style={{ padding: "10px 14px", color: "#6b7280" }}>{inv.recorder?.name || "—"}</td>
                            <td style={{ padding: "10px 14px" }}>
                              <button className="btn btn-sm btn-outline-danger" style={{ borderRadius: 6 }} onClick={() => handleDeleteInvoice(inv.id)}>
                                <MdDelete size={14} />
                              </button>
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
        )}
      </div>

      {showUpload  && <UploadDocModal  dealId={id} onHide={() => setShowUpload(false)}  onSuccess={() => { refresh(); setShowUpload(false);  }} />}
      {showInvoice && <AddInvoiceModal dealId={id} onHide={() => setShowInvoice(false)} onSuccess={() => { refresh(); setShowInvoice(false); }} currency={currency} />}
    </Layout>
  );
}

// ── Upload Document Modal ─────────────────────────────────────────────────────
function UploadDocModal({ dealId, onHide, onSuccess }) {
  const [file,   setFile]   = useState(null);
  const [name,   setName]   = useState("");
  const [type,   setType]   = useState("Contract");
  const [notes,  setNotes]  = useState("");
  const [saving, setSaving] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("file",  file);
      fd.append("name",  name || file.name);
      fd.append("type",  type);
      fd.append("notes", notes);
      await baseApi.post(`/api/crm/deals/${dealId}/documents`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      onSuccess();
      Swal.fire({ icon: "success", title: "Uploaded!", text: "Document saved successfully.", confirmButtonColor: "#3b82f6", timer: 2000, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Upload Failed", text: e.response?.data?.message || "Failed to upload document.", confirmButtonColor: "#3b82f6" });
    } finally { setSaving(false); }
  };

  return (
    <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ borderRadius: 16 }}>
          <div className="modal-header" style={{ borderBottom: "1px solid #e5e7eb" }}>
            <h5 className="modal-title fw-bold">Upload Document</h5>
            <button className="btn-close" onClick={onHide} />
          </div>
          <div className="modal-body px-4">
            <div className="row g-3">
              <div className="col-12">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>File <span className="text-danger">*</span></label>
                <input type="file" className="form-control" style={{ borderRadius: 8, fontSize: 13 }}
                  onChange={(e) => { setFile(e.target.files[0]); if (!name) setName(e.target.files[0]?.name || ""); }} />
              </div>
              <div className="col-12">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Document Name</label>
                <input type="text" className="form-control" style={{ borderRadius: 8, fontSize: 13 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Service Agreement 2026" />
              </div>
              <div className="col-12">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Document Type</label>
                <select className="form-select" style={{ borderRadius: 8, fontSize: 13 }} value={type} onChange={(e) => setType(e.target.value)}>
                  {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-12">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Notes</label>
                <textarea className="form-control" rows={2} style={{ borderRadius: 8, fontSize: 13 }} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="modal-footer" style={{ borderTop: "1px solid #e5e7eb", gap: 8 }}>
            <button className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={onHide}>Cancel</button>
            <button className="btn btn-sm" style={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: 8, fontWeight: 600 }} disabled={saving || !file} onClick={handleUpload}>
              {saving ? "Uploading…" : "Upload"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Invoice Modal ─────────────────────────────────────────────────────────
function AddInvoiceModal({ dealId, onHide, onSuccess, currency }) {
  const [form, setForm] = useState({
    invoice_number: "", amount: "", status: "Draft",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: "", paid_date: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleSave = async () => {
    if (!form.invoice_number || !form.amount) return;
    setSaving(true);
    try {
      await baseApi.post(`/api/crm/deals/${dealId}/invoices`, form);
      onSuccess();
      Swal.fire({ icon: "success", title: "Invoice Added!", text: `Invoice ${form.invoice_number} saved.`, confirmButtonColor: "#3b82f6", timer: 2000, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Failed", text: e.response?.data?.message || "Failed to save invoice.", confirmButtonColor: "#3b82f6" });
    } finally { setSaving(false); }
  };

  return (
    <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{ borderRadius: 16 }}>
          <div className="modal-header" style={{ borderBottom: "1px solid #e5e7eb" }}>
            <h5 className="modal-title fw-bold">Add Invoice</h5>
            <button className="btn-close" onClick={onHide} />
          </div>
          <div className="modal-body px-4">
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Invoice # <span className="text-danger">*</span></label>
                <input type="text" className="form-control" style={{ borderRadius: 8, fontSize: 13 }} placeholder="INV-0001" {...field("invoice_number")} />
              </div>
              <div className="col-12 col-md-6">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Amount ({currency}) <span className="text-danger">*</span></label>
                <input type="number" min="0" step="0.01" className="form-control" style={{ borderRadius: 8, fontSize: 13 }} placeholder="0.00" {...field("amount")} />
              </div>
              <div className="col-12 col-md-6">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Status</label>
                <select className="form-select" style={{ borderRadius: 8, fontSize: 13 }} {...field("status")}>
                  {["Draft", "Sent", "Paid", "Overdue", "Cancelled"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-12 col-md-6">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Issue Date</label>
                <input type="date" className="form-control" style={{ borderRadius: 8, fontSize: 13 }} {...field("issue_date")} />
              </div>
              <div className="col-12 col-md-6">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Due Date</label>
                <input type="date" className="form-control" style={{ borderRadius: 8, fontSize: 13 }} {...field("due_date")} />
              </div>
              <div className="col-12 col-md-6">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Paid Date</label>
                <input type="date" className="form-control" style={{ borderRadius: 8, fontSize: 13 }} {...field("paid_date")} />
              </div>
              <div className="col-12">
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" }}>Notes</label>
                <textarea className="form-control" rows={2} style={{ borderRadius: 8, fontSize: 13 }} {...field("notes")} />
              </div>
            </div>
          </div>
          <div className="modal-footer" style={{ borderTop: "1px solid #e5e7eb", gap: 8 }}>
            <button className="btn btn-outline-secondary" style={{ borderRadius: 8 }} onClick={onHide}>Cancel</button>
            <button className="btn btn-sm" style={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: 8, fontWeight: 600 }} disabled={saving || !form.invoice_number || !form.amount} onClick={handleSave}>
              {saving ? "Saving…" : "Save Invoice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}