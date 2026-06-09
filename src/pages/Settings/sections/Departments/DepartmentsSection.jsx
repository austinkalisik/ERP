import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import baseApi from "../../../../api/baseApi";
import Swal from "sweetalert2";

import DepartmentsTable from "./DepartmentsTable";
import DepartmentModal from "./DepartmentModal";

export default function DepartmentsSection() {
  const queryClient = useQueryClient();

  const [showModal,   setShowModal]   = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  // ── Departments list — cached 30 min ──────────────────────────────────────
  // Shared key with: HRMS.jsx, EmploymentInfoTab.jsx, Attendance.jsx,
  //                  EmployeeEditModal.jsx — editing here invalidates all of them
  const cacheKey = ["hrms_departments"];
  const { data: departments = [], isLoading: loading } = useQuery({
    queryKey:  cacheKey,
    queryFn:   () => baseApi.get("/api/hrms/departments").then((r) => r.data?.data || r.data || []),
    staleTime: 30 * 60 * 1000,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: cacheKey });

  const handleAdd  = () => { setEditingDept(null); setShowModal(true); };
  const handleEdit = (dept) => { setEditingDept(dept); setShowModal(true); };

  const handleSave = async (dept) => {
    try {
      if (dept.id) await baseApi.put(`/api/hrms/departments/${dept.id}`, dept);
      else         await baseApi.post("/api/hrms/departments", dept);
      setShowModal(false);
      refetch();
      Swal.fire("Success", "Department saved", "success");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to save department", "error");
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Department?", text: "This action cannot be undone", icon: "warning",
      showCancelButton: true, confirmButtonText: "Yes, delete",
    });
    if (!confirm.isConfirmed) return;
    try {
      await baseApi.delete(`/api/hrms/departments/${id}`);
      refetch();
      Swal.fire("Deleted", "Department removed", "success");
    } catch {
      Swal.fire("Error", "Failed to delete department", "error");
    }
  };

  if (loading) return <div className="p-4">Loading departments...</div>;

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Departments</h3>
        <button className="btn btn-primary" onClick={handleAdd}>Add Department</button>
      </div>

      <DepartmentsTable data={departments} onEdit={handleEdit} onDelete={handleDelete} />

      {showModal && (
        <DepartmentModal
          department={editingDept}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}