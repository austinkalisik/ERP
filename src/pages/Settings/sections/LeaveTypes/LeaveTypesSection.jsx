import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import baseApi from "../../../../api/baseApi";
import Swal from "sweetalert2";
import LeaveTypesTable from "./LeaveTypesTable";
import LeaveTypeModal from "./LeaveTypeModal";

export default function LeaveTypesSection() {
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);

  // ── Leave types — cached 30 min ───────────────────────────────────────────
  // Shared key with: Applications.jsx, LeaveCreditsTab.jsx,
  //                  ApplicationFormsTab.jsx, AddLeaveCreditModal.jsx
  const cacheKey = ["hrms_leave_types"];
  const { data: leaveTypes = [], isLoading: loading } = useQuery({
    queryKey:  cacheKey,
    queryFn:   () => baseApi.get("/api/hrms/leave-types").then((r) => r.data?.data || r.data || []),
    staleTime: 30 * 60 * 1000,
  });

  const refetch    = () => queryClient.invalidateQueries({ queryKey: cacheKey });
  const handleAdd  = () => { setEditing(null); setShowModal(true); };
  const handleEdit = (lt) => { setEditing(lt); setShowModal(true); };

  const handleSave = async (data) => {
    try {
      if (data.id) await baseApi.put(`/api/hrms/leave-types/${data.id}`, data);
      else         await baseApi.post("/api/hrms/leave-types", data);
      setShowModal(false); refetch();
      Swal.fire("Success", "Leave type saved", "success");
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to save leave type", "error");
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Leave Type?", text: "This action cannot be undone", icon: "warning",
      showCancelButton: true, confirmButtonText: "Yes, delete", confirmButtonColor: "#dc3545",
    });
    if (!confirm.isConfirmed) return;
    try {
      await baseApi.delete(`/api/hrms/leave-types/${id}`);
      refetch();
      Swal.fire("Deleted", "Leave type removed", "success");
    } catch {
      Swal.fire("Error", "Failed to delete leave type", "error");
    }
  };

  if (loading) return <div className="p-4">Loading leave types...</div>;

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Leave Types</h3>
        <button className="btn btn-primary" onClick={handleAdd}>Add Leave Type</button>
      </div>

      <LeaveTypesTable data={leaveTypes} onEdit={handleEdit} onDelete={handleDelete} />

      {showModal && (
        <LeaveTypeModal
          leaveType={editing}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}