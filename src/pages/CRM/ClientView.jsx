import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import { can } from "../../utils/permissions";
import Swal from "sweetalert2";
import {
  MdArrowBack, MdEdit, MdDelete, MdAdd, MdPerson,
  MdEmail, MdPhone, MdBusiness, MdSave,
  MdSubscriptions, MdArrowForward,
} from "react-icons/md";
import { StatusBadge, SERVICE_ICON } from "./CRM";

const fetchClient = (id) => baseApi.get(`/api/crm/clients/${id}`).then((r) => r.data);

export default function ClientView() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const { user, permissions } = useAuth();
  const { formatCurrency }    = useSettings();
  const canManage = can(permissions, "crm.manage") || user?.role === "system_admin";

  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState(null);
  const [saving,  setSaving]  = useState(false);

  const { data: client, isLoading } = useQuery({
    queryKey: ["crm_client", id],
    queryFn:  () => fetchClient(id),
    onSuccess: (data) => { if (!form) setForm({ ...data }); },
    staleTime: 60 * 1000,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await baseApi.put(`/api/crm/clients/${id}`, form);
      queryClient.invalidateQueries(["crm_client", id]);
      queryClient.invalidateQueries(["crm_clients"]);
      setEditing(false);
      Swal.fire({ icon: "success", title: "Saved!", text: "Client updated successfully.", confirmButtonColor: "#3b82f6", timer: 2000, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Save Failed", text: e.response?.data?.message || "Failed to update client.", confirmButtonColor: "#3b82f6" });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete Client?",
      text: `This will permanently delete ${client.name} and all their subscriptions and payment records. This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete",
    });
    if (!result.isConfirmed) return;
    try {
      await baseApi.delete(`/api/crm/clients/${id}`);
      queryClient.invalidateQueries(["crm_clients"]);
      Swal.fire({ icon: "success", title: "Deleted", text: "Client has been deleted.", confirmButtonColor: "#3b82f6", timer: 2000, showConfirmButton: false })
        .then(() => navigate("/crm/clients"));
    } catch (e) {
      Swal.fire({ icon: "error", title: "Delete Failed", text: e.response?.data?.message || "Failed to delete client.", confirmButtonColor: "#3b82f6" });
    }
  };

  if (isLoading) return (
    <Layout><div className="text-center py-5"><div className="spinner-border spinner-border-sm text-secondary" /><p className="text-muted mt-2">Loading client...</p></div></Layout>
  );
  if (!client) return (
    <Layout><div className="text-center py-5"><p className="text-muted">Client not found.</p><button className="btn btn-sm btn-outline-secondary" onClick={() => navigate("/crm/clients")}>Back</button></div></Layout>
  );

  const subscriptions = client.subscriptions || [];

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">

        {/* ── Top bar: Back button LEFT, Add Subscription RIGHT ── */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <button
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
            style={{ borderRadius: "8px" }}
            onClick={() => navigate("/crm/clients")}
          >
            <MdArrowBack size={16} /> Back to Clients
          </button>

          {canManage && (
            <button
              className="btn btn-sm d-inline-flex align-items-center gap-1"
              style={{
                backgroundColor: "#6366f1", color: "#fff",
                borderRadius: "8px", fontWeight: "500",
                fontSize: "13px", padding: "6px 14px",
              }}
              onClick={() => navigate(`/crm/subscriptions/create?client_id=${id}`)}
            >
              <MdAdd size={15} /> Add Subscription
            </button>
          )}
        </div>

        {/* ── Main Grid ── */}
        <div className="row g-3">

          {/* ── Left Column: Client Info + Summary ── */}
          <div className="col-12 col-lg-4">

            {/* Client Info Card */}
            <div className="card shadow-sm mb-3" style={{ borderRadius: "12px" }}>

              {/* Card header: avatar + name LEFT, action buttons RIGHT */}
              <div
                className="card-header bg-white p-3 border-bottom"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}
              >
                {/* Left: avatar + name */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "10px",
                    backgroundColor: "#ede9fe", display: "flex", alignItems: "center",
                    justifyContent: "center", flexShrink: 0,
                  }}>
                    <span style={{ fontWeight: "800", fontSize: "18px", color: "#6366f1" }}>
                      {client.name.charAt(0)}
                    </span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h5
                      className="mb-0"
                      style={{ fontWeight: "700", fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      {client.name}
                    </h5>
                    {client.tin_number && (
                      <p className="mb-0 text-muted" style={{ fontSize: "12px" }}>TIN: {client.tin_number}</p>
                    )}
                  </div>
                </div>

                {/* Right: Edit/Delete or Save/Cancel */}
                {canManage && (
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                    {!editing ? (
                      <>
                        <button
                          className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                          style={{ borderRadius: "7px", fontSize: "12px", padding: "4px 10px" }}
                          onClick={() => { setForm({ ...client }); setEditing(true); }}
                        >
                          <MdEdit size={14} /> Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                          style={{ borderRadius: "7px", fontSize: "12px", padding: "4px 10px" }}
                          onClick={handleDelete}
                        >
                          <MdDelete size={14} /> Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          style={{ borderRadius: "7px", fontSize: "12px", padding: "4px 10px" }}
                          onClick={() => setEditing(false)}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-sm d-inline-flex align-items-center gap-1"
                          style={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: "7px", fontSize: "12px", padding: "4px 10px" }}
                          disabled={saving}
                          onClick={handleSave}
                        >
                          <MdSave size={14} /> {saving ? "Saving..." : "Save"}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Card body: fields */}
              <div className="card-body p-3">
                {editing && form ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      { label: "Client / Company Name", key: "name",           type: "text" },
                      { label: "Contact Person",        key: "contact_person", type: "text" },
                      { label: "Email",                 key: "email",          type: "email" },
                      { label: "Phone",                 key: "phone",          type: "text" },
                      { label: "Address",               key: "address",        type: "text" },
                      { label: "TIN Number",            key: "tin_number",     type: "text" },
                    ].map(({ label, key, type }) => (
                      <div key={key}>
                        <label style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", marginBottom: "3px", display: "block" }}>{label}</label>
                        <input
                          type={type}
                          className="form-control form-control-sm"
                          value={form[key] || ""}
                          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                          style={{ borderRadius: "6px" }}
                        />
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", marginBottom: "3px", display: "block" }}>Notes</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows={3}
                        value={form.notes || ""}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                        style={{ borderRadius: "6px" }}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      { label: "Contact Person", value: client.contact_person, icon: <MdPerson size={14} /> },
                      { label: "Email",          value: client.email,          icon: <MdEmail size={14} /> },
                      { label: "Phone",          value: client.phone,          icon: <MdPhone size={14} /> },
                      { label: "Address",        value: client.address,        icon: <MdBusiness size={14} /> },
                    ].map(({ label, value, icon }) => value ? (
                      <div key={label}>
                        <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0, textTransform: "uppercase", fontWeight: "600" }}>{label}</p>
                        <p style={{ fontSize: "13px", color: "#374151", margin: 0, display: "flex", alignItems: "center", gap: "5px" }}>{icon} {value}</p>
                      </div>
                    ) : null)}
                    {client.notes && (
                      <div>
                        <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0, textTransform: "uppercase", fontWeight: "600" }}>Notes</p>
                        <p style={{ fontSize: "13px", color: "#374151", margin: 0 }}>{client.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Summary Card */}
            <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-header bg-white p-3 border-bottom">
                <h6 className="mb-0" style={{ fontWeight: "600" }}>Summary</h6>
              </div>
              <div className="card-body p-3">
                {[
                  { label: "Active Subscriptions", value: subscriptions.filter((s) => s.status === "Active").length,          color: "#10b981" },
                  { label: "Expiring Soon",         value: subscriptions.filter((s) => s.status === "Expiring").length,        color: "#f59e0b" },
                  { label: "Expired",               value: subscriptions.filter((s) => s.status === "Expired").length,         color: "#ef4444" },
                  { label: "Total Credits",         value: formatCurrency(client.total_credits ?? 0),                          color: "#0891b2" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="d-flex justify-content-between align-items-center mb-2">
                    <span style={{ fontSize: "13px", color: "#6b7280" }}>{label}</span>
                    <span style={{ fontSize: "14px", fontWeight: "700", color }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right Column: Subscriptions ── */}
          <div className="col-12 col-lg-8">
            <div className="card shadow-sm" style={{ borderRadius: "12px" }}>

              {/* Subscriptions card header: title only */}
              <div className="card-header bg-white p-3 border-bottom">
                <h5 className="mb-0" style={{ fontWeight: "600", fontSize: "15px" }}>
                  Subscriptions
                  {subscriptions.length > 0 && (
                    <span style={{
                      marginLeft: "8px", fontSize: "11px", fontWeight: "700",
                      backgroundColor: "#ede9fe", color: "#6366f1",
                      padding: "2px 8px", borderRadius: "999px",
                    }}>
                      {subscriptions.length}
                    </span>
                  )}
                </h5>
              </div>

              {/* Subscriptions body */}
              <div className="card-body p-0">
                {subscriptions.length === 0 ? (
                  <div className="text-center py-5">
                    <MdSubscriptions size={36} style={{ color: "#d1d5db", marginBottom: "8px" }} />
                    <p className="text-muted mb-1" style={{ fontSize: "14px" }}>No subscriptions yet</p>
                    {canManage && (
                      <button
                        className="btn btn-sm mt-2"
                        style={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: "8px" }}
                        onClick={() => navigate(`/crm/subscriptions/create?client_id=${id}`)}
                      >
                        Add First Subscription
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {subscriptions.map((sub, idx) => {
                      const daysLeft = Math.ceil((new Date(sub.expiry_date) - new Date()) / 86400000);
                      const isLast   = idx === subscriptions.length - 1;
                      return (
                        <div
                          key={sub.id}
                          style={{
                            padding: "14px 16px",
                            borderBottom: isLast ? "none" : "1px solid #f3f4f6",
                            cursor: "pointer",
                            transition: "background 0.15s",
                          }}
                          onClick={() => navigate(`/crm/subscriptions/${sub.id}`)}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{
                                width: "36px", height: "36px", borderRadius: "8px",
                                backgroundColor: "#ede9fe", display: "flex", alignItems: "center",
                                justifyContent: "center", color: "#6366f1", flexShrink: 0,
                              }}>
                                {SERVICE_ICON[sub.service_name] || <MdSubscriptions size={16} />}
                              </div>
                              <div>
                                <p style={{ margin: 0, fontWeight: "600", fontSize: "14px", color: "#111" }}>{sub.service_name}</p>
                                <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
                                  {sub.billing_cycle} · {formatCurrency(sub.amount)} · Expires {new Date(sub.expiry_date).toLocaleDateString("en-PG", { day: "numeric", month: "short", year: "numeric" })}
                                </p>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <StatusBadge status={sub.status} />
                              {sub.status !== "Expired" && sub.status !== "Suspended" && (
                                <span style={{ fontSize: "12px", color: daysLeft <= 7 ? "#ef4444" : daysLeft <= 30 ? "#f59e0b" : "#6b7280", fontWeight: "600" }}>
                                  {daysLeft > 0 ? `${daysLeft}d left` : "Overdue"}
                                </span>
                              )}
                              {sub.credit_days > 0 && (
                                <span style={{ backgroundColor: "#e0f2fe", color: "#0369a1", fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "999px" }}>
                                  +{sub.credit_days}d credit
                                </span>
                              )}
                              <MdArrowForward size={16} color="#9ca3af" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}