import { useState, useEffect } from "react";
import Layout from "../../components/layouts/DashboardLayout";
import { useNavigate, useParams } from "react-router-dom";
import baseApi from "../../api/baseApi";
import { Form, Button } from "react-bootstrap";
import { MdArrowBack, MdSave, MdBuild } from "react-icons/md";
import Swal from "sweetalert2";

const categories = ["Engine Parts", "Hydraulic Parts", "Electrical Parts", "Body Parts", "Filters", "Oils & Lubricants", "Tires & Tracks", "Other"];
const statuses   = ["In Stock", "Low Stock", "Out of Stock", "On Order"];

export default function InventoryEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const [formData, setFormData] = useState({
    part_number:   "",
    name:          "",
    description:   "",
    category:      "",
    quantity:      0,
    reorder_level: 5,
    unit_cost:     "",
    supplier:      "",
    status:        "In Stock",
  });

  useEffect(() => { fetchPart(); }, [id]);

  const fetchPart = async () => {
    try {
      const res = await baseApi.get(`/api/moms/inventory/parts/${id}`);
      const p = res.data;
      setFormData({
        part_number:   p.part_number   || "",
        name:          p.name          || "",
        description:   p.description   || "",
        category:      p.category      || "",
        quantity:      p.quantity      ?? 0,
        reorder_level: p.reorder_level ?? 5,
        unit_cost:     p.unit_cost     || "",
        supplier:      p.supplier      || "",
        status:        p.status        || "In Stock",
      });
    } catch (err) {
      console.error("Error fetching part:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load part details.",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await baseApi.put(`/api/moms/inventory/parts/${id}`, formData);
      await Swal.fire({
        icon: "success",
        title: "Part Updated!",
        text: "The part details have been saved successfully.",
        confirmButtonColor: "#8b5cf6",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      navigate("/moms/inventory");
    } catch (err) {
      console.error("Error updating part:", err);
      Swal.fire({
        icon: "error",
        title: "Failed to Update",
        text: err.response?.data?.message || "Failed to update part. Please try again.",
        confirmButtonColor: "#3b82f6",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
          <div className="spinner-border text-primary" role="status" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">

        {/* Header */}
        <div className="row mb-4 align-items-start">
          <div className="col">
            <button
              className="btn btn-link p-0 mb-2 text-muted d-inline-flex align-items-center gap-1"
              style={{ fontSize: "14px", textDecoration: "none" }}
              onClick={() => navigate("/moms/inventory")}
            >
              <MdArrowBack size={16} /> Back to Inventory
            </button>
            <div className="d-flex align-items-center gap-3 mt-1">
              <div style={{ width: "48px", height: "48px", backgroundColor: "#8b5cf6", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MdBuild size={24} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontWeight: "bold", fontSize: "clamp(18px, 4vw, 26px)", marginBottom: "4px" }}>Edit Part</h1>
                <p className="text-muted mb-0" style={{ fontSize: "14px" }}>Part #{id} — {formData.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="row justify-content-center">
          <div className="col-12 col-lg-9">
            <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-body p-4">
                <Form onSubmit={handleSubmit}>

                  <div className="row">
                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label style={{ fontWeight: "500" }}>Part Number <span style={{ color: "red" }}>*</span></Form.Label>
                        <Form.Control type="text" name="part_number" value={formData.part_number} onChange={handleInputChange} placeholder="e.g., PART-001" required />
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label style={{ fontWeight: "500" }}>Part Name <span style={{ color: "red" }}>*</span></Form.Label>
                        <Form.Control type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Engine Oil Filter" required />
                      </Form.Group>
                    </div>
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: "500" }}>Description</Form.Label>
                    <Form.Control as="textarea" rows={2} name="description" value={formData.description} onChange={handleInputChange} placeholder="Brief description of the part" />
                  </Form.Group>

                  <div className="row">
                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label style={{ fontWeight: "500" }}>Category</Form.Label>
                        <Form.Select name="category" value={formData.category} onChange={handleInputChange}>
                          <option value="">Select Category</option>
                          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </Form.Select>
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label style={{ fontWeight: "500" }}>Status</Form.Label>
                        <Form.Select name="status" value={formData.status} onChange={handleInputChange}>
                          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                        </Form.Select>
                        <Form.Text className="text-muted">Auto-set based on quantity, or override manually</Form.Text>
                      </Form.Group>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label style={{ fontWeight: "500" }}>Quantity <span style={{ color: "red" }}>*</span></Form.Label>
                        <Form.Control type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} min="0" required />
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label style={{ fontWeight: "500" }}>Reorder Level <span style={{ color: "red" }}>*</span></Form.Label>
                        <Form.Control type="number" name="reorder_level" value={formData.reorder_level} onChange={handleInputChange} min="0" required />
                        <Form.Text className="text-muted">Alert when stock falls below this number</Form.Text>
                      </Form.Group>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label style={{ fontWeight: "500" }}>Unit Cost <span style={{ color: "red" }}>*</span></Form.Label>
                        <div className="input-group">
                          <span className="input-group-text">$</span>
                          <Form.Control type="number" step="0.01" name="unit_cost" value={formData.unit_cost} onChange={handleInputChange} placeholder="0.00" required />
                        </div>
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group className="mb-3">
                        <Form.Label style={{ fontWeight: "500" }}>Supplier</Form.Label>
                        <Form.Control type="text" name="supplier" value={formData.supplier} onChange={handleInputChange} placeholder="Supplier name" />
                      </Form.Group>
                    </div>
                  </div>

                  <div className="d-flex gap-2 justify-content-end mt-2">
                    <Button variant="secondary" style={{ borderRadius: "6px", minWidth: "100px" }} onClick={() => navigate("/moms/inventory")} disabled={saving}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      style={{ borderRadius: "6px", minWidth: "130px", backgroundColor: "#8b5cf6", border: "none", display: "inline-flex", alignItems: "center", gap: "6px", justifyContent: "center" }}
                      disabled={saving}
                    >
                      <MdSave size={16} />
                      {saving ? "Saving..." : "Save Changes"}
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