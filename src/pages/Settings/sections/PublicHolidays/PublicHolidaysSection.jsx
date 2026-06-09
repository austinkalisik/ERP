import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import baseApi from "../../../../api/baseApi";
import Swal from "sweetalert2";

export default function PublicHolidaysSection() {
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);

  // ── Public holidays — cached 30 min ───────────────────────────────────────
  const cacheKey = ["hrms_public_holidays"];
  const { data: holidays = [], isLoading: loading } = useQuery({
    queryKey:  cacheKey,
    queryFn:   () => baseApi.get("/api/hrms/public-holidays").then((r) => r.data || []),
    staleTime: 30 * 60 * 1000,
  });

  const refetch    = () => queryClient.invalidateQueries({ queryKey: cacheKey });
  const handleAdd  = () => { setEditing(null); setShowModal(true); };
  const handleEdit = (h) => { setEditing(h);   setShowModal(true); };

  const handleSave = async (data) => {
    try {
      if (data.id) await baseApi.put(`/api/hrms/public-holidays/${data.id}`, data);
      else         await baseApi.post("/api/hrms/public-holidays", data);
      setShowModal(false); refetch();
      Swal.fire("Saved", "Public holiday saved", "success");
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to save holiday", "error");
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Holiday?", text: "This action cannot be undone", icon: "warning",
      showCancelButton: true, confirmButtonText: "Yes, delete", confirmButtonColor: "#dc3545",
    });
    if (!confirm.isConfirmed) return;
    try {
      await baseApi.delete(`/api/hrms/public-holidays/${id}`);
      refetch();
      Swal.fire("Deleted", "Holiday removed", "success");
    } catch {
      Swal.fire("Error", "Failed to delete holiday", "error");
    }
  };

  if (loading) return <div className="p-4">Loading holidays...</div>;

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Public Holidays</h3>
        <button className="btn btn-primary" onClick={handleAdd}>Add Holiday</button>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead style={{ backgroundColor: "#f3f4f6" }}>
            <tr>
              <th style={{ fontWeight: 600 }}>Holiday Name</th>
              <th style={{ fontWeight: 600, width: 130 }}>Date</th>
              <th style={{ fontWeight: 600, width: 160 }}>Type</th>
              <th style={{ fontWeight: 600, width: 100 }}>Recurring</th>
              <th style={{ fontWeight: 600, width: 160 }} className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {holidays.length === 0 ? (
              <tr><td colSpan="5" className="text-center text-muted py-4">No public holidays found</td></tr>
            ) : (
              holidays.map((h) => (
                <tr key={h.id}>
                  <td style={{ fontWeight: 500 }}>{h.name}</td>
                  <td>{new Date(h.date + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td>
                    <span className={`badge ${h.type === "Public Holiday" ? "bg-danger" : "bg-warning text-dark"}`}>
                      {h.type}
                    </span>
                  </td>
                  <td>
                    {h.recurring
                      ? <span className="badge bg-success">Yes</span>
                      : <span className="badge bg-secondary">No</span>}
                  </td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(h)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(h.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <PublicHolidayModal
          holiday={editing}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ── Inline modal — pure form, no fetching, unchanged ─────────────────────────
function PublicHolidayModal({ holiday, onClose, onSave }) {
  const [form, setForm] = useState({
    name:        holiday?.name        || "",
    date:        holiday?.date        || "",
    type:        holiday?.type        || "Public Holiday",
    description: holiday?.description || "",
    recurring:   holiday?.recurring   || false,
  });

  const handleSubmit = () => {
    if (!form.name || !form.date) { Swal.fire("Validation", "Name and date are required", "warning"); return; }
    onSave({ ...holiday, ...form });
  };

  return (
    <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{holiday ? "Edit Holiday" : "Add Public Holiday"}</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Holiday Name</label>
              <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Independence Day" />
            </div>
            <div className="mb-3">
              <label className="form-label">Date</label>
              <input type="date" className="form-control" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="mb-3">
              <label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="Public Holiday">Public Holiday</option>
                <option value="Optional Holiday">Optional Holiday</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Description (optional)</label>
              <input className="form-control" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
            </div>
            <div className="form-check">
              <input type="checkbox" className="form-check-input" id="recurringCheck" checked={!!form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.checked })} />
              <label className="form-check-label" htmlFor="recurringCheck">Recurring annually</label>
              <div><small className="text-muted">Mark if this holiday occurs every year on the same date</small></div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}