import { useState, useEffect, useMemo } from "react";
import Layout from "../../components/layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import baseApi from "../../api/baseApi";
import { Modal, Button, Form } from "react-bootstrap";
import { MdAdd, MdEdit, MdDelete, MdSearch, MdFilterList, MdClose, MdBuild } from "react-icons/md";
import Swal from "sweetalert2";

const EMPTY_FORM = {
  part_number:   "",
  name:          "",
  description:   "",
  category:      "",
  quantity:      0,
  reorder_level: 5,
  unit_cost:     "",
  supplier:      "",
  status:        "In Stock",
};

const EMPTY_FILTERS = {
  search:   "",
  category: "",
  status:   "",
};

const categories = ["Engine Parts", "Hydraulic Parts", "Electrical Parts", "Body Parts", "Filters", "Oils & Lubricants", "Tires & Tracks", "Other"];
const statuses   = ["In Stock", "Low Stock", "Out of Stock", "On Order"];

const statusStyle = {
  "In Stock":     { bg: "#d1fae5", color: "#065f46" },
  "Low Stock":    { bg: "#fef3c7", color: "#92400e" },
  "Out of Stock": { bg: "#fee2e2", color: "#991b1b" },
  "On Order":     { bg: "#dbeafe", color: "#1e40af" },
};

