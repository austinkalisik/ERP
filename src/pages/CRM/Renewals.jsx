import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import { can } from "../../utils/permissions";
import Swal from "sweetalert2";
import { Modal, Button, Form } from "react-bootstrap";
import {
  MdRefresh, MdSearch, MdWarning, MdCheckCircle,
  MdPhone, MdEmail, MdArrowForward,
} from "react-icons/md";
import { StatusBadge } from "./CRM";

const fetchRenewals = (window, search, service, page) =>
  baseApi.get(`/api/crm/renewals?window=${window}&search=${encodeURIComponent(search)}&service=${service}&page=${page}&per_page=20`).then((r) => r.data);

const WINDOWS = [
  { key: "30",      label: "Due in 30 days", color: "#f59e0b" },
  { key: "60",      label: "Due in 60 days", color: "#f97316" },
  { key: "90",      label: "Due in 90 days", color: "#6366f1" },
  { key: "overdue", label: "Overdue",         color: "#ef4444" },
];

export default function Renewals() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const { user, permissions } = useAuth();
  const { formatCurrency }    = useSettings();
  const canManage = can(permissions, "crm.manage") || user?.role === "system_admin";

  const [window_,   setWindow]    = useState("30");
  const [search,    setSearch]    = useState("");
  const [service,   setService]   = useState("");
  const [page,      setPage]      = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalSub,  setModalSub]  = useState(null);
  const [renewForm, setRenewForm] = useState({ amount: "", payment_date: new Date().toISOString().split("T")[0], notes: "" });
  const [renewError,setRenewError]= useState("");
  const [saving,    setSaving]    = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey:  ["crm_renewals", window_, search, service, page],
    queryFn:   () => fetchRenewals(window_, search, service, page),
    staleTime: 60 * 1000,
    keepPreviousData: true,
  });

  const { data: servicesData = [] } = useQuery({
    queryKey: ["crm_services"],
    queryFn:  () => baseApi.get("/api/crm/services").then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  });

  const subs    = data?.data    || [];
  const meta    = data?.meta    || {};
  const summary = data?.summary || {};

  const openRenewModal = (sub) => {
    setModalSub(sub);
    setRenewForm({ amount: sub.amount, payment_date: new Date().toISOString().split("T")[0], notes: "" });
    setRenewError("");
    setShowModal(true);
  };

  const handleRenew = async () => {
    if (!renewForm.amount) { setRenewError("Amount is required."); return; }
    setSaving(true);
    try {
      await baseApi.post(`/api/crm/renewals/${modalSub.id}/renew`, renewForm);
      queryClient.invalidateQueries(["crm_renewals"]);
      queryClient.invalidateQueries(["crm_stats"]);
      queryClient.invalidateQueries(["crm_subscriptions"]);
      setShowModal(false);
      Swal.fire({ icon: "success", title: "Renewed!", text: `Subscription for ${modalSub.client_name} renewed successfully.`, confirmButtonColor: "#3b82f6", timer: 2000, showConfirmButton: false });
    } catch (e) {
      setRenewError(e.response?.data?.message || "Failed to renew. Please try again.");
    } finally { setSaving(false); }
  };

  const urgencyColor = (d) => d < 0 ? "#ef4444" : d <= 7 ? "#ef4444" : d <= 14 ? "#f97316" : d <= 30 ? "#f59e0b" : "#6366f1";

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h1 style={{ fontWeight: "bold", fontSize: "clamp(18px, 4vw, 26px)", margin: 0 }}>Renewal Management</h1>
            <p className="text-muted mb-0" style={{ fontSize: "14px" }}>Track and process subscription renewals</p>
          </div>
          <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ borderRadius: "8px" }} onClick={() => refetch()}>
            <MdRefresh size={16} /> Refresh
          </button>
        </div>

        {/* Window Tabs */}
        <div className="d-flex gap-2 mb-4 flex-wrap">
          {WINDOWS.map((w) => (
            <button key={w.key} onClick={() => { setWindow(w.key); setPage(1); }} style={{ padding: "8px 16px", border: "2px solid", borderColor: window_ === w.key ? w.color : "#e5e7eb", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s", backgroundColor: window_ === w.key ? w.color : "#fff", color: window_ === w.key ? "#fff" : "#374151", display: "flex", alignItems: "center", gap: "8px" }}>
              {w.label}
              <span style={{ backgroundColor: window_ === w.key ? "rgba(255,255,255,0.3)" : w.color, color: "#fff", borderRadius: "999px", fontSize: "11px", fontWeight: "700", padding: "1px 7px" }}>
                {w.key === "overdue" ? (summary.overdue ?? 0) : (summary[`due_${w.key}`] ?? 0)}
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="card shadow-sm mb-3" style={{ borderRadius: "12px" }}>
          <div className="card-body p-3">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-5">
                <div style={{ position: "relative" }}>
                  <MdSearch size={18} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                  <input type="text" className="form-control form-control-sm" placeholder="Search client..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: "34px", borderRadius: "8px" }} />
                </div>
              </div>
              <div className="col-6 col-md-3">
                <select className="form-select form-select-sm" value={service} onChange={(e) => { setService(e.target.value); setPage(1); }} style={{ borderRadius: "8px" }}>
                  <option value="">All Services</option>
                  {servicesData.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="col-6 col-md-4 text-end">
                <span className="text-muted" style={{ fontSize: "13px" }}>{meta.total ?? 0} subscription{meta.total !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
          <div className="card-body p-0">
            {isLoading ? (
              <div className="text-center py-5"><div className="spinner-border spinner-border-sm text-secondary" /><p className="text-muted mt-2">Loading renewals...</p></div>
            ) : subs.length === 0 ? (
              <div className="text-center py-5"><MdCheckCircle size={40} style={{ color: "#d1d5db", marginBottom: "8px" }} /><p className="text-muted mb-0">No subscriptions in this window</p></div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead style={{ backgroundColor: "#f8fafc" }}>
                    <tr>
                      {["Client", "Service", "Contact", "Billing", "Amount", "Expiry", "Days Left", "Status", ""].map((h) => (
                        <th key={h} style={{ padding: "10px 14px", fontWeight: "600", fontSize: "12px", color: "#6b7280", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subs.map((sub) => (
                      <tr key={sub.id}>
                        <td style={{ padding: "10px 14px" }}>
                          <p style={{ margin: 0, fontWeight: "700", fontSize: "13px" }}>{sub.client_name}</p>
                          {sub.contact_person && <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>{sub.contact_person}</p>}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: "13px", color: "#6366f1", fontWeight: "500" }}>{sub.service_name}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            {sub.phone && <span style={{ fontSize: "12px", color: "#6b7280", display: "flex", alignItems: "center", gap: "4px" }}><MdPhone size={12} />{sub.phone}</span>}
                            {sub.email && <span style={{ fontSize: "11px", color: "#6b7280", display: "flex", alignItems: "center", gap: "4px" }}><MdEmail size={12} />{sub.email}</span>}
                          </div>
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: "12px", color: "#6b7280" }}>{sub.billing_cycle}</td>
                        <td style={{ padding: "10px 14px", fontSize: "13px", fontWeight: "700" }}>{formatCurrency(sub.amount)}</td>
                        <td style={{ padding: "10px 14px", fontSize: "13px", fontWeight: "600", color: urgencyColor(sub.days_left), whiteSpace: "nowrap" }}>
                          {new Date(sub.expiry_date).toLocaleDateString("en-PG", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ fontSize: "13px", fontWeight: "800", color: urgencyColor(sub.days_left) }}>
                            {sub.days_left < 0 ? `${Math.abs(sub.days_left)}d overdue` : `${sub.days_left}d`}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px" }}><StatusBadge status={sub.status} /></td>
                        <td style={{ padding: "10px 14px" }}>
                          <div className="d-flex gap-2">
                            {canManage && (
                              <button className="btn btn-sm" style={{ backgroundColor: "#10b981", color: "#fff", borderRadius: "8px", fontWeight: "600", fontSize: "12px", whiteSpace: "nowrap" }} onClick={() => openRenewModal(sub)}>
                                Renew
                              </button>
                            )}
                            <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ borderRadius: "8px", fontSize: "12px" }} onClick={() => navigate(`/crm/subscriptions/${sub.id}`)}>
                              <MdArrowForward size={13} />
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
          {(meta.last_page ?? 1) > 1 && (
            <div className="card-footer bg-white border-top d-flex justify-content-between align-items-center px-3 py-2" style={{ borderRadius: "0 0 12px 12px" }}>
              <button className="btn btn-sm btn-outline-secondary" style={{ borderRadius: "8px" }} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span style={{ fontSize: "13px", color: "#6b7280" }}>Page {page} of {meta.last_page}</span>
              <button className="btn btn-sm btn-outline-secondary" style={{ borderRadius: "8px" }} disabled={page === meta.last_page} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </div>
      </div>

      {/* Renew Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: "1px solid #e5e7eb" }}>
          <Modal.Title style={{ fontWeight: "700", fontSize: "16px" }}>Renew Subscription</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "20px" }}>
          {renewError && <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: "13px", borderRadius: "8px" }}>{renewError}</div>}
          {modalSub && (
            <div style={{ backgroundColor: "#f0fdf4", borderRadius: "8px", padding: "10px 12px", marginBottom: "16px" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#166534", fontWeight: "600" }}>
                {modalSub.client_name} — {modalSub.service_name}
              </p>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#166534" }}>
                Current expiry: {new Date(modalSub.expiry_date).toLocaleDateString("en-PG", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          )}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>Amount <span className="text-danger">*</span></Form.Label>
              <Form.Control type="number" value={renewForm.amount} onChange={(e) => setRenewForm((f) => ({ ...f, amount: e.target.value }))} style={{ borderRadius: "8px" }} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>Payment Date</Form.Label>
              <Form.Control type="date" value={renewForm.payment_date} onChange={(e) => setRenewForm((f) => ({ ...f, payment_date: e.target.value }))} style={{ borderRadius: "8px" }} />
            </Form.Group>
            <Form.Group>
              <Form.Label style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>Notes</Form.Label>
              <Form.Control type="text" placeholder="e.g. Bank transfer ref #12345" value={renewForm.notes} onChange={(e) => setRenewForm((f) => ({ ...f, notes: e.target.value }))} style={{ borderRadius: "8px" }} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "1px solid #e5e7eb", gap: "8px" }}>
          <Button variant="secondary" onClick={() => setShowModal(false)} style={{ borderRadius: "6px" }}>Cancel</Button>
          <Button style={{ backgroundColor: "#10b981", borderColor: "#10b981", borderRadius: "6px", fontWeight: "600" }} disabled={saving} onClick={handleRenew}>
            {saving ? "Processing..." : "Confirm Renewal"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
}