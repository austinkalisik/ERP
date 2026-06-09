import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { Form, Button } from "react-bootstrap";
import { MdArrowBack, MdSave, MdCalendarToday } from "react-icons/md";
import Swal from "sweetalert2";

const frequencies = ["Daily", "Weekly", "Monthly", "Yearly", "Custom"];

export default function MaintenanceScheduleEdit() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const [saving,    setSaving]    = useState(false);
  const [formData,  setFormData]  = useState(null);

  // ── Single schedule — cached 5 min per ID ────────────────────────────────
  const scheduleCacheKey = ["moms_maintenance_schedule", id];
  const { data: schedule, isLoading: loading } = useQuery({
    queryKey:  scheduleCacheKey,
    queryFn:   () => baseApi.get(`/api/moms/maintenance/schedules/${id}`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    enabled:   !!id,
    onError:   () => {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to load schedule details.", confirmButtonColor: "#3b82f6" });
      navigate("/moms/maintenance/schedules");
    },
  });

  // ── Machines — reuses shared moms_machines cache ──────────────────────────
  const { data: machines = [] } = useQuery({
    queryKey:  ["moms_machines"],
    queryFn:   () => baseApi.get("/api/moms/machines").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  // Pre-fill form once (guard prevents overwrite on re-render)
  useEffect(() => {
    if (!schedule || formData) return;
    setFormData({
      machine_id:     schedule.machine?.id  || "",
      title:          schedule.title        || "",
      description:    schedule.description  || "",
      frequency:      schedule.frequency    || "Weekly",
      interval_value: schedule.interval_value || 1,
      next_due_date:  schedule.next_due_date  || "",
      is_active:      schedule.is_active ?? true,
    });
  }, [schedule]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await baseApi.put(`/api/moms/maintenance/schedules/${id}`, formData);
      // Invalidate this schedule + the shared schedules list
      queryClient.invalidateQueries({ queryKey: scheduleCacheKey });
      queryClient.invalidateQueries({ queryKey: ["moms_maintenance_schedules"] });
      await Swal.fire({ icon: "success", title: "Schedule Updated!", text: "Maintenance schedule has been updated successfully.", confirmButtonColor: "#8b5cf6", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      navigate("/moms/maintenance/schedules");
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed to Update", text: err.response?.data?.message || "Failed to update schedule.", confirmButtonColor: "#3b82f6" });
      setSaving(false);
    }
  };

  if (loading || !formData) {
    return <Layout><div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}><div className="spinner-border text-primary" role="status" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        {/* Header */}
        <div className="row mb-4 align-items-start">
          <div className="col">
            <button className="btn btn-link p-0 mb-2 text-muted d-inline-flex align-items-center gap-1" style={{ fontSize: "14px", textDecoration: "none" }} onClick={() => navigate("/moms/maintenance/schedules")}>
              <MdArrowBack size={16} /> Back to Schedules
            </button>
            <div className="d-flex align-items-center gap-3 mt-1">
              <div style={{ width: "48px", height: "48px", backgroundColor: "#8b5cf6", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MdCalendarToday size={24} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontWeight: "bold", fontSize: "clamp(18px, 4vw, 26px)", marginBottom: "4px" }}>Edit Maintenance Schedule</h1>
                <p className="text-muted mb-0" style={{ fontSize: "14px" }}>Schedule #{id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-body p-4">
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: "500" }}>Machine <span style={{ color: "red" }}>*</span></Form.Label>
                    <Form.Select name="machine_id" value={formData.machine_id} onChange={handleInputChange} required>
                      <option value="">Select Machine</option>
                      {machines.map((m) => <option key={m.id} value={m.id}>{m.machine_id} - {m.make} {m.model}</option>)}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: "500" }}>Title <span style={{ color: "red" }}>*</span></Form.Label>
                    <Form.Control type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g., Oil Change, Tire Rotation" required />
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
                        <Form.Text className="text-muted">E.g., 2 for "Every 2 weeks"</Form.Text>
                      </Form.Group>
                    </div>
                  </div>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: "500" }}>Next Due Date <span style={{ color: "red" }}>*</span></Form.Label>
                    <Form.Control type="date" name="next_due_date" value={formData.next_due_date} onChange={handleInputChange} required />
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <Form.Check type="checkbox" name="is_active" label="Active" checked={formData.is_active} onChange={handleInputChange} />
                  </Form.Group>
                  <div className="d-flex gap-2 justify-content-end">
                    <Button variant="secondary" style={{ borderRadius: "6px", minWidth: "100px" }} onClick={() => navigate("/moms/maintenance/schedules")} disabled={saving}>Cancel</Button>
                    <Button type="submit" style={{ borderRadius: "6px", minWidth: "130px", backgroundColor: "#8b5cf6", border: "none", display: "inline-flex", alignItems: "center", gap: "6px", justifyContent: "center" }} disabled={saving}>
                      <MdSave size={16} />{saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}