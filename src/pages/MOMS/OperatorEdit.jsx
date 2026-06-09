import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { MdArrowBack, MdSave } from "react-icons/md";
import { Form } from "react-bootstrap";
import Swal from "sweetalert2";

export default function OperatorEdit() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const [saving,       setSaving]       = useState(false);
  const [operatorName, setOperatorName] = useState("");
  const [formData,     setFormData]     = useState(null);

  // ── Single operator — cached 5 min per ID ────────────────────────────────
  // Shared key with OperatorView so navigating View → Edit is instant from cache
  const { data: operator, isLoading: loading } = useQuery({
    queryKey:  ["moms_operator", id],
    queryFn:   () => baseApi.get(`/api/moms/operators/${id}`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    enabled:   !!id,
    onError:   () => {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to load operator details", confirmButtonColor: "#3b82f6" });
      navigate("/moms/operators");
    },
  });

  // Pre-fill form once (guard prevents overwrite)
  useEffect(() => {
    if (!operator || formData) return;
    setOperatorName(operator.user_name || `Operator ${operator.id}`);
    setFormData({
      license_number:     operator.license_number     || "",
      license_type:       operator.license_type       || "",
      license_expiry:     operator.license_expiry     || "",
      certification:      operator.certification      || "",
      total_hours:        operator.total_hours        || 0,
      performance_rating: operator.performance_rating || 0,
      notes:              operator.notes              || "",
      status:             operator.status             || "Active",
    });
  }, [operator]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await baseApi.put(`/api/moms/operators/${id}`, formData);
      // Invalidate this operator's cache + the operators list
      queryClient.invalidateQueries({ queryKey: ["moms_operator", id] });
      queryClient.invalidateQueries({ queryKey: ["moms_operators"] });
      Swal.fire({ icon: "success", title: "Success!", text: "Operator updated successfully!", confirmButtonColor: "#3b82f6", timer: 2000, showConfirmButton: false });
      setTimeout(() => navigate(`/moms/operators/${id}`), 2000);
    } catch (error) {
      Swal.fire({ icon: "error", title: "Update Failed", text: error.response?.data?.message || "Failed to update operator.", confirmButtonColor: "#3b82f6" });
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
          <button className="btn btn-link text-decoration-none p-0 mb-2" onClick={() => navigate("/moms/operators")} style={{ color: "#3b82f6", fontSize: "14px" }}>
            <MdArrowBack className="me-1" /> Back to Operators
          </button>
          <h1 style={{ fontWeight: "bold", fontSize: "28px", margin: 0 }}>Edit Operator</h1>
        </div>

        <div className="row">
          <div className="col-lg-8">
            <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-body" style={{ padding: "32px" }}>
                {/* Read-only operator identity */}
                <div className="mb-4 p-3" style={{ background: "#f8fafc", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                  <p style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px" }}>Operator</p>
                  <p style={{ fontSize: "15px", fontWeight: "600", margin: 0 }}>{operatorName}</p>
                  <p style={{ fontSize: "12px", color: "#9ca3af", margin: "2px 0 0" }}>The linked user account cannot be changed here. To reassign, delete this profile and create a new one.</p>
                </div>

                <Form onSubmit={handleSubmit}>
                  <div className="row g-4">
                    <div className="col-12">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>License Number</Form.Label>
                        <Form.Control type="text" name="license_number" value={formData.license_number} onChange={handleInputChange} required style={{ height: "42px" }} />
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>License Type</Form.Label>
                        <Form.Control type="text" name="license_type" value={formData.license_type} onChange={handleInputChange} style={{ height: "42px" }} />
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>License Expiry</Form.Label>
                        <Form.Control type="date" name="license_expiry" value={formData.license_expiry} onChange={handleInputChange} style={{ height: "42px" }} />
                      </Form.Group>
                    </div>
                    <div className="col-12">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Certification</Form.Label>
                        <Form.Control type="text" name="certification" value={formData.certification} onChange={handleInputChange} style={{ height: "42px" }} />
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Total Hours</Form.Label>
                        <Form.Control type="number" name="total_hours" value={formData.total_hours} onChange={handleInputChange} min="0" style={{ height: "42px" }} />
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Performance Rating (0–5)</Form.Label>
                        <Form.Control type="number" name="performance_rating" value={formData.performance_rating} onChange={handleInputChange} min="0" max="5" step="0.01" style={{ height: "42px" }} />
                      </Form.Group>
                    </div>
                    <div className="col-12">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Notes</Form.Label>
                        <Form.Control as="textarea" rows={4} name="notes" value={formData.notes} onChange={handleInputChange} />
                      </Form.Group>
                    </div>
                    <div className="col-12">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Status</Form.Label>
                        <Form.Select name="status" value={formData.status} onChange={handleInputChange} required style={{ height: "42px" }}>
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="On Leave">On Leave</option>
                        </Form.Select>
                      </Form.Group>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-3 mt-4 pt-4" style={{ borderTop: "1px solid #e5e7eb" }}>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(`/moms/operators/${id}`)} disabled={saving} style={{ height: "42px", fontSize: "15px", fontWeight: "500", borderRadius: "8px", minWidth: "100px" }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ height: "42px", fontSize: "15px", fontWeight: "500", borderRadius: "8px", minWidth: "120px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <MdSave size={20} />{saving ? "Saving..." : "Update Operator"}
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