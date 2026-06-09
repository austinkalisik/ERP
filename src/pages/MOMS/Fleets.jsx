import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { Modal, Button, Form } from "react-bootstrap";
import { MdAdd, MdEdit, MdDelete, MdSearch, MdFilterList, MdClose } from "react-icons/md";
import Swal from "sweetalert2";

const EMPTY_FORM    = { fleet_type: "", make_brand: "", model: "", registration_number: "", year_of_manufacture: new Date().getFullYear(), vin: "", color: "", purchase_price: "", date_of_acquisition: "", description: "" };
const EMPTY_FILTERS = { search: "", fleet_type: "", status: "", year_of_manufacture: "" };
const fleetTypes    = ["Excavator", "Dozer", "Dump Truck", "Loader", "Grader", "Crane", "Forklift", "Other"];
const statusOptions = ["Active", "Inactive", "Under Maintenance", "Retired"];
const statusStyle   = {
  Active:              { bg: "#d1fae5", color: "#065f46" },
  Inactive:            { bg: "#fee2e2", color: "#991b1b" },
  "Under Maintenance": { bg: "#fef3c7", color: "#92400e" },
  Retired:             { bg: "#f3f4f6", color: "#374151" },
};

export default function Fleets() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreate] = useState(false);
  const [showFilters,     setShowFilters] = useState(false);
  const [formData,        setFormData]   = useState(EMPTY_FORM);
  const [filters,         setFilters]    = useState(EMPTY_FILTERS);

  // ── Fleets — cached 5 min ─────────────────────────────────────────────────
  const cacheKey = ["moms_fleets"];
  const { data: fleets = [], isLoading: loading } = useQuery({
    queryKey:  cacheKey,
    queryFn:   () => baseApi.get("/api/moms/fleets").then((r) => r.data || []),
    staleTime: 5 * 60 * 1000,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: cacheKey });

  const availableYears = useMemo(() => {
    const years = [...new Set(fleets.map((f) => f.year_of_manufacture).filter(Boolean))];
    return years.sort((a, b) => b - a);
  }, [fleets]);

  const filteredFleets = useMemo(() => {
    return fleets.filter((fleet) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const haystack = [fleet.fleet_number, fleet.asset_number, fleet.registration_number, fleet.make_brand, fleet.model, fleet.fleet_type, fleet.vin, fleet.color, fleet.status, fleet.year_of_manufacture].map((v) => String(v || "").toLowerCase()).join(" ");
        if (!haystack.includes(q)) return false;
      }
      if (filters.fleet_type && fleet.fleet_type !== filters.fleet_type) return false;
      if (filters.status && (fleet.status || "Active") !== filters.status) return false;
      if (filters.year_of_manufacture && String(fleet.year_of_manufacture) !== filters.year_of_manufacture) return false;
      return true;
    });
  }, [fleets, filters]);

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== "search" && v !== "").length;
  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const handleInputChange  = (e) => { const { name, value } = e.target; setFormData((prev) => ({ ...prev, [name]: value })); };
  const handleFilterChange = (e) => { const { name, value } = e.target; setFilters((prev) => ({ ...prev, [name]: value })); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await baseApi.post("/api/moms/fleets", formData);
      setShowCreate(false);
      setFormData(EMPTY_FORM);
      refetch();
      Swal.fire({ icon: "success", title: "Fleet Added!", text: "The fleet has been created successfully.", confirmButtonColor: "#3b82f6", timer: 2000, timerProgressBar: true, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed to Create", text: err.response?.data?.message || "Failed to create fleet.", confirmButtonColor: "#3b82f6" });
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({ icon: "warning", title: "Delete Fleet?", text: "This action cannot be undone.", showCancelButton: true, confirmButtonColor: "#dc2626", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, delete it", cancelButtonText: "Cancel" });
    if (!confirm.isConfirmed) return;
    try {
      await baseApi.delete(`/api/moms/fleets/${id}`);
      refetch();
      Swal.fire({ icon: "success", title: "Deleted!", text: "Fleet has been deleted.", confirmButtonColor: "#3b82f6", timer: 1500, timerProgressBar: true, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed to Delete", text: err.response?.data?.message || "Failed to delete fleet.", confirmButtonColor: "#3b82f6" });
    }
  };

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="row mb-3 mb-md-4 align-items-center">
          <div className="col">
            <h1 style={{ fontWeight: "bold", fontSize: "clamp(20px, 5vw, 28px)" }}>Fleet Management</h1>
            <p className="text-muted mb-0" style={{ fontSize: "14px" }}>Manage and track all fleet equipment</p>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" style={{ height: "42px", fontSize: "15px", fontWeight: "500", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }} onClick={() => setShowCreate(true)}>
              <MdAdd size={20} /> Add Fleet
            </button>
          </div>
        </div>

        <div className="row g-2 mb-3 align-items-center">
          <div className="col-12 col-md">
            <div style={{ position: "relative" }}>
              <MdSearch size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
              <input type="text" className="form-control" name="search" placeholder="Search all columns..." value={filters.search} onChange={handleFilterChange} style={{ height: "42px", borderRadius: "8px", border: "1px solid #e5e7eb", paddingLeft: "38px" }} />
              {filters.search && (
                <button onClick={() => setFilters((p) => ({ ...p, search: "" }))} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0 }}>
                  <MdClose size={16} />
                </button>
              )}
            </div>
          </div>
          <div className="col-auto">
            <button className="btn" style={{ height: "42px", borderRadius: "8px", border: "1px solid #e5e7eb", backgroundColor: showFilters ? "#eff6ff" : "white", color: showFilters ? "#3b82f6" : "#374151", display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: "500", fontSize: "14px", whiteSpace: "nowrap" }} onClick={() => setShowFilters((p) => !p)}>
              <MdFilterList size={18} />Filters
              {activeFilterCount > 0 && <span style={{ backgroundColor: "#3b82f6", color: "white", borderRadius: "999px", fontSize: "11px", fontWeight: "700", padding: "1px 7px", marginLeft: "2px" }}>{activeFilterCount}</span>}
            </button>
          </div>
          {(activeFilterCount > 0 || filters.search) && (
            <div className="col-auto">
              <button className="btn btn-link" style={{ height: "42px", fontSize: "13px", color: "#6b7280", textDecoration: "none", padding: "0 4px" }} onClick={clearFilters}>Clear all</button>
            </div>
          )}
        </div>

        {showFilters && (
          <div className="row g-2 mb-3 p-3" style={{ backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
            <div className="col-12 col-sm-6 col-md-4 col-lg-3">
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px", display: "block" }}>Fleet Type</label>
              <Form.Select name="fleet_type" value={filters.fleet_type} onChange={handleFilterChange} style={{ height: "38px", fontSize: "14px", borderRadius: "6px" }}>
                <option value="">All Types</option>
                {fleetTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </Form.Select>
            </div>
            <div className="col-12 col-sm-6 col-md-4 col-lg-3">
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px", display: "block" }}>Status</label>
              <Form.Select name="status" value={filters.status} onChange={handleFilterChange} style={{ height: "38px", fontSize: "14px", borderRadius: "6px" }}>
                <option value="">All Statuses</option>
                {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </Form.Select>
            </div>
            <div className="col-12 col-sm-6 col-md-4 col-lg-3">
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px", display: "block" }}>Year of Manufacture</label>
              <Form.Select name="year_of_manufacture" value={filters.year_of_manufacture} onChange={handleFilterChange} style={{ height: "38px", fontSize: "14px", borderRadius: "6px" }}>
                <option value="">All Years</option>
                {availableYears.map((y) => <option key={y} value={String(y)}>{y}</option>)}
              </Form.Select>
            </div>
            <div className="col-12 col-sm-6 col-md-12 col-lg-3 d-flex align-items-end">
              <button className="btn btn-outline-secondary w-100" style={{ height: "38px", fontSize: "13px", borderRadius: "6px" }} onClick={() => setFilters((p) => ({ ...p, fleet_type: "", status: "", year_of_manufacture: "" }))}>Reset Filters</button>
            </div>
          </div>
        )}

        {!loading && <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px" }}>Showing <strong>{filteredFleets.length}</strong> of <strong>{fleets.length}</strong> fleet{fleets.length !== 1 ? "s" : ""}</p>}

        <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                  <tr>
                    {["Fleet No.", "Asset No.", "Type", "Make / Model", "Year", "Reg. Number", "Status", "Actions"].map((h) => (
                      <th key={h} style={{ padding: "16px", fontWeight: "600", fontSize: "13px", color: "#666" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="8" className="text-center py-5"><div className="spinner-border spinner-border-sm text-primary me-2" role="status" />Loading...</td></tr>
                  ) : filteredFleets.length === 0 ? (
                    <tr><td colSpan="8" className="text-center py-5"><p className="text-muted mb-1">No fleets match your filters.</p><button className="btn btn-link btn-sm" style={{ fontSize: "13px" }} onClick={clearFilters}>Clear all filters</button></td></tr>
                  ) : (
                    filteredFleets.map((fleet) => {
                      const ss = statusStyle[fleet.status] || statusStyle["Active"];
                      return (
                        <tr key={fleet.id}>
                          <td style={{ padding: "16px" }}><span style={{ color: "#3b82f6", fontWeight: "600", fontSize: "13px" }}>{fleet.fleet_number || "—"}</span></td>
                          <td style={{ padding: "16px", fontSize: "13px", color: "#374151" }}>{fleet.asset_number || "—"}</td>
                          <td style={{ padding: "16px" }}>{fleet.fleet_type}</td>
                          <td style={{ padding: "16px" }}><span style={{ fontWeight: "500" }}>{fleet.make_brand}</span><span style={{ color: "#6b7280" }}> {fleet.model}</span></td>
                          <td style={{ padding: "16px", color: "#6b7280" }}>{fleet.year_of_manufacture || "—"}</td>
                          <td style={{ padding: "16px" }}>{fleet.registration_number || <span style={{ color: "#9ca3af" }}>—</span>}</td>
                          <td style={{ padding: "16px" }}><span className="badge" style={{ backgroundColor: ss.bg, color: ss.color, padding: "6px 12px", borderRadius: "6px", fontWeight: "500" }}>{fleet.status || "Active"}</span></td>
                          <td style={{ padding: "16px" }}>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button className="btn btn-sm" style={{ color: "#3b82f6", padding: "4px 8px", fontSize: "13px" }} onClick={() => navigate(`/moms/fleets/${fleet.id}/edit`)}><MdEdit size={16} className="me-1" /> Edit</button>
                              <button className="btn btn-sm" style={{ color: "#dc2626", padding: "4px 8px", fontSize: "13px" }} onClick={() => handleDelete(fleet.id)}><MdDelete size={16} className="me-1" /> Delete</button>
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

      <Modal show={showCreateModal} onHide={() => setShowCreate(false)} centered size="lg">
        <Modal.Header closeButton style={{ borderBottom: "1px solid #e5e7eb" }}>
          <Modal.Title style={{ fontWeight: "600" }}>Add Fleet</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ padding: "24px" }}>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: "500" }}>Fleet Type <span style={{ color: "red" }}>*</span></Form.Label>
              <Form.Select name="fleet_type" value={formData.fleet_type} onChange={handleInputChange} required>
                <option value="">-- Select Fleet Type --</option>
                {fleetTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </Form.Select>
            </Form.Group>
            <div className="row">
              <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Make / Brand <span style={{ color: "red" }}>*</span></Form.Label><Form.Control type="text" name="make_brand" value={formData.make_brand} onChange={handleInputChange} placeholder="e.g., Caterpillar, Volvo" required /></Form.Group></div>
              <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Model <span style={{ color: "red" }}>*</span></Form.Label><Form.Control type="text" name="model" value={formData.model} onChange={handleInputChange} placeholder="e.g., D6T, L120H" required /></Form.Group></div>
            </div>
            <div className="row">
              <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Registration Number</Form.Label><Form.Control type="text" name="registration_number" value={formData.registration_number} onChange={handleInputChange} placeholder="License plate number" /></Form.Group></div>
              <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Year of Manufacture</Form.Label><Form.Control type="number" name="year_of_manufacture" value={formData.year_of_manufacture} onChange={handleInputChange} placeholder="2026" /></Form.Group></div>
            </div>
            <div className="row">
              <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>VIN</Form.Label><Form.Control type="text" name="vin" value={formData.vin} onChange={handleInputChange} placeholder="Vehicle Identification Number" /></Form.Group></div>
              <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Color</Form.Label><Form.Control type="text" name="color" value={formData.color} onChange={handleInputChange} placeholder="Vehicle color" /></Form.Group></div>
            </div>
            <div className="row">
              <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Purchase Price</Form.Label><Form.Control type="number" step="0.01" name="purchase_price" value={formData.purchase_price} onChange={handleInputChange} placeholder="0.00" /></Form.Group></div>
              <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Date of Acquisition</Form.Label><Form.Control type="date" name="date_of_acquisition" value={formData.date_of_acquisition} onChange={handleInputChange} /></Form.Group></div>
            </div>
            <Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Description</Form.Label><Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleInputChange} placeholder="Additional fleet details..." /></Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ borderTop: "1px solid #e5e7eb", gap: "8px" }}>
            <Button variant="secondary" onClick={() => setShowCreate(false)} style={{ borderRadius: "6px" }}>Cancel</Button>
            <Button variant="primary" type="submit" style={{ borderRadius: "6px" }}>Create Fleet</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Layout>
  );
}