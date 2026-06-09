import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import baseApi from "../../../../api/baseApi";
import Swal from "sweetalert2";
import { MdAdd, MdEdit, MdDelete } from "react-icons/md";

const EMPTY_FORM = { name: "", description: "" };

export default function CategoriesSection() {
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);

  // ── AIMS categories — cached 5 min ───────────────────────────────────────
  // Shared with AddItem.jsx (aims_categories) if you expose that key there
  const cacheKey = ["aims_categories"];
  const { data: categories = [], isLoading: loading } = useQuery({
    queryKey:  cacheKey,
    queryFn:   () => baseApi.get("/api/aims/categories").then((r) => r.data.data ?? r.data),
    staleTime: 5 * 60 * 1000,
  });

  const refetch    = () => queryClient.invalidateQueries({ queryKey: cacheKey });
  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit   = (c) => { setEditing(c); setForm({ name: c.name, description: c.description || "" }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return Swal.fire("Validation", "Category name is required", "warning");
    setSaving(true);
    try {
      if (editing) await baseApi.put(`/api/aims/categories/${editing.id}`, form);
      else         await baseApi.post("/api/aims/categories", form);
      setShowModal(false); refetch();
      Swal.fire({ icon: "success", title: editing ? "Category Updated" : "Category Added", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to save category", "error");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Category?", text: "Items using this category will lose their category assignment.", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#dc3545", confirmButtonText: "Yes, delete",
    });
    if (!result.isConfirmed) return;
    try {
      await baseApi.delete(`/api/aims/categories/${id}`);
      refetch();
      Swal.fire({ icon: "success", title: "Deleted", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to delete category", "error");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Item Categories</h4>
          <p className="text-muted mb-0" style={{ fontSize: 14 }}>Manage categories used to classify inventory items</p>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openCreate}>
          <MdAdd size={18} /> Add Category
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ padding: "14px 16px" }}>Category Name</th>
                <th style={{ padding: "14px 16px" }}>Description</th>
                <th style={{ padding: "14px 16px", width: 100 }} className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="3" className="text-center py-4">Loading...</td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan="3" className="text-center text-muted py-4">No categories found</td></tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id}>
                    <td style={{ padding: "14px 16px" }}>
                      <span className="badge bg-primary me-2">{c.name}</span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#6b7280" }}>{c.description || "—"}</td>
                    <td style={{ padding: "14px 16px" }} className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(c)}><MdEdit size={15} /></button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c.id)}><MdDelete size={15} /></button>
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
                <h5 className="modal-title fw-bold">{editing ? "Edit Category" : "Add Category"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Category Name <span className="text-danger">*</span></label>
                  <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Spare Parts" />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Description</label>
                  <textarea className="form-control" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" style={{ resize: "none" }} />
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