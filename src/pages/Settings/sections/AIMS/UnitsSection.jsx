import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import baseApi from "../../../../api/baseApi";
import Swal from "sweetalert2";
import { MdAdd, MdEdit, MdDelete } from "react-icons/md";

const EMPTY_FORM = { name: "", abbreviation: "" };

export default function UnitsSection() {
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);

  // ── AIMS units — cached 5 min ─────────────────────────────────────────────
  // Shared with AddItem.jsx / EditItem.jsx (aims_units) if you expose that key
  const cacheKey = ["aims_units"];
  const { data: units = [], isLoading: loading } = useQuery({
    queryKey:  cacheKey,
    queryFn:   () => baseApi.get("/api/aims/units").then((r) => r.data.data ?? r.data),
    staleTime: 5 * 60 * 1000,
  });

  const refetch    = () => queryClient.invalidateQueries({ queryKey: cacheKey });
  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit   = (u) => { setEditing(u); setForm({ name: u.name, abbreviation: u.abbreviation || "" }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim())         return Swal.fire("Validation", "Unit name is required", "warning");
    if (!form.abbreviation.trim()) return Swal.fire("Validation", "Abbreviation is required", "warning");
    setSaving(true);
    try {
      if (editing) await baseApi.put(`/api/aims/units/${editing.id}`, form);
      else         await baseApi.post("/api/aims/units", form);
      setShowModal(false); refetch();
      Swal.fire({ icon: "success", title: editing ? "Unit Updated" : "Unit Added", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to save unit", "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Unit?", text: "Items using this unit will lose their unit assignment.", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#dc3545", confirmButtonText: "Yes, delete",
    });
    if (!result.isConfirmed) return;
    try {
      await baseApi.delete(`/api/aims/units/${id}`);
      refetch();
      Swal.fire({ icon: "success", title: "Deleted", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to delete unit", "error");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Units of Measure</h4>
          <p className="text-muted mb-0" style={{ fontSize: 14 }}>Manage measurement units for inventory items</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openCreate}>
          <MdAdd size={18} /> Add Unit
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ padding: "14px 16px" }}>Unit Name</th>
                <th style={{ padding: "14px 16px", width: 160 }}>Abbreviation</th>
                <th style={{ padding: "14px 16px", width: 100 }} className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" className="text-center py-4">Loading...</td></tr>
              ) : units.length === 0 ? (
                <tr><td colSpan="3" className="text-center text-muted py-4">No units found</td></tr>
              ) : (
                units.map((u) => (
                  <tr key={u.id}>
                    <td style={{ padding: "14px 16px", fontWeight: 500 }}>{u.name}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span className="badge bg-light text-dark border">{u.abbreviation}</span>
                    </td>
                    <td style={{ padding: "14px 16px" }} className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(u)}><MdEdit size={15} /></button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(u.id)}><MdDelete size={15} /></button>
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
                <h5 className="modal-title fw-bold">{editing ? "Edit Unit" : "Add Unit"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Unit Name <span className="text-danger">*</span></label>
                  <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Pieces" />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Abbreviation <span className="text-danger">*</span></label>
                  <input className="form-control" value={form.abbreviation} onChange={(e) => setForm({ ...form, abbreviation: e.target.value })} placeholder="e.g. pcs" style={{ maxWidth: 200 }} />
                  <small className="text-muted">Short code shown on inventory items</small>
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