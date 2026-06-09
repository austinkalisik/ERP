import { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { useQuery } from "@tanstack/react-query";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";

export default function AddLeaveCreditModal({ show, onHide, biometricId, onSuccess }) {
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentYear = new Date().getFullYear();

  const inputStyle   = { borderRadius: "8px", padding: "10px", fontSize: "14px", width: "100%" };
  const labelStyle   = { fontSize: "14px", fontWeight: 600 };
  const sectionTitle = { fontWeight: 600, fontSize: "16px", paddingBottom: "8px", borderBottom: "2px solid #dee2e6", marginBottom: "20px" };

  // ── Leave types — reuses hrms_leave_types cache ────────────────────────────
  // Same key as Applications.jsx, LeaveCreditsTab.jsx — never re-fetched if cached
  const {
    data: leaveTypes = [],
    isLoading: leaveTypesLoading,
    error: leaveTypesError,
  } = useQuery({
    queryKey:  ["hrms_leave_types"],
    queryFn:   () => baseApi.get("/api/hrms/leave-types").then((r) => r.data?.data || r.data || []),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    enabled:   show,
  });

  // ── Existing credits per employee — fetched fresh every time modal opens ──
  // Not cached long because credits change when leave is approved
  const { data: existingCredits = [] } = useQuery({
    queryKey:  ["hrms_employee_leave_credits", biometricId],
    queryFn:   () => baseApi.get(`/api/hrms/employee/${biometricId}/leave-credits`).then((r) => r.data || []),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    enabled:   show && !!biometricId,
  });

  // ── Build editable credit rows once both queries resolve ─────────────────
  useEffect(() => {
    if (!leaveTypes.length) return;

    const existingMap = {};
    existingCredits.forEach((c) => { existingMap[c.leave_type_id] = c; });

    setCredits(leaveTypes.map((lt) => ({
      leave_type_id: lt.id,
      leave_type:    lt.leave_type,
      leave_code:    lt.leave_code,
      year:          existingMap[lt.id]?.year       ?? currentYear,
      total_days:    existingMap[lt.id]?.total_days ?? (lt.leave_type === "R&R" ? 14 : ""),
      used_days:     existingMap[lt.id]?.used_days  ?? 0,
    })));
  }, [leaveTypes, existingCredits]);

  const handleChange = (index, field, value) => {
    setCredits((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    const result = await Swal.fire({
      title: "Confirm Update", text: "Are you sure you want to update leave credits?",
      icon: "question", showCancelButton: true, confirmButtonText: "Yes, update",
      confirmButtonColor: "#0d6efd", cancelButtonColor: "#dc3545",
    });
    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      await baseApi.put(`/api/hrms/employee/${biometricId}/leave-credits`, {
        credits: credits.map((c) => ({
          leave_type_id: c.leave_type_id,
          total_days:    parseFloat(c.total_days) || 0,
          used_days:     parseFloat(c.used_days)  || 0,
          year:          c.year || currentYear,
        })),
      });
      Swal.fire({ icon: "success", title: "Updated Successfully", text: "Leave credits have been updated.", confirmButtonColor: "#0d6efd" });
      onHide();
      onSuccess?.();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: error.response?.data?.message || "Something went wrong while updating leave credits.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Update Leave Credits</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h5 style={sectionTitle}>Leave Credits</h5>

        {leaveTypesLoading && (
          <div className="alert alert-info">
            Loading leave types...
          </div>
        )}

        {leaveTypesError && (
          <div className="alert alert-danger">
            Failed to load leave types. Please refresh and try again.
          </div>
        )}

        {!leaveTypesLoading && !leaveTypesError && credits.length === 0 && (
          <div className="alert alert-warning">
            No leave types found. Please add leave types in Settings → Modules → HRMS → Leave Types.
          </div>
        )}

        {credits.map((credit, index) => (
          <div key={credit.leave_type_id} className="mb-4">
            <div className="mb-2">
              <span className="badge bg-primary me-2">{credit.leave_code}</span>
              <strong style={{ fontSize: 15 }}>{credit.leave_type}</strong>
            </div>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label" style={labelStyle}>Year</label>
                <input type="number" className="form-control" value={credit.year} onChange={(e) => handleChange(index, "year", e.target.value)} style={inputStyle} />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={labelStyle}>Total Days</label>
                <input type="number" className="form-control" value={credit.total_days} onChange={(e) => handleChange(index, "total_days", e.target.value)} placeholder={credit.leave_type === "R&R" ? "Default: 14" : "Total credits"} style={inputStyle} />
              </div>
              <div className="col-md-4">
                <label className="form-label" style={labelStyle}>Used Days</label>
                <input type="number" className="form-control" value={credit.used_days} onChange={(e) => handleChange(index, "used_days", e.target.value)} style={inputStyle} />
              </div>
            </div>
            {index < credits.length - 1 && <hr className="mt-3" />}
          </div>
        ))}
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-danger" onClick={onHide} disabled={loading}>Cancel</button>
        <button className="btn btn-primary px-4" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