export default function Inventory() {
  const navigate = useNavigate();
  const [parts, setParts]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [formData, setFormData]       = useState(EMPTY_FORM);
  const [filters, setFilters]         = useState(EMPTY_FILTERS);

  useEffect(() => { fetchParts(); }, []);

  const fetchParts = async () => {
    try {
      const res = await baseApi.get("/api/moms/inventory/parts");
      setParts(res.data || []);
    } catch (err) {
      console.error("Error fetching parts:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredParts = useMemo(() => {
    return parts.filter((p) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hay = [p.part_number, p.name, p.category, p.supplier, p.description]
          .map((v) => String(v || "").toLowerCase()).join(" ");
        if (!hay.includes(q)) return false;
      }
      if (filters.category && p.category !== filters.category) return false;
      if (filters.status   && p.status   !== filters.status)   return false;
      return true;
    });
  }, [parts, filters]);

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== "search" && v !== "").length;
  const clearFilters      = () => setFilters(EMPTY_FILTERS);

  const counts = useMemo(() => ({
    total:      parts.length,
    inStock:    parts.filter((p) => p.status === "In Stock").length,
    lowStock:   parts.filter((p) => p.status === "Low Stock").length,
    outOfStock: parts.filter((p) => p.status === "Out of Stock").length,
  }), [parts]);

  const handleInputChange  = (e) => { const { name, value } = e.target; setFormData((prev) => ({ ...prev, [name]: value })); };
  const handleFilterChange = (e) => { const { name, value } = e.target; setFilters((prev) => ({ ...prev, [name]: value })); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await baseApi.post("/api/moms/inventory/parts", formData);
      setShowCreate(false);
      setFormData(EMPTY_FORM);
      fetchParts();
      Swal.fire({
        icon: "success",
        title: "Part Added!",
        text: "The part has been added to inventory successfully.",
        confirmButtonColor: "#3b82f6",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error creating part:", err);
      Swal.fire({
        icon: "error",
        title: "Failed to Create",
        text: err.response?.data?.message || "Failed to create part. Please try again.",
        confirmButtonColor: "#3b82f6",
      });
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete Part?",
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
      await baseApi.delete(`/api/moms/inventory/parts/${id}`);
      fetchParts();
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Part has been removed from inventory.",
        confirmButtonColor: "#3b82f6",
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Error deleting part:", err);
      Swal.fire({
        icon: "error",
        title: "Failed to Delete",
        text: err.response?.data?.message || "Failed to delete part. Please try again.",
        confirmButtonColor: "#3b82f6",
      });
    }
  };

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">

        {/* Header */}
        <div className="row mb-3 mb-md-4 align-items-center">
          <div className="col">
            <h1 style={{ fontWeight: "bold", fontSize: "clamp(20px, 5vw, 28px)" }}>Machine Parts & Stock</h1>
            <p className="text-muted mb-0" style={{ fontSize: "14px" }}>Track parts, quantities, and reorder levels</p>
          </div>
          <div className="col-auto">
            <button
              className="btn btn-primary"
              style={{ height: "42px", fontSize: "15px", fontWeight: "500", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }}
              onClick={() => setShowCreate(true)}
            >
              <MdAdd size={20} /> Add Part
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row g-3 mb-4">
          {[
            { label: "Total Parts",  value: counts.total,      bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
            { label: "In Stock",     value: counts.inStock,    bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
            { label: "Low Stock",    value: counts.lowStock,   bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
            { label: "Out of Stock", value: counts.outOfStock, bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" },
          ].map((card) => (
            <div className="col-6 col-md-3" key={card.label}>
              <div
                className="card"
                style={{ borderRadius: "10px", border: `1px solid ${card.border}`, backgroundColor: card.bg, cursor: "pointer" }}
                onClick={() => {
                  if (card.label !== "Total Parts") {
                    setFilters((p) => ({ ...p, status: p.status === card.label ? "" : card.label }));
                  } else {
                    clearFilters();
                  }
                }}
              >
                <div className="card-body py-3 px-3">
                  <p style={{ fontSize: "12px", color: card.color, fontWeight: "600", marginBottom: "4px", textTransform: "uppercase" }}>{card.label}</p>
                  <p style={{ fontSize: "24px", fontWeight: "700", color: card.color, marginBottom: 0 }}>{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filter Bar */}
        <div className="row g-2 mb-3 align-items-center">
          <div className="col-12 col-md">
            <div style={{ position: "relative" }}>
              <MdSearch size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
              <input
                type="text" className="form-control" name="search"
                placeholder="Search by part number, name, category, supplier..."
                value={filters.search} onChange={handleFilterChange}
                style={{ height: "42px", borderRadius: "8px", border: "1px solid #e5e7eb", paddingLeft: "38px" }}
              />
              {filters.search && (
                <button onClick={() => setFilters((p) => ({ ...p, search: "" }))} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0 }}>
                  <MdClose size={16} />
                </button>
              )}
            </div>
          </div>
          <div className="col-auto">
            <button
              className="btn"
              style={{ height: "42px", borderRadius: "8px", border: "1px solid #e5e7eb", backgroundColor: showFilters ? "#eff6ff" : "white", color: showFilters ? "#3b82f6" : "#374151", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: "500", fontSize: "14px", whiteSpace: "nowrap" }}
              onClick={() => setShowFilters((p) => !p)}
            >
              <MdFilterList size={18} />
              Filters
              {activeFilterCount > 0 && (
                <span style={{ backgroundColor: "#3b82f6", color: "white", borderRadius: "999px", fontSize: "11px", fontWeight: "700", padding: "1px 7px", marginLeft: "2px" }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
          {(activeFilterCount > 0 || filters.search) && (
            <div className="col-auto">
              <button className="btn btn-link" style={{ height: "42px", fontSize: "13px", color: "#6b7280", textDecoration: "none", padding: "0 4px" }} onClick={clearFilters}>
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="row g-2 mb-3 p-3" style={{ backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
            <div className="col-12 col-sm-6 col-md-4 col-lg-3">
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px", display: "block" }}>Category</label>
              <Form.Select name="category" value={filters.category} onChange={handleFilterChange} style={{ height: "38px", fontSize: "14px", borderRadius: "6px" }}>
                <option value="">All Categories</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </Form.Select>
            </div>
            <div className="col-12 col-sm-6 col-md-4 col-lg-3">
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px", display: "block" }}>Status</label>
              <Form.Select name="status" value={filters.status} onChange={handleFilterChange} style={{ height: "38px", fontSize: "14px", borderRadius: "6px" }}>
                <option value="">All Statuses</option>
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </Form.Select>
            </div>
            <div className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" style={{ height: "38px", fontSize: "13px", borderRadius: "6px" }} onClick={() => setFilters((p) => ({ ...p, category: "", status: "" }))}>
                Reset Filters
              </button>
            </div>
          </div>
        )}

        {/* Results count */}
        {!loading && (
          <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}>
            Showing <strong>{filteredParts.length}</strong> of <strong>{parts.length}</strong> part{parts.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Table */}
        <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                  <tr>
                    {["Part Number", "Name", "Category", "Qty", "Reorder Lvl", "Unit Cost", "Supplier", "Status", "Actions"].map((h) => (
                      <th key={h} style={{ padding: "16px", fontWeight: "600", fontSize: "13px", color: "#666" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="text-center py-5">
                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />Loading...
                      </td>
                    </tr>
                  ) : filteredParts.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-5">
                        <div style={{ color: "#9ca3af" }}>
                          <MdBuild size={32} style={{ marginBottom: "8px", opacity: 0.4 }} />
                          <p className="mb-1">{filters.search || activeFilterCount > 0 ? "No parts match your filters." : "No parts found. Click \"Add Part\" to get started."}</p>
                          {(filters.search || activeFilterCount > 0) && (
                            <button className="btn btn-link btn-sm" style={{ fontSize: "13px" }} onClick={clearFilters}>Clear all filters</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredParts.map((part) => {
                      const ss    = statusStyle[part.status] || statusStyle["In Stock"];
                      const isLow = part.status === "Low Stock" || part.status === "Out of Stock";
                      return (
                        <tr key={part.id}>
                          <td style={{ padding: "16px" }}><span style={{ color: "#3b82f6", fontWeight: "600", fontSize: "13px" }}>{part.part_number}</span></td>
                          <td style={{ padding: "16px", fontWeight: "500" }}>{part.name}</td>
                          <td style={{ padding: "16px", color: "#6b7280" }}>{part.category || "—"}</td>
                          <td style={{ padding: "16px" }}><span style={{ fontWeight: "600", color: isLow ? "#b91c1c" : "#111827" }}>{part.quantity}</span></td>
                          <td style={{ padding: "16px", color: "#6b7280" }}>{part.reorder_level}</td>
                          <td style={{ padding: "16px" }}>${parseFloat(part.unit_cost || 0).toFixed(2)}</td>
                          <td style={{ padding: "16px", color: "#6b7280" }}>{part.supplier || "—"}</td>
                          <td style={{ padding: "16px" }}>
                            <span className="badge" style={{ backgroundColor: ss.bg, color: ss.color, padding: "6px 12px", borderRadius: "6px", fontWeight: "500" }}>{part.status}</span>
                          </td>
                          <td style={{ padding: "16px" }}>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button className="btn btn-sm" style={{ color: "#3b82f6", padding: "4px 8px", fontSize: "13px" }} onClick={() => navigate(`/moms/inventory/${part.id}/edit`)}>
                                <MdEdit size={16} className="me-1" /> Edit
                              </button>
                              <button className="btn btn-sm" style={{ color: "#dc2626", padding: "4px 8px", fontSize: "13px" }} onClick={() => handleDelete(part.id)}>
                                <MdDelete size={16} className="me-1" /> Delete
                              </button>
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

      {/* Create Part Modal */}
      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered size="lg">
        <Modal.Header closeButton style={{ borderBottom: "1px solid #e5e7eb" }}>
          <Modal.Title style={{ fontWeight: "600" }}>Add New Part</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ padding: "24px" }}>
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
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: "500" }}>Category</Form.Label>
              <Form.Select name="category" value={formData.category} onChange={handleInputChange}>
                <option value="">Select Category</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </Form.Select>
            </Form.Group>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: "500" }}>Initial Quantity <span style={{ color: "red" }}>*</span></Form.Label>
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
          </Modal.Body>
          <Modal.Footer style={{ borderTop: "1px solid #e5e7eb", gap: "8px" }}>
            <Button variant="secondary" onClick={() => setShowCreate(false)} style={{ borderRadius: "6px" }}>Cancel</Button>
            <Button variant="primary" type="submit" style={{ borderRadius: "6px" }}>Create Part</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Layout>
  );
}