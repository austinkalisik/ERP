import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import baseApi from "../../../api/baseApi";

// Reuses the same cache key as Applications.jsx and any other component
// that fetches leave types — only one network request across the whole session
const fetchLeaveTypes = () =>
  baseApi.get("/api/hrms/leave-types").then((r) => r.data?.data || r.data || []);

export default function LeaveCreditsTab({ employeeId, handleNext }) {
  const [saving, setSaving] = useState(false);
  const currentYear = new Date().getFullYear();

  // ── React Query — cached 30 min, shared with Applications.jsx ─────────────
  const { data: leaveTypes = [], isLoading } = useQuery({
    queryKey:  ["hrms_leave_types"],
    queryFn:   fetchLeaveTypes,
    staleTime: 30 * 60 * 1000,
  });

  // Build credits state derived from leaveTypes — one row per type
  // We use local state initialized from the query data
  const [credits, setCredits] = useState([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize credits once leaveTypes loads (only on first load)
  if (!initialized && leaveTypes.length > 0) {
    setCredits(leaveTypes.map((lt) => ({
      leave_type_id: lt.id,
      leave_type:    lt.leave_type,
      leave_code:    lt.leave_code,
      total_days:    lt.leave_type === "R&R" ? 14 : "",
      year:          currentYear,
    })));
    setInitialized(true);
  }

  const handleChange = (index, field, value) => {
    setCredits((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    if (!employeeId) return;
    setSaving(true);
    try {
      await baseApi.post("/api/hrms/leave-credits", {
        employee_id: employeeId,
        credits: credits.map((c) => ({
          leave_type_id: c.leave_type_id,
          total_days:    parseFloat(c.total_days) || 0,
          year:          c.year || currentYear,
        })),
      });
      handleNext();
    } catch (err) {
      console.error("Failed to save leave credits:", err);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle   = { borderRadius: "8px", padding: "10px", fontSize: "14px", width: "100%" };
  const labelStyle   = { fontSize: "14px", fontWeight: 600 };
  const sectionTitle = { fontWeight: 600, fontSize: "16px", paddingBottom: "8px", borderBottom: "2px solid #dee2e6", marginBottom: "20px" };

  if (isLoading) return <div className="p-4">Loading leave types...</div>;

  return (
    <div className="tab-content" style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <h5 style={sectionTitle}>Leave Credits</h5>

      {credits.length === 0 && (
        <div className="alert alert-warning">
          No leave types found. Please add leave types in Settings → Modules → HRMS → Leave Types first.
        </div>
      )}

      {credits.map((credit, index) => (
        <div className="row g-3 mb-3" key={credit.leave_type_id}>
          <div className="col-12">
            <span className="badge bg-primary me-2">{credit.leave_code}</span>
            <strong style={{ fontSize: 15 }}>{credit.leave_type}</strong>
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label" style={labelStyle}>Year:</label>
            <input type="number" className="form-control" value={credit.year} onChange={(e) => handleChange(index, "year", e.target.value)} placeholder={`e.g. ${currentYear}`} style={inputStyle} />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label" style={labelStyle}>Total Days:</label>
            <input type="number" className="form-control" value={credit.total_days} onChange={(e) => handleChange(index, "total_days", e.target.value)} placeholder={credit.leave_type === "R&R" ? "Default: 14" : "Total credits"} style={inputStyle} />
          </div>
          {index < credits.length - 1 && <div className="col-12"><hr /></div>}
        </div>
      ))}

      <div className="d-flex justify-content-end mt-4">
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}
          style={{ padding: "10px 40px", borderRadius: "8px", fontSize: "15px", fontWeight: "500" }}>
          {saving ? "Saving..." : "Next"}
        </button>
      </div>
    </div>
  );
}