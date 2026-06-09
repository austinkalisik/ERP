import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import baseApi from "../../../../api/baseApi";
import Swal from "sweetalert2";
import { MdAdd, MdDelete, MdEdit } from "react-icons/md";

const CATEGORIES = [
  "Excavator", "Bulldozer", "Dozer", "OHT Truck",
  "Dump Truck", "Light Vehicle", "Loader", "Grader",
];

export default function ChecklistTemplatesSection() {
  const queryClient = useQueryClient();

  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [editingId,      setEditingId]      = useState(null);
  const [editText,       setEditText]       = useState("");
  const [newItemText,    setNewItemText]    = useState("");

  // ── All-category counts — cached 5 min ───────────────────────────────────
  const countsCacheKey = ["moms_checklist_counts"];
  const { data: countsRaw = [] } = useQuery({
    queryKey:  countsCacheKey,
    queryFn:   () => baseApi.get("/api/moms/checklist-templates?all=1").then((r) => r.data || []),
    staleTime: 5 * 60 * 1000,
  });

  // Derive counts map from raw data — zero extra requests
  const counts = {};
  CATEGORIES.forEach((cat) => {
    counts[cat] = countsRaw.filter((i) => i.category === cat && i.is_active).length;
  });

  // ── Items for active category — cached 5 min per category ─────────────────
  const itemsCacheKey = ["moms_checklist_items", activeCategory];
  const { data: itemsData, isLoading: loading } = useQuery({
    queryKey:  itemsCacheKey,
    queryFn:   () => baseApi.get(`/api/moms/checklist-templates/by-category/${encodeURIComponent(activeCategory)}`).then((r) => r.data?.items || []),
    staleTime: 5 * 60 * 1000,
  });
  const items = itemsData || [];

  // Invalidate both the items list and the counts on any mutation
  const refetchItems  = () => queryClient.invalidateQueries({ queryKey: itemsCacheKey });
  const refetchCounts = () => queryClient.invalidateQueries({ queryKey: countsCacheKey });
  const refetchAll    = () => { refetchItems(); refetchCounts(); };

  const handleAddItem = async () => {
    if (!newItemText.trim()) return;
    try {
      const nextNumber = items.length > 0 ? Math.max(...items.map((i) => i.item_number)) + 1 : 1;
      await baseApi.post("/api/moms/checklist-templates", {
        category:    activeCategory,
        item_number: nextNumber,
        item_text:   newItemText.trim(),
        sort_order:  nextNumber,
      });
      setNewItemText("");
      refetchAll();
    } catch {
      Swal.fire("Error", "Failed to add item", "error");
    }
  };

  const handleDelete = async (id, text) => {
    const result = await Swal.fire({
      title: "Delete item?", html: `<small>${text}</small>`, icon: "warning",
      showCancelButton: true, confirmButtonColor: "#dc3545", confirmButtonText: "Delete",
    });
    if (!result.isConfirmed) return;
    try {
      await baseApi.delete(`/api/moms/checklist-templates/${id}`);
      refetchAll();
    } catch {
      Swal.fire("Error", "Failed to delete item", "error");
    }
  };

  const handleEditSave = async (id) => {
    if (!editText.trim()) return;
    try {
      await baseApi.put(`/api/moms/checklist-templates/${id}`, { item_text: editText.trim() });
      setEditingId(null); setEditText("");
      refetchItems();
    } catch {
      Swal.fire("Error", "Failed to update item", "error");
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await baseApi.put(`/api/moms/checklist-templates/${item.id}`, { is_active: !item.is_active });
      refetchAll();
    } catch {
      Swal.fire("Error", "Failed to update item", "error");
    }
  };

  return (
    <div>
      <div className="d-flex align-items-start justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h5 className="mb-1" style={{ fontWeight: 700 }}>Checklist Templates</h5>
          <p className="text-muted mb-0" style={{ fontSize: "13px" }}>
            Manage pre-start safety checklist items per machine type.
            These load dynamically when an operator selects a machine in Start Shift.
          </p>
        </div>
      </div>

      <div className="row g-3">
        {/* Category selector */}
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm" style={{ borderRadius: "10px" }}>
            <div className="card-body p-2">
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "10px 12px", borderRadius: "7px", border: "none",
                    cursor: "pointer", marginBottom: "2px",
                    backgroundColor: activeCategory === cat ? "#3b82f6" : "transparent",
                    color: activeCategory === cat ? "#fff" : "#374151",
                    fontWeight: activeCategory === cat ? 600 : 400,
                    fontSize: "13.5px", textAlign: "left", transition: "all 0.15s ease",
                  }}>
                  <span>{cat}</span>
                  <span style={{
                    fontSize: "11px",
                    backgroundColor: activeCategory === cat ? "rgba(255,255,255,0.3)" : "#e5e7eb",
                    color: activeCategory === cat ? "#fff" : "#6b7280",
                    padding: "2px 7px", borderRadius: "10px", fontWeight: 600,
                  }}>
                    {counts[cat] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Items list */}
        <div className="col-12 col-md-9">
          <div className="card border-0 shadow-sm" style={{ borderRadius: "10px" }}>
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="mb-0 fw-bold">
                  {activeCategory}
                  <span className="ms-2 text-muted fw-normal" style={{ fontSize: "13px" }}>({items.length} items)</span>
                </h6>
              </div>

              {/* Add new item */}
              <div className="d-flex gap-2 mb-4">
                <input
                  type="text" className="form-control form-control-sm"
                  placeholder={`Add new ${activeCategory} checklist item...`}
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                  style={{ borderRadius: "7px", fontSize: "13px" }}
                />
                <button className="btn btn-success btn-sm d-flex align-items-center gap-1"
                  style={{ borderRadius: "7px", whiteSpace: "nowrap", fontSize: "13px" }}
                  onClick={handleAddItem} disabled={!newItemText.trim()}>
                  <MdAdd size={16} /> Add Item
                </button>
              </div>

              {/* Items */}
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-primary" />
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-5" style={{ backgroundColor: "#f8fafc", borderRadius: "8px", border: "2px dashed #e2e8f0" }}>
                  <p className="text-muted mb-2" style={{ fontSize: "14px" }}>No checklist items yet</p>
                  <p className="text-muted mb-0" style={{ fontSize: "13px" }}>Add items above or run the seeder to load default items</p>
                </div>
              ) : (
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                  {items.map((item, idx) => (
                    <div key={item.id} style={{
                      display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px",
                      borderBottom: idx < items.length - 1 ? "1px solid #f1f5f9" : "none",
                      backgroundColor: !item.is_active ? "#fafafa" : idx % 2 === 0 ? "#fff" : "#fafafa",
                      opacity: item.is_active ? 1 : 0.5,
                    }}>
                      <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 700, minWidth: "26px", textAlign: "right", flexShrink: 0 }}>
                        {item.item_number}.
                      </span>

                      {editingId === item.id ? (
                        <input type="text" className="form-control form-control-sm"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")  handleEditSave(item.id);
                            if (e.key === "Escape") { setEditingId(null); setEditText(""); }
                          }}
                          autoFocus style={{ fontSize: "13px", borderRadius: "5px" }}
                        />
                      ) : (
                        <span style={{ flex: 1, fontSize: "13px", color: "#1e293b", textDecoration: !item.is_active ? "line-through" : "none" }}>
                          {item.item_text}
                        </span>
                      )}

                      <div className="d-flex gap-1 flex-shrink-0">
                        {editingId === item.id ? (
                          <>
                            <button className="btn btn-success btn-sm py-0 px-2" style={{ fontSize: "11px", borderRadius: "5px" }} onClick={() => handleEditSave(item.id)}>Save</button>
                            <button className="btn btn-secondary btn-sm py-0 px-2" style={{ fontSize: "11px", borderRadius: "5px" }} onClick={() => { setEditingId(null); setEditText(""); }}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button
                              className={`btn btn-sm py-0 px-2 ${item.is_active ? "btn-outline-warning" : "btn-outline-success"}`}
                              style={{ fontSize: "11px", borderRadius: "5px" }}
                              title={item.is_active ? "Disable" : "Enable"}
                              onClick={() => handleToggleActive(item)}>
                              {item.is_active ? "Disable" : "Enable"}
                            </button>
                            <button className="btn btn-outline-primary btn-sm py-0 px-2" style={{ fontSize: "11px", borderRadius: "5px" }} title="Edit" onClick={() => { setEditingId(item.id); setEditText(item.item_text); }}>
                              <MdEdit size={13} />
                            </button>
                            <button className="btn btn-outline-danger btn-sm py-0 px-2" style={{ fontSize: "11px", borderRadius: "5px" }} title="Delete" onClick={() => handleDelete(item.id, item.item_text)}>
                              <MdDelete size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {items.length > 0 && (
                <p className="text-muted mt-2 mb-0" style={{ fontSize: "12px" }}>
                  💡 Disabled items won't appear in the operator's checklist. Changes take effect immediately on the next shift start.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}