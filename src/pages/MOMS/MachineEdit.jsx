import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { MdArrowBack, MdSave } from "react-icons/md";
import { Form } from "react-bootstrap";
import Swal from "sweetalert2";

const categories = ["Excavator", "Dozer", "Dump Truck", "Loader", "Grader"];

export default function MachineEdit() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const [saving,    setSaving]    = useState(false);
  const [machineId, setMachineId] = useState("");
  const [formData,  setFormData]  = useState(null);

  // ── Single machine — reuses moms_machine per-ID cache ────────────────────
  // If user came from MachineView, data is already cached
  const { data: machine, isLoading: loading } = useQuery({
    queryKey:  ["moms_machine", id],
    queryFn:   () => baseApi.get(`/api/moms/machines/${id}`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    enabled:   !!id,
    onError:   () => {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to load machine details", confirmButtonColor: "#3b82f6" });
      navigate("/moms/machines");
    },
  });

  // Pre-fill form once data arrives
  useEffect(() => {
    if (!machine || formData) return;
    setMachineId(machine.machine_id);
    setFormData({
      category:         machine.category,
      make:             machine.make,
      model:            machine.model,
      engine_hours:     machine.engine_hours,
      fuel_capacity:    machine.fuel_capacity,
      status:           machine.status,
      location:         machine.location,
      last_maintenance: machine.last_maintenance || "",
      next_maintenance: machine.next_maintenance || "",
    });
  }, [machine]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await baseApi.put(`/api/moms/machines/${id}`, formData);
      // Invalidate this machine's cache + the shared list
      queryClient.invalidateQueries({ queryKey: ["moms_machine",  id] });
      queryClient.invalidateQueries({ queryKey: ["moms_machines"]    });
      Swal.fire({ icon: "success", title: "Success!", text: "Machine updated successfully!", confirmButtonColor: "#3b82f6", timer: 2000, showConfirmButton: false });
      setTimeout(() => navigate(`/moms/machines/${id}`), 2000);
    } catch (error) {
      Swal.fire({ icon: "error", title: "Update Failed", text: error.response?.data?.message || "Failed to update machine.", confirmButtonColor: "#3b82f6" });
      setSaving(false);
    }
  };

  if (loading || !formData) {
    return <Layout><div className="container-fluid px-4"><div className="text-center py-5">Loading...</div></div></Layout>;
  }

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="mb-4">
          <button className="btn btn-link text-decoration-none p-0 mb-2" onClick={() => navigate("/moms/machines")} style={{ color: "#3b82f6", fontSize: "14px" }}>
            <MdArrowBack className="me-1" /> Back to Machines
          </button>
          <h1 style={{ fontWeight: "bold", fontSize: "28px", margin: 0 }}>Edit Machine</h1>
        </div>

        <div className="row">
          <div className="col-lg-8">
            <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-body" style={{ padding: "32px" }}>
                <Form onSubmit={handleSubmit}>
                  <div className="row g-4">
                    <div className="col-12">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Machine ID</Form.Label>
                        <Form.Control type="text" value={machineId} disabled style={{ height: "42px", backgroundColor: "#f3f4f6", cursor: "not-allowed" }} />
                        <Form.Text className="text-muted">Machine ID is generated automatically and cannot be changed.</Form.Text>
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Make</Form.Label>
                        <Form.Control type="text" name="make" value={formData.make} onChange={handleInputChange} required style={{ height: "42px" }} />
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Model</Form.Label>
                        <Form.Control type="text" name="model" value={formData.model} onChange={handleInputChange} required style={{ height: "42px" }} />
                      </Form.Group>
                    </div>
                    <div className="col-12">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Category</Form.Label>
                        <Form.Select name="category" value={formData.category} onChange={handleInputChange} required style={{ height: "42px" }}>
                          <option value="">Select Category</option>
                          {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                        </Form.Select>
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Engine Hours</Form.Label>
                        <Form.Control type="number" name="engine_hours" value={formData.engine_hours} onChange={handleInputChange} required min="0" style={{ height: "42px" }} />
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Fuel Capacity (L)</Form.Label>
                        <Form.Control type="number" name="fuel_capacity" value={formData.fuel_capacity} onChange={handleInputChange} required min="0" step="0.01" style={{ height: "42px" }} />
                      </Form.Group>
                    </div>
                    <div className="col-12">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Location</Form.Label>
                        <Form.Control type="text" name="location" value={formData.location} onChange={handleInputChange} required style={{ height: "42px" }} />
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Last Maintenance</Form.Label>
                        <Form.Control type="date" name="last_maintenance" value={formData.last_maintenance} onChange={handleInputChange} style={{ height: "42px" }} />
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Next Maintenance</Form.Label>
                        <Form.Control type="date" name="next_maintenance" value={formData.next_maintenance} onChange={handleInputChange} style={{ height: "42px" }} />
                      </Form.Group>
                    </div>
                    <div className="col-12">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Status</Form.Label>
                        <Form.Select name="status" value={formData.status} onChange={handleInputChange} required style={{ height: "42px" }}>
                          <option value="Active">Active</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Inactive">Inactive</option>
                        </Form.Select>
                      </Form.Group>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-3 mt-4 pt-4" style={{ borderTop: "1px solid #e5e7eb" }}>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(`/moms/machines/${id}`)} disabled={saving} style={{ height: "42px", fontSize: "15px", fontWeight: "500", borderRadius: "8px", minWidth: "100px" }}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ height: "42px", fontSize: "15px", fontWeight: "500", borderRadius: "8px", minWidth: "120px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <MdSave size={20} />{saving ? "Saving..." : "Update Machine"}
                    </button>
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