import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import baseApi from "../../../../api/baseApi";
import Swal from "sweetalert2";

import ShiftsTable from "./ShiftsTable";
import ShiftModal from "./ShiftsModal";

export default function ShiftsSection() {
  const queryClient = useQueryClient();

  const [showModal,    setShowModal]    = useState(false);
  const [editingShift, setEditingShift] = useState(null);

  // ── Shifts list — cached 30 min ───────────────────────────────────────────
  // Shared key with: AddEmployee.jsx, EditEmployee.jsx,
  //                  EmploymentInfoTab.jsx, EmployeeEditModal.jsx
  const cacheKey = ["hrms_shifts"];
  const { data: shifts = [], isLoading: loading } = useQuery({
    queryKey:  cacheKey,
    queryFn:   () => baseApi.get("/api/hrms/shifts").then((r) => r.data?.data || r.data || []),
    staleTime: 30 * 60 * 1000,
  });

  const refetch     = () => queryClient.invalidateQueries({ queryKey: cacheKey });
  const handleAdd   = () => { setEditingShift(null);  setShowModal(true); };
  const handleEdit  = (shift) => { setEditingShift(shift); setShowModal(true); };

  const handleSave = async (shift) => {
    try {
      if (shift.id) await baseApi.put(`/api/hrms/shifts/${shift.id}`, shift);
      else          await baseApi.post("/api/hrms/shifts", shift);
      setShowModal(false); refetch();
      Swal.fire("Success", "Shift saved", "success");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to save shift", "error");
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Shift?", text: "This action cannot be undone", icon: "warning",
      showCancelButton: true, confirmButtonText: "Yes, delete",
    });
    if (!confirm.isConfirmed) return;
    try {
      await baseApi.delete(`/api/hrms/shifts/${id}`);
      refetch();
      Swal.fire("Deleted", "Shift removed", "success");
    } catch {
      Swal.fire("Error", "Failed to delete shift", "error");
    }
  };

  if (loading) return <div className="p-4">Loading shifts...</div>;

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Shifts</h3>
        <button className="btn btn-primary" onClick={handleAdd}>Add Shift</button>
      </div>

      <ShiftsTable data={shifts} onEdit={handleEdit} onDelete={handleDelete} />

      {showModal && (
        <ShiftModal
          shift={editingShift}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}