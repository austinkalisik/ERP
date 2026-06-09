import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { Modal, Button, Form } from "react-bootstrap";
import { MdAdd, MdEdit, MdDelete, MdCalendarToday, MdInfo } from "react-icons/md";
import Swal from "sweetalert2";

const frequencies = ["Daily", "Weekly", "Monthly", "Yearly", "Custom"];
const EMPTY_FORM  = { machine_id: "", title: "", description: "", frequency: "Weekly", interval_value: 1, hour_interval: "", last_engine_hours: "", next_due_date: "", is_active: true };

export default function MaintenanceSchedules() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData,        setFormData]        = useState(EMPTY_FORM);

  // ── Schedules — cached 5 min ─────────────────────────────────────────────
  // Shared with: MaintenanceLogs, MaintenanceLogDetail, MaintenanceScheduleEdit
  const schedulesCacheKey = ["moms_maintenance_schedules"];
  const { data: schedules = [], isLoading: loading } = useQuery({
    queryKey:  schedulesCacheKey,
    queryFn:   () => baseApi.get("/api/moms/maintenance/schedules").then((r) => r.data || []),
    staleTime: 5 * 60 * 1000,
  });

  // ── Machines — reuses shared moms_machines cache ──────────────────────────
  const { data: machines = [] } = useQuery({
    queryKey:  ["moms_machines"],
    queryFn: () => baseApi.get("/api/moms/machines").then((r) => r.data?.data || r.data || []),
    staleTime: 5 * 60 * 1000,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: schedulesCacheKey });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const resetForm = () => setFormData(EMPTY_FORM);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await baseApi.post("/api/moms/maintenance/schedules", {
        ...formData,
        hour_interval:     formData.hour_interval     ? Number(formData.hour_interval)     : null,
        last_engine_hours: formData.last_engine_hours ? Number(formData.last_engine_hours) : null,
      });
      setShowCreateModal(false); resetForm(); refetch();
      Swal.fire({ icon: "success", title: "Schedule Created!", text: "Maintenance schedule has been created successfully.", confirmButtonColor: "#8b5cf6", timer: 2000, timerProgressBar: true, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Failed to Create", text: error.response?.data?.message || "Failed to create maintenance schedule.", confirmButtonColor: "#3b82f6" });
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({ icon: "warning", title: "Delete Schedule?", text: "This action cannot be undone.", showCancelButton: true, confirmButtonColor: "#dc2626", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, delete it" });
    if (!confirm.isConfirmed) return;
    try {
      await baseApi.delete(`/api/moms/maintenance/schedules/${id}`);
      refetch();
      Swal.fire({ icon: "success", title: "Deleted!", timer: 1500, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Failed to Delete", confirmButtonColor: "#3b82f6" });
    }
  };

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        {/* Header */}
        <div className="row mb-4 align-items-center">
          <div className="col">
            <h1 style={{ fontWeight: "bold", fontSize: "clamp(20px, 5vw, 28px)" }}>Maintenance Schedules</h1>
            <p className="text-muted mb-0" style={{ fontSize: "14px" }}>Plan and schedule recurring maintenance activities</p>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" style={{ height: "42px", fontSize: "15px", fontWeight: "500", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }} onClick={() => setShowCreateModal(true)}>
              <MdAdd size={20} /> Create Schedule
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                  <tr>{["Machine","Title","Frequency","Hour Interval","Next Due Hours","Next Due Date","Status","Actions"].map((h) => <th key={h} style={{ padding: "16px", fontWeight: "600", fontSize: "13px", color: "#666" }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="8" className="text-center py-4">Loading...</td></tr>
                  ) : schedules.length === 0 ? (
                    <tr><td colSpan="8" className="text-center py-5"><MdCalendarToday size={48} color="#9ca3af" /><p className="text-muted mt-2 mb-0">No schedules found.</p></td></tr>
                  ) : (
                    schedules.map((schedule) => (
                      <tr key={schedule.id}>
                        <td style={{ padding: "16px" }}><span style={{ color: "#3b82f6", fontWeight: "500" }}>{schedule.machine?.machine_id || "N/A"}</span></td>
                        <td style={{ padding: "16px" }}>{schedule.title}</td>
                        <td style={{ padding: "16px" }}>{schedule.frequency}{schedule.interval_value > 1 && ` (Every ${schedule.interval_value})`}</td>
                        <td style={{ padding: "16px" }}>{schedule.hour_interval ? <span style={{ color: "#0ea5e9", fontWeight: "600" }}>Every {schedule.hour_interval} hrs</span> : <span style={{ color: "#9ca3af" }}>—</span>}</td>
                        <td style={{ padding: "16px" }}>{schedule.next_due_hours ? <span style={{ fontWeight: "600" }}>{schedule.next_due_hours} hrs</span> : <span style={{ color: "#9ca3af" }}>—</span>}</td>
                        <td style={{ padding: "16px" }}>{schedule.next_due_date ? new Date(schedule.next_due_date).toLocaleDateString() : "Not set"}</td>
                        <td style={{ padding: "16px" }}>
                          <span className="badge" style={{ backgroundColor: schedule.is_active ? "#d1fae5" : "#fee2e2", color: schedule.is_active ? "#065f46" : "#991b1b", padding: "6px 12px", borderRadius: "6px", fontWeight: "500" }}>
                            {schedule.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button className="btn btn-sm" style={{ color: "#3b82f6", padding: "4px 8px", fontSize: "13px" }} onClick={() => navigate(`/moms/maintenance/schedules/${schedule.id}/edit`)}>
                              <MdEdit size={16} className="me-1" /> Edit
                            </button>
                            <button className="btn btn-sm" style={{ color: "#dc2626", padding: "4px 8px", fontSize: "13px" }} onClick={() => handleDelete(schedule.id)}>
                              <MdDelete size={16} className="me-1" /> Delete
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
      <Modal show={showCreateModal} onHide={() => { setShowCreateModal(false); resetForm(); }} centered size="lg">
        <Modal.Header closeButton style={{ borderBottom: "1px solid #e5e7eb" }}>
          <Modal.Title style={{ fontWeight: "600" }}>Create Maintenance Schedule</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ padding: "24px" }}>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: "500" }}>Machine <span style={{ color: "red" }}>*</span></Form.Label>
              <Form.Select name="machine_id" value={formData.machine_id} onChange={handleInputChange} required>
                <option value="">Select Machine</option>
                {machines.map((m) => <option key={m.id} value={m.id}>{m.machine_id} — {m.make} {m.model}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: "500" }}>Title <span style={{ color: "red" }}>*</span></Form.Label>
              <Form.Control type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g., 250-Hour Oil Change" required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: "500" }}>Description <span style={{ color: "red" }}>*</span></Form.Label>
              <Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe the maintenance task..." required />
            </Form.Group>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: "500" }}>Frequency <span style={{ color: "red" }}>*</span></Form.Label>
                  <Form.Select name="frequency" value={formData.frequency} onChange={handleInputChange} required>
                    {frequencies.map((f) => <option key={f} value={f}>{f}</option>)}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: "500" }}>Interval Value <span style={{ color: "red" }}>*</span></Form.Label>
                  <Form.Control type="number" name="interval_value" value={formData.interval_value} onChange={handleInputChange} min="1" required />
                  <Form.Text className="text-muted">E.g., 2 = "Every 2 weeks"</Form.Text>
                </Form.Group>
              </div>
            </div>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: "500" }}>Next Due Date <span style={{ color: "red" }}>*</span></Form.Label>
              <Form.Control type="date" name="next_due_date" value={formData.next_due_date} onChange={handleInputChange} required />
            </Form.Group>

            {/* Hour-based PMS panel */}
            <div style={{ backgroundColor: "#f0f9ff", borderRadius: "10px", padding: "16px", border: "1px solid #bae6fd", marginBottom: "16px" }}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <MdInfo size={18} color="#0ea5e9" />
                <span style={{ fontWeight: "600", fontSize: "14px", color: "#0369a1" }}>Engine Hours–Based PMS (Heavy Equipment)</span>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-0">
                    <Form.Label style={{ fontWeight: "500", fontSize: "14px" }}>Hour Interval</Form.Label>
                    <Form.Control type="number" name="hour_interval" value={formData.hour_interval} onChange={handleInputChange} min="1" placeholder="e.g., 250" />
                    <Form.Text className="text-muted">PMS every X engine hours</Form.Text>
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-0">
                    <Form.Label style={{ fontWeight: "500", fontSize: "14px" }}>Current Engine Hours</Form.Label>
                    <Form.Control type="number" name="last_engine_hours" value={formData.last_engine_hours} onChange={handleInputChange} min="0" placeholder="e.g., 1500" />
                    <Form.Text className="text-muted">
                      Next due at:{" "}
                      {formData.hour_interval && formData.last_engine_hours
                        ? `${Number(formData.last_engine_hours) + Number(formData.hour_interval)} hrs`
                        : "—"}
                    </Form.Text>
                  </Form.Group>
                </div>
              </div>
            </div>

            <Form.Group>
              <Form.Check type="checkbox" name="is_active" label="Active" checked={formData.is_active} onChange={handleInputChange} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ borderTop: "1px solid #e5e7eb", gap: "8px" }}>
            <Button variant="secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</Button>
            <Button variant="primary" type="submit">Create Schedule</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Layout>
  );
}