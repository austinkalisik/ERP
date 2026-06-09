import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import baseApi from "../../../../api/baseApi";
import Swal from "sweetalert2";
import OvertimeTypesTable from "./OvertimeTypesTable";
import OvertimeTypeModal from "./OvertimeTypeModal";

export default function OvertimeTypesSection() {
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);

  // ── Overtime types — cached 30 min ────────────────────────────────────────
  // Shared key with: Applications.jsx, ApplicationFormsTab.jsx
  const cacheKey = ["hrms_overtime_types"];
  const { data: overtimeTypes = [], isLoading: loading } = useQuery({
    queryKey:  cacheKey,
    queryFn:   () => baseApi.get("/api/hrms/overtime-types").then((r) => r.data?.data || r.data || []),
    staleTime: 30 * 60 * 1000,
  });

  const refetch    = () => queryClient.invalidateQueries({ queryKey: cacheKey });
  const handleAdd  = () => { setEditing(null); setShowModal(true); };
  const handleEdit = (ot) => { setEditing(ot); setShowModal(true); };

  const handleSave = async (data) => {
    try {
      if (data.id) await baseApi.put(`/api/hrms/overtime-types/${data.id}`, data);
      else         await baseApi.post("/api/hrms/overtime-types", data);
      setShowModal(false); refetch();
      Swal.fire("Success", "Overtime type saved", "success");
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to save overtime type", "error");
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Overtime Type?", text: "This action cannot be undone", icon: "warning",
      showCancelButton: true, confirmButtonText: "Yes, delete", confirmButtonColor: "#dc3545",
    });
    if (!confirm.isConfirmed) return;
    try {
      await baseApi.delete(`/api/hrms/overtime-types/${id}`);
      refetch();
      Swal.fire("Deleted", "Overtime type removed", "success");
    } catch {
      Swal.fire("Error", "Failed to delete overtime type", "error");
    }
  };

  if (loading) return <div className="p-4">Loading overtime types...</div>;

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Overtime Types</h3>
        <button className="btn btn-primary" onClick={handleAdd}>Add Overtime Type</button>
      </div>

      <OvertimeTypesTable data={overtimeTypes} onEdit={handleEdit} onDelete={handleDelete} />

      {showModal && (
        <OvertimeTypeModal
          overtimeType={editing}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}