import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { Modal, Button, Form } from "react-bootstrap";
import { MdAdd, MdEdit, MdVisibility, MdStar } from "react-icons/md";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../utils/permissions";
import { useSettings } from "../../contexts/SettingsContext";

const EMPTY_FORM = {
  name: "", email: "", password: "",
  license_number: "", license_type: "", license_expiry: "",
  certification: "", total_hours: 0, performance_rating: 0, notes: "", status: "Active",
};

export default function Operators() {
  const navigate    = useNavigate();
  const { permissions } = useAuth();
  const queryClient = useQueryClient();
  const { formatDate } = useSettings();

  const canCreate = can(permissions, "moms.operators.create");
  const canEdit   = can(permissions, "moms.operators.update");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting,      setSubmitting]      = useState(false);
  const [formData,        setFormData]        = useState(EMPTY_FORM);

  // ── Operators list — cached 5 min ─────────────────────────────────────────
  // Shared with: AssignmentEdit.jsx, StartShift.jsx
  const cacheKey = ["moms_operators"];
  const { data: operators = [], isLoading: loading } = useQuery({
    queryKey:  cacheKey,
    queryFn:   () => baseApi.get("/api/moms/operators").then((r) => r.data || []),
    staleTime: 5 * 60 * 1000,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: cacheKey });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await baseApi.post("/api/moms/operators", formData);
      setShowCreateModal(false); setFormData(EMPTY_FORM); refetch();
      Swal.fire({ icon: "success", title: "Operator Created", text: `${formData.name} has been added as an operator.`, confirmButtonColor: "#3b82f6", timer: 2500, showConfirmButton: false });
    } catch (err) {
      const errors = err.response?.data?.errors;
      const msg = errors ? Object.values(errors).flat().join(" ") : err.response?.data?.message ?? "Failed to create operator.";
      Swal.fire({ icon: "error", title: "Creation Failed", text: msg, confirmButtonColor: "#3b82f6" });
    } finally { setSubmitting(false); }
  };

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        {/* Header */}
        <div className="row mb-3 mb-md-4 align-items-center">
          <div className="col"><h1 style={{ fontWeight: "bold", fontSize: "clamp(20px, 5vw, 28px)" }}>Operators</h1></div>
          {canCreate && (
            <div className="col-auto">
              <button className="btn btn-primary" style={{ height: "42px", fontSize: "15px", fontWeight: "500", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }} onClick={() => { setFormData(EMPTY_FORM); setShowCreateModal(true); }}>
                <MdAdd size={20} /> Add Operator
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #e9ecef" }}>
                  <tr>
                    {["Name","License No.","License Type","License Expiry","Total Hours","Rating","Status","Actions"].map((h) => (
                      <th key={h} style={{ padding: "16px", fontWeight: "600", color: "#495057" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="8" className="text-center py-4">Loading...</td></tr>
                  ) : operators.length === 0 ? (
                    <tr><td colSpan="8" className="text-center py-4 text-muted">No operators found.{canCreate && ' Click "Add Operator" to create one.'}</td></tr>
                  ) : (
                    operators.map((op) => (
                      <tr key={op.id}>
                        <td style={{ padding: "16px" }}>
                          <span style={{ color: "#3b82f6", fontWeight: "500", cursor: "pointer" }} onClick={() => navigate(`/moms/operators/${op.id}`)}>
                            {op.user_name || `Operator ${op.id}`}
                          </span>
                        </td>
                        <td style={{ padding: "16px" }}>{op.license_number || "—"}</td>
                        <td style={{ padding: "16px" }}>{op.license_type || "—"}</td>
                        <td style={{ padding: "16px" }}>{formatDate(op.license_expiry) || "—"}</td>
                        <td style={{ padding: "16px" }}>{op.total_hours || 0}h</td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <MdStar size={16} color="#fbbf24" />
                            <span style={{ fontWeight: "500" }}>{op.performance_rating ? Number(op.performance_rating).toFixed(2) : "0.00"}</span>
                          </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <span className={`badge ${op.status === "Active" ? "bg-success" : op.status === "On Leave" ? "bg-warning text-dark" : "bg-secondary"}`}>
                            {op.status}
                          </span>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            {canEdit && (
                              <button className="btn btn-sm" style={{ color: "#3b82f6", padding: "4px 8px", fontSize: "13px" }} onClick={() => navigate(`/moms/operators/${op.id}/edit`)}>
                                <MdEdit size={16} className="me-1" /> Edit
                              </button>
                            )}
                            <button className="btn btn-sm" style={{ color: "#6b7280", padding: "4px 8px", fontSize: "13px" }} onClick={() => navigate(`/moms/operators/${op.id}`)}>
                              <MdVisibility size={16} className="me-1" /> View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {canCreate && (
        <Modal show={showCreateModal} onHide={() => !submitting && setShowCreateModal(false)} centered size="lg">
          <Modal.Header closeButton style={{ borderBottom: "1px solid #e5e7eb" }}>
            <Modal.Title style={{ fontWeight: "600" }}>Add Operator</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body style={{ padding: "24px" }}>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>User Account</p>
              <div className="row">
                <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Full Name <span style={{ color: "red" }}>*</span></Form.Label><Form.Control type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="e.g., Juan dela Cruz" /></Form.Group></div>
                <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Email <span style={{ color: "red" }}>*</span></Form.Label><Form.Control type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="e.g., juan@company.com" /></Form.Group></div>
              </div>
              <Form.Group className="mb-4">
                <Form.Label style={{ fontWeight: "500" }}>Password <span style={{ color: "red" }}>*</span></Form.Label>
                <Form.Control type="password" name="password" value={formData.password} onChange={handleInputChange} required placeholder="Minimum 8 characters" />
                <Form.Text className="text-muted">The operator will use this to log in.</Form.Text>
              </Form.Group>

              <hr style={{ borderColor: "#e5e7eb", marginBottom: "20px" }} />

              <p style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Operator Profile</p>
              <Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>License Number <span style={{ color: "red" }}>*</span></Form.Label><Form.Control type="text" name="license_number" value={formData.license_number} onChange={handleInputChange} required placeholder="e.g., LIC-OPE-0006" /></Form.Group>
              <div className="row">
                <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>License Type</Form.Label><Form.Control type="text" name="license_type" value={formData.license_type} onChange={handleInputChange} placeholder="e.g., Heavy Machinery" /></Form.Group></div>
                <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>License Expiry <span style={{ color: "red" }}>*</span></Form.Label><Form.Control type="date" name="license_expiry" value={formData.license_expiry} onChange={handleInputChange} required /></Form.Group></div>
              </div>
              <Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Certification</Form.Label><Form.Control type="text" name="certification" value={formData.certification} onChange={handleInputChange} placeholder="e.g., Excavator Certified" /></Form.Group>
              <div className="row">
                <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Total Hours</Form.Label><Form.Control type="number" name="total_hours" value={formData.total_hours} onChange={handleInputChange} min="0" /></Form.Group></div>
                <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Performance Rating (0–5)</Form.Label><Form.Control type="number" name="performance_rating" value={formData.performance_rating} onChange={handleInputChange} min="0" max="5" step="0.01" /></Form.Group></div>
              </div>
              <Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Notes</Form.Label><Form.Control as="textarea" rows={3} name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Additional notes about the operator" /></Form.Group>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontWeight: "500" }}>Status</Form.Label>
                <Form.Select name="status" value={formData.status} onChange={handleInputChange} required>
                  <option value="Active">Active</option><option value="Inactive">Inactive</option><option value="On Leave">On Leave</option>
                </Form.Select>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer style={{ borderTop: "1px solid #e5e7eb", gap: "8px" }}>
              <Button variant="secondary" onClick={() => setShowCreateModal(false)} disabled={submitting} style={{ borderRadius: "6px" }}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting} style={{ borderRadius: "6px" }}>{submitting ? "Creating..." : "Create Operator"}</Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}
    </Layout>
  );
}