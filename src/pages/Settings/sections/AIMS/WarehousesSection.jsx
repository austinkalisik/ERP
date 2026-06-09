import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import baseApi from "../../../../api/baseApi";
import Swal from "sweetalert2";
import { MdAdd, MdEdit, MdDelete, MdWarehouse } from "react-icons/md";

const EMPTY_FORM = { name: "", location: "", description: "" };

export default function WarehousesSection() {
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);

  // ── AIMS warehouses — cached 5 min ────────────────────────────────────────
  // Shared with AddItem.jsx / EditItem.jsx (aims_warehouses) if you expose that key
  const cacheKey = ["aims_warehouses"];
  const { data: warehouses = [], isLoading: loading } = useQuery({
    queryKey:  cacheKey,
    queryFn:   () => baseApi.get("/api/aims/warehouses").then((r) => r.data.data ?? r.data),
    staleTime: 5 * 60 * 1000,
  });

  const refetch    = () => queryClient.invalidateQueries({ queryKey: cacheKey });
  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit   = (w) => { setEditing(w); setForm({ name: w.name, location: w.location || "", description: w.description || "" }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return Swal.fire("Validation", "Warehouse name is required", "warning");
    setSaving(true);
    try {
      if (editing) await baseApi.put(`/api/aims/warehouses/${editing.id}`, form);
      else         await baseApi.post("/api/aims/warehouses", form);
      setShowModal(false); refetch();
      Swal.fire({ icon: "success", title: editing ? "Warehouse Updated" : "Warehouse Added", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to save warehouse", "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Warehouse?", text: "Items assigned to this location will need to be updated.", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#dc3545", confirmButtonText: "Yes, delete",
    });
    if (!result.isConfirmed) return;
    try {
      await baseApi.delete(`/api/aims/warehouses/${id}`);
      refetch();
      Swal.fire({ icon: "success", title: "Deleted", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to delete warehouse", "error");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Warehouses & Locations</h4>
          <p className="text-muted mb-0" style={{ fontSize: 14 }}>Manage storage locations for inventory items</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openCreate}>
          <MdAdd size={18} /> Add Warehouse
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ padding: "14px 16px" }}>Warehouse Name</th>
                <th style={{ padding: "14px 16px" }}>Location</th>
                <th style={{ padding: "14px 16px" }}>Description</th>
                <th style={{ padding: "14px 16px", width: 100 }} className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="text-center py-4">Loading...</td></tr>
              ) : warehouses.length === 0 ? (
                <tr><td colSpan="4" className="text-center text-muted py-4">No warehouses found</td></tr>
              ) : (
                warehouses.map((w) => (
                  <tr key={w.id}>
                    <td style={{ padding: "14px 16px" }}>
                      <div className="d-flex align-items-center gap-2">
                        <MdWarehouse size={18} color="#6366f1" />
                        <span style={{ fontWeight: 600 }}>{w.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>{w.location || "—"}</td>
                    <td style={{ padding: "14px 16px", color: "#6b7280" }}>{w.description || "—"}</td>
                    <td style={{ padding: "14px 16px" }} className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(w)}><MdEdit size={15} /></button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(w.id)}><MdDelete size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setShowModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">{editing ? "Edit Warehouse" : "Add Warehouse"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Warehouse Name <span className="text-danger">*</span></label>
                  <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Main Warehouse" />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Location</label>
                  <input className="form-control" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Building A, Floor 1" />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Description</label>
                  <textarea className="form-control" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional notes about this location" style={{ resize: "none" }} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}