import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import { can } from "../../utils/permissions";
import Swal from "sweetalert2";
import { Modal, Button, Form } from "react-bootstrap";
import {
  MdArrowBack, MdEdit, MdSave, MdAdd, MdClose,
  MdAttachFile, MdDownload, MdDelete, MdWarning,
  MdCreditCard, MdPauseCircle, MdCheckCircle,
} from "react-icons/md";
import { StatusBadge, SERVICE_ICON } from "./CRM";

const fetchSub = (id) => baseApi.get(`/api/crm/subscriptions/${id}`).then((r) => r.data);
const BILLING_CYCLES = ["Monthly", "Quarterly", "Semi-Annual", "Annual"];

export default function SubscriptionView() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const { user, permissions } = useAuth();
  const { formatCurrency }    = useSettings();
  const canManage = can(permissions, "crm.manage") || user?.role === "system_admin";

  const [showPayment,   setShowPayment]   = useState(false);
  const [showInterrupt, setShowInterrupt] = useState(false);
  const [editing,       setEditing]       = useState(false);
  const [form,          setForm]          = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [activeTab,     setActiveTab]     = useState("payments");

  const { data: sub, isLoading } = useQuery({
    queryKey: ["crm_subscription", id],
    queryFn:  () => fetchSub(id),
    onSuccess: (data) => { if (!form) setForm({ ...data }); },
    staleTime: 60 * 1000,
  });

  const { data: servicesData } = useQuery({
    queryKey: ["crm_services"],
    queryFn:  () => baseApi.get("/api/crm/services").then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  });
  const services = servicesData || [];

  const invalidate = () => {
    queryClient.invalidateQueries(["crm_subscription", id]);
    queryClient.invalidateQueries(["crm_stats"]);
    queryClient.invalidateQueries(["crm_expiring"]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await baseApi.put(`/api/crm/subscriptions/${id}`, form);
      invalidate();
      setEditing(false);
      Swal.fire({ icon: "success", title: "Saved!", text: "Subscription updated successfully.", confirmButtonColor: "#3b82f6", timer: 2000, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Save Failed", text: e.response?.data?.message || "Failed to update subscription.", confirmButtonColor: "#3b82f6" });
    } finally { setSaving(false); }
  };

  const handleDeletePayment = async (paymentId) => {
    const result = await Swal.fire({
      title: "Delete Payment?", text: "This payment record will be permanently deleted.",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#dc2626", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, delete",
    });
    if (!result.isConfirmed) return;
    try {
      await baseApi.delete(`/api/crm/payments/${paymentId}`);
      invalidate();
      Swal.fire({ icon: "success", title: "Deleted", text: "Payment record removed.", confirmButtonColor: "#3b82f6", timer: 2000, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Failed", text: e.response?.data?.message || "Failed to delete payment.", confirmButtonColor: "#3b82f6" });
    }
  };

  const handleDeleteInterruption = async (intId) => {
    const result = await Swal.fire({
      title: "Delete Interruption?", text: "This will remove the credited days from the expiry date.",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#dc2626", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, delete",
    });
    if (!result.isConfirmed) return;
    try {
      await baseApi.delete(`/api/crm/interruptions/${intId}`);
      invalidate();
      Swal.fire({ icon: "success", title: "Deleted", text: "Interruption removed.", confirmButtonColor: "#3b82f6", timer: 2000, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Failed", text: e.response?.data?.message || "Failed to delete interruption.", confirmButtonColor: "#3b82f6" });
    }
  };

  const handleDeleteAttachment = async (attachId) => {
    const result = await Swal.fire({
      title: "Delete Attachment?", text: "This file will be permanently deleted.",
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#dc2626", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, delete",
    });
    if (!result.isConfirmed) return;
    try {
      await baseApi.delete(`/api/attachments/${attachId}`);
      invalidate();
      Swal.fire({ icon: "success", title: "Deleted", text: "Attachment removed.", confirmButtonColor: "#3b82f6", timer: 2000, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Failed", text: "Failed to delete attachment.", confirmButtonColor: "#3b82f6" });
    }
  };

  if (isLoading) return <Layout><div className="text-center py-5"><div className="spinner-border spinner-border-sm text-secondary" /></div></Layout>;
  if (!sub) return <Layout><div className="text-center py-5"><p className="text-muted">Subscription not found.</p></div></Layout>;

  const daysLeft      = Math.ceil((new Date(sub.expiry_date) - new Date()) / 86400000);
  const payments      = sub.payments      || [];
  const interruptions = sub.interruptions || [];
  const attachments   = sub.attachments   || [];

  const tabStyle = (tab) => ({
    padding: "8px 16px", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer",
    backgroundColor: activeTab === tab ? "#6366f1" : "transparent",
    color: activeTab === tab ? "#fff" : "#6b7280",
  });

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ borderRadius: "8px" }} onClick={() => navigate(`/crm/clients/${sub.client_id}`)}>
            <MdArrowBack size={16} /> Back to {sub.client_name}
          </button>
          {canManage && !editing && (
            <div className="d-flex gap-2 flex-wrap">
              <button className="btn btn-sm" style={{ backgroundColor: "#10b981", color: "#fff", borderRadius: "8px", fontWeight: "500", display: "flex", alignItems: "center", gap: "5px" }} onClick={() => setShowPayment(true)}>
                <MdCreditCard size={15} /> Record Payment
              </button>
              <button className="btn btn-sm btn-warning d-flex align-items-center gap-1" style={{ borderRadius: "8px", fontWeight: "500" }} onClick={() => setShowInterrupt(true)}>
                <MdPauseCircle size={15} /> Log Interruption
              </button>
              <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" style={{ borderRadius: "8px" }} onClick={() => { setForm({ ...sub }); setEditing(true); }}>
                <MdEdit size={15} /> Edit
              </button>
            </div>
          )}
          {editing && (
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-outline-secondary" style={{ borderRadius: "8px" }} onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-sm d-flex align-items-center gap-1" style={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: "8px" }} disabled={saving} onClick={handleSave}>
                <MdSave size={15} /> {saving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>

        <div className="row g-3">
          {/* Info Card */}
          <div className="col-12 col-lg-4">
            <div className="card shadow-sm mb-3" style={{ borderRadius: "12px" }}>
              <div className="card-header bg-white p-3 border-bottom">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1" }}>
                    {SERVICE_ICON[sub.service_name] || <MdCheckCircle size={20} />}
                  </div>
                  <div>
                    <h6 className="mb-0" style={{ fontWeight: "700" }}>{sub.service_name}</h6>
                    <p className="mb-0 text-muted" style={{ fontSize: "12px" }}>{sub.client_name}</p>
                  </div>
                </div>
              </div>
              <div className="card-body p-3">
                {editing && form ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      { label: "Service",       key: "service_id",    type: "select", options: services.map((s) => ({ value: s.id, label: s.name })) },
                      { label: "Billing Cycle", key: "billing_cycle", type: "select", options: BILLING_CYCLES.map((c) => ({ value: c, label: c })) },
                      { label: "Amount",        key: "amount",        type: "number" },
                      { label: "Start Date",    key: "start_date",    type: "date" },
                      { label: "Expiry Date",   key: "expiry_date",   type: "date" },
                      { label: "Status",        key: "status",        type: "select", options: ["Active","Expiring","Expired","Suspended"].map((s) => ({ value: s, label: s })) },
                    ].map(({ label, key, type, options }) => (
                      <div key={key}>
                        <label style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", marginBottom: "3px", display: "block" }}>{label}</label>
                        {type === "select" ? (
                          <select className="form-select form-select-sm" value={form[key] || ""} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} style={{ borderRadius: "6px" }}>
                            {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        ) : (
                          <input type={type} className="form-control form-control-sm" value={form[key] || ""} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} style={{ borderRadius: "6px" }} />
                        )}
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", marginBottom: "3px", display: "block" }}>Notes</label>
                      <textarea className="form-control form-control-sm" rows={2} value={form.notes || ""} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} style={{ borderRadius: "6px" }} />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div className="d-flex justify-content-between"><span style={{ fontSize: "13px", color: "#6b7280" }}>Status</span><StatusBadge status={sub.status} /></div>
                    <div className="d-flex justify-content-between"><span style={{ fontSize: "13px", color: "#6b7280" }}>Billing</span><span style={{ fontSize: "13px", fontWeight: "600" }}>{sub.billing_cycle}</span></div>
                    <div className="d-flex justify-content-between"><span style={{ fontSize: "13px", color: "#6b7280" }}>Amount</span><span style={{ fontSize: "13px", fontWeight: "700", color: "#6366f1" }}>{formatCurrency(sub.amount)}</span></div>
                    <div className="d-flex justify-content-between"><span style={{ fontSize: "13px", color: "#6b7280" }}>Start</span><span style={{ fontSize: "13px" }}>{new Date(sub.start_date).toLocaleDateString("en-PG", { day: "numeric", month: "short", year: "numeric" })}</span></div>
                    <div className="d-flex justify-content-between"><span style={{ fontSize: "13px", color: "#6b7280" }}>Expiry</span><span style={{ fontSize: "13px", fontWeight: "600", color: daysLeft <= 7 ? "#ef4444" : daysLeft <= 30 ? "#f59e0b" : "#111" }}>{new Date(sub.expiry_date).toLocaleDateString("en-PG", { day: "numeric", month: "short", year: "numeric" })}</span></div>
                    {sub.status !== "Expired" && <div className="d-flex justify-content-between"><span style={{ fontSize: "13px", color: "#6b7280" }}>Days Left</span><span style={{ fontSize: "13px", fontWeight: "700", color: daysLeft <= 7 ? "#ef4444" : daysLeft <= 30 ? "#f59e0b" : "#10b981" }}>{daysLeft}d</span></div>}
                    {sub.credit_days > 0 && <div style={{ backgroundColor: "#e0f2fe", borderRadius: "8px", padding: "8px 10px" }}><p style={{ margin: 0, fontSize: "12px", color: "#0369a1", fontWeight: "600" }}>🕐 Total Credits: +{sub.credit_days} days</p></div>}
                    {sub.notes && <div><p style={{ fontSize: "11px", color: "#9ca3af", margin: 0, textTransform: "uppercase", fontWeight: "600" }}>Notes</p><p style={{ fontSize: "13px", color: "#374151", margin: 0 }}>{sub.notes}</p></div>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="col-12 col-lg-8">
            <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-header bg-white p-3 border-bottom">
                <div style={{ display: "flex", gap: "4px", backgroundColor: "#f3f4f6", borderRadius: "10px", padding: "3px" }}>
                  <button style={tabStyle("payments")}      onClick={() => setActiveTab("payments")}>Payments ({payments.length})</button>
                  <button style={tabStyle("interruptions")} onClick={() => setActiveTab("interruptions")}>Interruptions ({interruptions.length})</button>
                  <button style={tabStyle("attachments")}   onClick={() => setActiveTab("attachments")}>Attachments ({attachments.length})</button>
                </div>
              </div>
              <div className="card-body p-0">

                {/* PAYMENTS */}
                {activeTab === "payments" && (
                  payments.length === 0 ? (
                    <div className="text-center py-5"><MdCreditCard size={36} style={{ color: "#d1d5db", marginBottom: "8px" }} /><p className="text-muted mb-0">No payments recorded</p></div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead style={{ backgroundColor: "#f8fafc" }}>
                          <tr>{["Date", "Amount", "Period", "Notes", ""].map((h) => <th key={h} style={{ padding: "10px 14px", fontWeight: "600", fontSize: "12px", color: "#6b7280", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {payments.map((p) => (
                            <tr key={p.id}>
                              <td style={{ padding: "10px 14px", fontSize: "13px" }}>{new Date(p.payment_date).toLocaleDateString("en-PG", { day: "numeric", month: "short", year: "numeric" })}</td>
                              <td style={{ padding: "10px 14px", fontSize: "13px", fontWeight: "700", color: "#10b981" }}>{formatCurrency(p.amount)}</td>
                              <td style={{ padding: "10px 14px", fontSize: "12px", color: "#6b7280" }}>
                                {p.period_from && p.period_to ? `${new Date(p.period_from).toLocaleDateString("en-PG", { month: "short", year: "numeric" })} – ${new Date(p.period_to).toLocaleDateString("en-PG", { month: "short", year: "numeric" })}` : "—"}
                              </td>
                              <td style={{ padding: "10px 14px", fontSize: "12px", color: "#6b7280" }}>{p.notes || "—"}</td>
                              <td style={{ padding: "10px 14px" }}>
                                {canManage && <button className="btn btn-sm btn-outline-danger" style={{ borderRadius: "6px" }} onClick={() => handleDeletePayment(p.id)}><MdDelete size={14} /></button>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}

                {/* INTERRUPTIONS */}
                {activeTab === "interruptions" && (
                  interruptions.length === 0 ? (
                    <div className="text-center py-5"><MdWarning size={36} style={{ color: "#d1d5db", marginBottom: "8px" }} /><p className="text-muted mb-0">No interruptions logged</p></div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead style={{ backgroundColor: "#f8fafc" }}>
                          <tr>{["From", "To", "Credit Days", "Reason", ""].map((h) => <th key={h} style={{ padding: "10px 14px", fontWeight: "600", fontSize: "12px", color: "#6b7280", textTransform: "uppercase" }}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {interruptions.map((i) => (
                            <tr key={i.id}>
                              <td style={{ padding: "10px 14px", fontSize: "13px" }}>{new Date(i.from_date).toLocaleDateString("en-PG", { day: "numeric", month: "short", year: "numeric" })}</td>
                              <td style={{ padding: "10px 14px", fontSize: "13px" }}>{new Date(i.to_date).toLocaleDateString("en-PG", { day: "numeric", month: "short", year: "numeric" })}</td>
                              <td style={{ padding: "10px 14px" }}><span style={{ backgroundColor: "#e0f2fe", color: "#0369a1", fontSize: "12px", fontWeight: "700", padding: "2px 10px", borderRadius: "999px" }}>+{i.credit_days}d</span></td>
                              <td style={{ padding: "10px 14px", fontSize: "12px", color: "#6b7280" }}>{i.reason || "—"}</td>
                              <td style={{ padding: "10px 14px" }}>
                                {canManage && <button className="btn btn-sm btn-outline-danger" style={{ borderRadius: "6px" }} onClick={() => handleDeleteInterruption(i.id)}><MdDelete size={14} /></button>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}

                {/* ATTACHMENTS */}
                {activeTab === "attachments" && (
                  attachments.length === 0 ? (
                    <div className="text-center py-5"><MdAttachFile size={36} style={{ color: "#d1d5db", marginBottom: "8px" }} /><p className="text-muted mb-0">No files attached</p><p className="text-muted" style={{ fontSize: "12px" }}>Record a payment and attach invoices or receipts</p></div>
                  ) : (
                    <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      {attachments.map((a) => (
                        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                          <MdAttachFile size={18} color="#6366f1" style={{ flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.file_name}</p>
                            <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{a.size_formatted} · {a.file_type}</p>
                          </div>
                          <a href={`/api/attachments/${a.id}/download`} target="_blank" rel="noreferrer" style={{ color: "#6366f1", display: "flex" }} title="Download"><MdDownload size={18} /></a>
                          {canManage && <button className="btn btn-sm btn-outline-danger" style={{ borderRadius: "6px" }} onClick={() => handleDeleteAttachment(a.id)}><MdDelete size={14} /></button>}
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPayment   && <PaymentModal      subscriptionId={id} onClose={() => setShowPayment(false)}   onSuccess={invalidate} />}
      {showInterrupt && <InterruptionModal subscriptionId={id} onClose={() => setShowInterrupt(false)} onSuccess={invalidate} />}
    </Layout>
  );
}

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ subscriptionId, onClose, onSuccess }) {
  const { formatCurrency } = useSettings();
  const [form,   setForm]   = useState({ amount: "", payment_date: new Date().toISOString().split("T")[0], period_from: "", period_to: "", notes: "" });
  const [files,  setFiles]  = useState([]);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const fileRef = useRef();

  const handleSubmit = async () => {
    if (!form.amount || !form.payment_date) { setError("Amount and payment date are required."); return; }
    setSaving(true); setError("");
    try {
      const res = await baseApi.post(`/api/crm/subscriptions/${subscriptionId}/payments`, form);
      if (files.length > 0) {
        const fd = new FormData();
        files.forEach((f) => fd.append("files[]", f));
        await baseApi.post(`/api/attachments/crm_payment/${res.data.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      onSuccess();
      onClose();
      Swal.fire({ icon: "success", title: "Payment Recorded!", text: `${formatCurrency(form.amount)} payment saved successfully.`, confirmButtonColor: "#3b82f6", timer: 2000, showConfirmButton: false });
    } catch (e) {
      setError(e.response?.data?.message || "Failed to record payment.");
    } finally { setSaving(false); }
  };

  return (
    <Modal show onHide={onClose} centered size="md">
      <Modal.Header closeButton style={{ borderBottom: "1px solid #e5e7eb" }}>
        <Modal.Title style={{ fontWeight: "700", fontSize: "16px" }}>Record Payment</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: "20px" }}>
        {error && <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: "13px", borderRadius: "8px" }}>{error}</div>}
        <Form>
          <div className="row g-3">
            <div className="col-6">
              <Form.Label style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>Amount <span className="text-danger">*</span></Form.Label>
              <Form.Control type="number" placeholder="0.00" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} style={{ borderRadius: "8px" }} />
            </div>
            <div className="col-6">
              <Form.Label style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>Payment Date <span className="text-danger">*</span></Form.Label>
              <Form.Control type="date" value={form.payment_date} onChange={(e) => setForm((f) => ({ ...f, payment_date: e.target.value }))} style={{ borderRadius: "8px" }} />
            </div>
            <div className="col-6">
              <Form.Label style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>Period From</Form.Label>
              <Form.Control type="date" value={form.period_from} onChange={(e) => setForm((f) => ({ ...f, period_from: e.target.value }))} style={{ borderRadius: "8px" }} />
            </div>
            <div className="col-6">
              <Form.Label style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>Period To</Form.Label>
              <Form.Control type="date" value={form.period_to} onChange={(e) => setForm((f) => ({ ...f, period_to: e.target.value }))} style={{ borderRadius: "8px" }} />
            </div>
            <div className="col-12">
              <Form.Label style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>Notes</Form.Label>
              <Form.Control type="text" placeholder="e.g. Bank transfer ref #12345" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} style={{ borderRadius: "8px" }} />
            </div>
            <div className="col-12">
              <Form.Label style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>Attach Invoice / Receipt</Form.Label>
              <div style={{ border: "2px dashed #e5e7eb", borderRadius: "8px", padding: "16px", textAlign: "center", cursor: "pointer" }} onClick={() => fileRef.current?.click()}>
                <MdAttachFile size={20} color="#9ca3af" />
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#9ca3af" }}>
                  {files.length > 0 ? files.map((f) => f.name).join(", ") : "Click to attach files"}
                </p>
              </div>
              <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={(e) => setFiles(Array.from(e.target.files))} />
            </div>
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer style={{ borderTop: "1px solid #e5e7eb", gap: "8px" }}>
        <Button variant="secondary" onClick={onClose} style={{ borderRadius: "6px" }}>Cancel</Button>
        <Button style={{ backgroundColor: "#6366f1", borderColor: "#6366f1", borderRadius: "6px" }} disabled={saving} onClick={handleSubmit}>
          {saving ? "Saving..." : "Record Payment"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ── Interruption Modal ────────────────────────────────────────────────────────
function InterruptionModal({ subscriptionId, onClose, onSuccess }) {
  const [form,   setForm]   = useState({ from_date: "", to_date: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const creditDays = form.from_date && form.to_date
    ? Math.max(0, Math.ceil((new Date(form.to_date) - new Date(form.from_date)) / 86400000) + 1)
    : 0;

  const handleSubmit = async () => {
    if (!form.from_date || !form.to_date) { setError("Both dates are required."); return; }
    if (new Date(form.to_date) < new Date(form.from_date)) { setError("End date must be after start date."); return; }
    setSaving(true); setError("");
    try {
      await baseApi.post(`/api/crm/subscriptions/${subscriptionId}/interruptions`, form);
      onSuccess();
      onClose();
      Swal.fire({ icon: "success", title: "Logged!", text: `Interruption logged. ${creditDays} credit day(s) added.`, confirmButtonColor: "#3b82f6", timer: 2000, showConfirmButton: false });
    } catch (e) {
      setError(e.response?.data?.message || "Failed to log interruption.");
    } finally { setSaving(false); }
  };

  return (
    <Modal show onHide={onClose} centered>
      <Modal.Header closeButton style={{ borderBottom: "1px solid #e5e7eb" }}>
        <Modal.Title style={{ fontWeight: "700", fontSize: "16px" }}>Log Service Interruption</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: "20px" }}>
        {error && <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: "13px", borderRadius: "8px" }}>{error}</div>}
        <Form>
          <div className="row g-3">
            <div className="col-6">
              <Form.Label style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>From Date <span className="text-danger">*</span></Form.Label>
              <Form.Control type="date" value={form.from_date} onChange={(e) => setForm((f) => ({ ...f, from_date: e.target.value }))} style={{ borderRadius: "8px" }} />
            </div>
            <div className="col-6">
              <Form.Label style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>To Date <span className="text-danger">*</span></Form.Label>
              <Form.Control type="date" value={form.to_date} onChange={(e) => setForm((f) => ({ ...f, to_date: e.target.value }))} style={{ borderRadius: "8px" }} />
            </div>
            <div className="col-12">
              <Form.Label style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>Reason</Form.Label>
              <Form.Control type="text" placeholder="e.g. ISP outage, server downtime" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} style={{ borderRadius: "8px" }} />
            </div>
          </div>
          {creditDays > 0 && (
            <div style={{ backgroundColor: "#e0f2fe", borderRadius: "8px", padding: "10px 12px", marginTop: "12px" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#0369a1", fontWeight: "600" }}>
                🕐 Credit: +{creditDays} day{creditDays !== 1 ? "s" : ""} will be added to subscription expiry
              </p>
            </div>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer style={{ borderTop: "1px solid #e5e7eb", gap: "8px" }}>
        <Button variant="secondary" onClick={onClose} style={{ borderRadius: "6px" }}>Cancel</Button>
        <Button variant="warning" disabled={saving} onClick={handleSubmit} style={{ borderRadius: "6px", fontWeight: "600" }}>
          {saving ? "Logging..." : "Log Interruption"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}