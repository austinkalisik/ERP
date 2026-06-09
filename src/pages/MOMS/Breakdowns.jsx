import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../utils/permissions";
import { Modal, Button, Form } from "react-bootstrap";
import { MdBuild, MdWarning } from "react-icons/md";
import Swal from "sweetalert2";

export default function Breakdowns() {
  const navigate    = useNavigate();
  const { permissions } = useAuth();
  const queryClient = useQueryClient();

  const canEdit = can(permissions, "moms.breakdowns.update");

  const [showReportModal, setShowReportModal] = useState(false);
  const [formData, setFormData] = useState({
    machine_id: "", breakdown_type: "", severity: "Minor", incident_time: "",
    description: "", diagnostics: "", downtime_minutes: "", repair_cost: "", status: "Reported",
  });

  const severityLevels = ["Minor", "Moderate", "Critical"];
  const statusOptions  = ["Reported", "Under Repair", "Resolved", "Pending Parts"];

  // ── Breakdowns — cached 2 min ─────────────────────────────────────────────
  const breakdownsCacheKey = ["moms_breakdowns"];
  const { data: breakdowns = [], isLoading: loading } = useQuery({
    queryKey:  breakdownsCacheKey,
    queryFn:   () => baseApi.get("/api/moms/breakdowns").then((r) => r.data || []),
    staleTime: 2 * 60 * 1000,
  });

  // ── Machines — reuses moms_machines cache shared with Assignments.jsx ─────
  const { data: machines = [] } = useQuery({
    queryKey:  ["moms_machines"],
    queryFn:   () => baseApi.get("/api/moms/machines").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const refetchBreakdowns = () => queryClient.invalidateQueries({ queryKey: breakdownsCacheKey });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await baseApi.post("/api/moms/breakdowns", formData);
      setShowReportModal(false);
      setFormData({ machine_id: "", breakdown_type: "", severity: "Minor", incident_time: "", description: "", diagnostics: "", downtime_minutes: "", repair_cost: "", status: "Reported" });
      refetchBreakdowns();
      Swal.fire({ icon: "success", title: "Breakdown Reported!", text: "The breakdown has been reported successfully.", confirmButtonColor: "#3b82f6", timer: 2000, timerProgressBar: true, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Failed to Report", text: error.response?.data?.message || "Failed to report breakdown.", confirmButtonColor: "#3b82f6" });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getSeverityColor = (severity) => ({
    Minor:    { bg: "#dbeafe", text: "#1e40af" },
    Moderate: { bg: "#fef3c7", text: "#92400e" },
    Critical: { bg: "#fee2e2", text: "#991b1b" },
  }[severity] || { bg: "#e5e7eb", text: "#374151" });

  const getStatusColor = (status) => ({
    Reported:        { bg: "#dbeafe", text: "#1e40af" },
    "Under Repair":  { bg: "#fef3c7", text: "#92400e" },
    Resolved:        { bg: "#d1fae5", text: "#065f46" },
    "Pending Parts": { bg: "#fed7aa", text: "#9a3412" },
  }[status] || { bg: "#e5e7eb", text: "#374151" });

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="row mb-3 mb-md-4 align-items-center">
          <div className="col">
            <h1 style={{ fontWeight: "bold", fontSize: "clamp(20px, 5vw, 28px)" }}>Breakdowns</h1>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" style={{ height: "42px", fontSize: "15px", fontWeight: "500", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }} onClick={() => setShowReportModal(true)}>
              <MdWarning size={20} /> Report Breakdown
            </button>
          </div>
        </div>

        <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #e9ecef" }}>
                  <tr>
                    {["Machine", "Type", "Severity", "Status", "Reported By", "Date", "Actions"].map((h) => (
                      <th key={h} style={{ padding: "16px", fontWeight: "600", color: "#495057", fontSize: "13px", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="7" className="text-center py-4">Loading...</td></tr>
                  ) : breakdowns.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5">
                        <MdBuild size={48} color="#cbd5e1" />
                        <p className="text-muted mt-2 mb-0">No breakdowns reported</p>
                      </td>
                    </tr>
                  ) : (
                    breakdowns.map((breakdown) => {
                      const severityColors = getSeverityColor(breakdown.severity);
                      const statusColors   = getStatusColor(breakdown.status);
                      return (
                        <tr key={breakdown.id}>
                          <td style={{ padding: "16px" }}>
                            <span style={{ color: "#3b82f6", fontWeight: "500", cursor: "pointer" }} onClick={() => navigate(`/moms/breakdowns/${breakdown.id}`)}>
                              {breakdown.machine_id}
                            </span>
                          </td>
                          <td style={{ padding: "16px" }}>{breakdown.breakdown_type}</td>
                          <td style={{ padding: "16px" }}>
                            <span className="badge" style={{ backgroundColor: severityColors.bg, color: severityColors.text, padding: "6px 12px", borderRadius: "6px", fontWeight: "500", fontSize: "12px" }}>{breakdown.severity}</span>
                          </td>
                          <td style={{ padding: "16px" }}>
                            <span className="badge" style={{ backgroundColor: statusColors.bg, color: statusColors.text, padding: "6px 12px", borderRadius: "6px", fontWeight: "500", fontSize: "12px" }}>{breakdown.status}</span>
                          </td>
                          <td style={{ padding: "16px" }}>{breakdown.reported_by || "Admin User"}</td>
                          <td style={{ padding: "16px" }}>{formatDate(breakdown.incident_time)}</td>
                          <td style={{ padding: "16px" }}>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button className="btn btn-sm" style={{ color: "#3b82f6", padding: "4px 12px", fontSize: "13px" }} onClick={() => navigate(`/moms/breakdowns/${breakdown.id}`)}>View</button>
                              {canEdit && (
                                <button className="btn btn-sm" style={{ color: "#6b7280", padding: "4px 12px", fontSize: "13px" }} onClick={() => navigate(`/moms/breakdowns/${breakdown.id}/edit`)}>Edit</button>
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

      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} centered size="lg">
        <Modal.Header closeButton style={{ borderBottom: "1px solid #e5e7eb" }}>
          <Modal.Title style={{ fontWeight: "600" }}>Report Breakdown</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ padding: "24px" }}>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: "500" }}>Machine <span style={{ color: "red" }}>*</span></Form.Label>
              <Form.Select name="machine_id" value={formData.machine_id} onChange={handleInputChange} required>
                <option value="">Select Machine</option>
                {machines.map((machine) => <option key={machine.id} value={machine.id}>{machine.machine_id} - {machine.category}</option>)}
              </Form.Select>
            </Form.Group>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: "500" }}>Breakdown Type <span style={{ color: "red" }}>*</span></Form.Label>
                  <Form.Control type="text" name="breakdown_type" value={formData.breakdown_type} onChange={handleInputChange} placeholder="e.g., Engine failure" required />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: "500" }}>Severity <span style={{ color: "red" }}>*</span></Form.Label>
                  <Form.Select name="severity" value={formData.severity} onChange={handleInputChange} required>
                    {severityLevels.map((level) => <option key={level}>{level}</option>)}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: "500" }}>Incident Time <span style={{ color: "red" }}>*</span></Form.Label>
                  <Form.Control type="datetime-local" name="incident_time" value={formData.incident_time} onChange={handleInputChange} required />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: "500" }}>Status <span style={{ color: "red" }}>*</span></Form.Label>
                  <Form.Select name="status" value={formData.status} onChange={handleInputChange} required>
                    {statusOptions.map((status) => <option key={status}>{status}</option>)}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: "500" }}>Description <span style={{ color: "red" }}>*</span></Form.Label>
              <Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe the breakdown in detail..." required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: "500" }}>Diagnostics</Form.Label>
              <Form.Control as="textarea" rows={3} name="diagnostics" value={formData.diagnostics} onChange={handleInputChange} placeholder="Initial diagnostics or findings..." />
            </Form.Group>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: "500" }}>Downtime (minutes)</Form.Label>
                  <Form.Control type="number" name="downtime_minutes" value={formData.downtime_minutes} onChange={handleInputChange} placeholder="Estimated or actual downtime" />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: "500" }}>Repair Cost</Form.Label>
                  <Form.Control type="number" step="0.01" name="repair_cost" value={formData.repair_cost} onChange={handleInputChange} placeholder="Estimated or actual repair cost" />
                </Form.Group>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer style={{ borderTop: "1px solid #e5e7eb", gap: "8px" }}>
            <Button variant="secondary" onClick={() => setShowReportModal(false)} style={{ borderRadius: "6px", backgroundColor: "#64748b" }}>Cancel</Button>
            <Button variant="primary" type="submit" style={{ borderRadius: "6px" }}>Report Breakdown</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Layout>
  );
}