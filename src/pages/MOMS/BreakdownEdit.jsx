import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { MdArrowBack, MdSave } from "react-icons/md";
import Swal from "sweetalert2";

export default function BreakdownEdit() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const [saving,   setSaving]   = useState(false);
  const [formData, setFormData] = useState(null);

  const severityLevels = ["Minor", "Moderate", "Critical"];
  const statusOptions  = ["Reported", "Under Repair", "Resolved", "Pending Parts"];

  // ── Single breakdown — cached 2 min per ID ────────────────────────────────
  const { data: breakdown, isLoading: loadingBreakdown } = useQuery({
    queryKey:  ["moms_breakdown", id],
    queryFn:   () => baseApi.get(`/api/moms/breakdowns/${id}`).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
    enabled:   !!id,
    onError:   () => {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to load breakdown data.", confirmButtonColor: "#3b82f6" });
      navigate("/moms/breakdowns");
    },
  });

  // Pre-fill form once data arrives
  useEffect(() => {
    if (!breakdown || formData) return;
    const formatted = breakdown.incident_time ? new Date(breakdown.incident_time).toISOString().slice(0, 16) : "";
    setFormData({
      breakdown_type:   breakdown.breakdown_type   || "",
      severity:         breakdown.severity         || "Minor",
      incident_time:    formatted,
      description:      breakdown.description      || "",
      diagnostics:      breakdown.diagnostics      || "",
      downtime_minutes: breakdown.downtime_minutes ?? "",
      repair_cost:      breakdown.repair_cost      ?? "",
      status:           breakdown.status           || "Reported",
    });
  }, [breakdown]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await baseApi.put(`/api/moms/breakdowns/${id}`, formData);
      queryClient.invalidateQueries({ queryKey: ["moms_breakdown",  id]  });
      queryClient.invalidateQueries({ queryKey: ["moms_breakdowns"]      });
      await Swal.fire({ icon: "success", title: "Breakdown Updated!", text: "Updated successfully.", confirmButtonColor: "#3b82f6", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      navigate(`/moms/breakdowns/${id}`);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed to Update", text: err.response?.data?.message || "Failed to update breakdown.", confirmButtonColor: "#3b82f6" });
      setSaving(false);
    }
  };

  const inputStyle = { borderRadius: "8px", border: "1px solid #d1d5db", padding: "10px 14px", fontSize: "14px", width: "100%", outline: "none", transition: "border-color 0.15s" };
  const labelStyle = { fontWeight: "600", fontSize: "13px", color: "#374151", marginBottom: "6px", display: "block" };

  if (loadingBreakdown || !formData) {
    return (
      <Layout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
          <div className="spinner-border text-primary" role="status" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4" style={{ maxWidth: "800px" }}>
        <div className="d-flex align-items-center gap-3 mb-4">
          <button className="btn btn-light" style={{ borderRadius: "8px", border: "1px solid #e5e7eb" }} onClick={() => navigate(`/moms/breakdowns/${id}`)}>
            <MdArrowBack size={20} />
          </button>
          <div>
            <h1 style={{ fontWeight: "700", fontSize: "clamp(18px, 4vw, 26px)", margin: 0 }}>Edit Breakdown #{id}</h1>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>Update the breakdown details below</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card shadow-sm mb-4" style={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}>
            <div className="card-header" style={{ background: "#f8f9fa", borderRadius: "12px 12px 0 0", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
              <h5 style={{ margin: 0, fontWeight: "600", fontSize: "15px", color: "#374151" }}>Incident Information</h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <label style={labelStyle}>Breakdown Type <span style={{ color: "red" }}>*</span></label>
                  <input type="text" name="breakdown_type" value={formData.breakdown_type} onChange={handleInputChange} style={inputStyle} placeholder="e.g., Engine failure" required />
                </div>
                <div className="col-md-6">
                  <label style={labelStyle}>Severity <span style={{ color: "red" }}>*</span></label>
                  <select name="severity" value={formData.severity} onChange={handleInputChange} style={inputStyle} required>
                    {severityLevels.map((level) => <option key={level}>{level}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label style={labelStyle}>Incident Time <span style={{ color: "red" }}>*</span></label>
                  <input type="datetime-local" name="incident_time" value={formData.incident_time} onChange={handleInputChange} style={inputStyle} required />
                </div>
                <div className="col-md-6">
                  <label style={labelStyle}>Status <span style={{ color: "red" }}>*</span></label>
                  <select name="status" value={formData.status} onChange={handleInputChange} style={inputStyle} required>
                    {statusOptions.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm mb-4" style={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}>
            <div className="card-header" style={{ background: "#f8f9fa", borderRadius: "12px 12px 0 0", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
              <h5 style={{ margin: 0, fontWeight: "600", fontSize: "15px", color: "#374151" }}>Description & Diagnostics</h5>
            </div>
            <div className="card-body p-4">
              <div className="mb-3">
                <label style={labelStyle}>Description <span style={{ color: "red" }}>*</span></label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} style={{ ...inputStyle, resize: "vertical" }} placeholder="Describe the breakdown in detail..." required />
              </div>
              <div>
                <label style={labelStyle}>Diagnostics</label>
                <textarea name="diagnostics" value={formData.diagnostics} onChange={handleInputChange} rows={4} style={{ ...inputStyle, resize: "vertical" }} placeholder="Initial diagnostics or findings..." />
              </div>
            </div>
          </div>

          <div className="card shadow-sm mb-4" style={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}>
            <div className="card-header" style={{ background: "#f8f9fa", borderRadius: "12px 12px 0 0", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
              <h5 style={{ margin: 0, fontWeight: "600", fontSize: "15px", color: "#374151" }}>Cost & Downtime</h5>
            </div>
            <div className="card-body p-4">
              <div className="row g-3">
                <div className="col-md-6">
                  <label style={labelStyle}>Downtime (minutes)</label>
                  <input type="number" name="downtime_minutes" value={formData.downtime_minutes} onChange={handleInputChange} style={inputStyle} min="0" placeholder="Estimated or actual downtime" />
                </div>
                <div className="col-md-6">
                  <label style={labelStyle}>Repair Cost</label>
                  <input type="number" step="0.01" name="repair_cost" value={formData.repair_cost} onChange={handleInputChange} style={inputStyle} min="0" placeholder="Estimated or actual repair cost" />
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 pb-4">
            <button type="button" className="btn btn-light" style={{ borderRadius: "8px", border: "1px solid #e5e7eb", padding: "10px 20px" }} onClick={() => navigate(`/moms/breakdowns/${id}`)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ borderRadius: "8px", padding: "10px 24px", display: "flex", alignItems: "center", gap: "6px" }} disabled={saving}>
              {saving ? <><span className="spinner-border spinner-border-sm" role="status" /> Saving...</> : <><MdSave size={18} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}