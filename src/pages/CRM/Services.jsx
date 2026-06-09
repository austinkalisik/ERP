import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../utils/permissions";
import Swal from "sweetalert2";
import { Modal, Button, Form } from "react-bootstrap";
import { MdAdd, MdEdit, MdDelete, MdWifi, MdDns, MdGpsFixed, MdSubscriptions } from "react-icons/md";

const SERVICE_ICON = {
  "Internet Service": <MdWifi size={22} />,
  "Domain Hosting":   <MdDns size={22} />,
  "GPS":              <MdGpsFixed size={22} />,
};

const SERVICE_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#0891b2",
];

export default function Services() {
  const queryClient = useQueryClient();
  const { user, permissions } = useAuth();
  const canManage = can(permissions, "crm.manage") || user?.role === "system_admin";

  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState({ name: "", description: "" });
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["crm_services_all"],
    queryFn:  () => baseApi.get("/api/crm/services").then((r) => r.data),
    staleTime: 60 * 1000,
  });

  const openCreate = () => { setEditing(null); setForm({ name: "", description: "" }); setError(""); setShowModal(true); };
  const openEdit   = (svc) => { setEditing(svc); setForm({ name: svc.name, description: svc.description || "" }); setError(""); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Service name is required."); return; }
    setSaving(true); setError("");
    try {
      if (editing) {
        await baseApi.put(`/api/crm/services/${editing.id}`, form);
      } else {
        await baseApi.post("/api/crm/services", form);
      }
      queryClient.invalidateQueries(["crm_services"]);
      queryClient.invalidateQueries(["crm_services_all"]);
      setShowModal(false);
      Swal.fire({ icon: "success", title: editing ? "Updated!" : "Created!", confirmButtonColor: "#3b82f6", timer: 1500, showConfirmButton: false });
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data?.errors?.name?.[0] || "Failed to save service.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (svc) => {
    const result = await Swal.fire({
      title: "Remove Service?",
      text: `"${svc.name}" will be deactivated if it has subscriptions, or permanently deleted if it doesn't.`,
      icon: "warning", showCancelButton: true,
      confirmButtonColor: "#dc2626", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, remove it",
    });
    if (!result.isConfirmed) return;
    try {
      await baseApi.delete(`/api/crm/services/${svc.id}`);
      queryClient.invalidateQueries(["crm_services"]);
      queryClient.invalidateQueries(["crm_services_all"]);
      Swal.fire({ icon: "success", title: "Removed", confirmButtonColor: "#3b82f6", timer: 1500, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Failed", text: e.response?.data?.message || "Failed to remove.", confirmButtonColor: "#3b82f6" });
    }
  };

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">

        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h1 style={{ fontWeight: "700", fontSize: "clamp(18px,4vw,26px)", margin: 0 }}>Service Management</h1>
            <p className="text-muted mb-0" style={{ fontSize: "13px" }}>Manage service types available for client subscriptions</p>
          </div>
          {canManage && (
            <button
              className="btn btn-sm d-flex align-items-center gap-1"
              style={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: "8px", fontWeight: "600" }}
              onClick={openCreate}
            >
              <MdAdd size={16} /> Add Service
            </button>
          )}
        </div>

        {/* Info banner */}
        <div style={{ backgroundColor: "#ede9fe", borderRadius: "10px", padding: "12px 16px", marginBottom: "24px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
          <MdSubscriptions size={18} color="#6366f1" style={{ flexShrink: 0, marginTop: "1px" }} />
          <p style={{ margin: 0, fontSize: "13px", color: "#4338ca", lineHeight: "1.5" }}>
            Services listed here appear in all subscription dropdowns. Adding a new service automatically makes it available when creating subscriptions.
          </p>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border spinner-border-sm text-secondary" />
            <p className="text-muted mt-2">Loading services...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
            <div className="card-body text-center py-5">
              <MdSubscriptions size={40} style={{ color: "#d1d5db", marginBottom: "8px" }} />
              <p className="text-muted mb-1">No services yet</p>
              {canManage && (
                <button className="btn btn-sm mt-1" style={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: "8px" }} onClick={openCreate}>
                  Add First Service
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="row g-3 mb-4">
              <div className="col-6 col-md-3">
                <div className="card shadow-sm" style={{ borderRadius: "10px", borderTop: "3px solid #6366f1" }}>
                  <div className="card-body p-3">
                    <p style={{ fontSize: "11px", color: "#6b7280", fontWeight: "600", margin: "0 0 4px 0" }}>Total Services</p>
                    <p style={{ fontSize: "24px", fontWeight: "800", color: "#6366f1", margin: 0 }}>{services.length}</p>
                  </div>
                </div>
              </div>
              <div className="col-6 col-md-3">
                <div className="card shadow-sm" style={{ borderRadius: "10px", borderTop: "3px solid #10b981" }}>
                  <div className="card-body p-3">
                    <p style={{ fontSize: "11px", color: "#6b7280", fontWeight: "600", margin: "0 0 4px 0" }}>Active</p>
                    <p style={{ fontSize: "24px", fontWeight: "800", color: "#10b981", margin: 0 }}>
                      {services.filter((s) => s.is_active).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Service cards grid */}
            <div className="row g-3">
              {services.map((svc, idx) => (
                <div key={svc.id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                  <div className="card shadow-sm h-100" style={{
                    borderRadius: "12px",
                    borderTop: `4px solid ${SERVICE_COLORS[idx % SERVICE_COLORS.length]}`,
                    border: "1px solid #e5e7eb",
                    borderTopColor: SERVICE_COLORS[idx % SERVICE_COLORS.length],
                  }}>
                    <div className="card-body p-4 d-flex flex-column">
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <div style={{
                          width: "48px", height: "48px", borderRadius: "12px",
                          backgroundColor: `${SERVICE_COLORS[idx % SERVICE_COLORS.length]}18`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: SERVICE_COLORS[idx % SERVICE_COLORS.length], flexShrink: 0,
                        }}>
                          {SERVICE_ICON[svc.name] || <MdSubscriptions size={22} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: "700", fontSize: "15px", color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {svc.name}
                          </p>
                          <span style={{
                            backgroundColor: svc.is_active ? "#dcfce7" : "#fee2e2",
                            color: svc.is_active ? "#166534" : "#991b1b",
                            fontSize: "10px", fontWeight: "700",
                            padding: "2px 8px", borderRadius: "999px",
                          }}>
                            {svc.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>

                      {svc.description && (
                        <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 12px 0", lineHeight: "1.5", flex: 1 }}>
                          {svc.description}
                        </p>
                      )}

                      {!svc.description && <div style={{ flex: 1 }} />}

                      {canManage && (
                        <div className="d-flex gap-2 mt-3">
                          <button
                            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 flex-grow-1 justify-content-center"
                            style={{ borderRadius: "8px", fontSize: "12px" }}
                            onClick={() => openEdit(svc)}
                          >
                            <MdEdit size={14} /> Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                            style={{ borderRadius: "8px", fontSize: "12px" }}
                            onClick={() => handleDelete(svc)}
                          >
                            <MdDelete size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: "1px solid #e5e7eb" }}>
          <Modal.Title style={{ fontWeight: "700", fontSize: "16px" }}>
            {editing ? "Edit Service" : "Add New Service"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <Modal.Body style={{ padding: "20px" }}>
            {error && <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: "13px", borderRadius: "8px" }}>{error}</div>}
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>
                Service Name <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Internet Service, Domain Hosting, GPS"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                style={{ borderRadius: "8px" }}
                autoFocus
              />
            </Form.Group>
            <Form.Group>
              <Form.Label style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Brief description of this service..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                style={{ borderRadius: "8px" }}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ borderTop: "1px solid #e5e7eb", gap: "8px" }}>
            <Button variant="secondary" onClick={() => setShowModal(false)} style={{ borderRadius: "6px" }}>Cancel</Button>
            <Button
              variant="primary" type="submit" disabled={saving}
              style={{ borderRadius: "6px", backgroundColor: "#6366f1", borderColor: "#6366f1" }}
            >
              {saving ? "Saving..." : editing ? "Save Changes" : "Add Service"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Layout>
  );
}