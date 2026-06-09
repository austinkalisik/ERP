import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../utils/permissions";
import { MdArrowBack, MdEdit, MdBuild, MdWarning, MdCheckCircle, MdSchedule } from "react-icons/md";
import Swal from "sweetalert2";

export default function BreakdownView() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { permissions } = useAuth();

  const canEdit = can(permissions, "moms.breakdowns.update");

  // ── Single breakdown — reuses moms_breakdown cache shared with BreakdownEdit ──
  const { data: breakdown, isLoading: loading, error: queryError } = useQuery({
    queryKey:  ["moms_breakdown", id],
    queryFn:   () => baseApi.get(`/api/moms/breakdowns/${id}`).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
    enabled:   !!id,
    onError:   () => {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to load breakdown details.", confirmButtonColor: "#3b82f6" });
    },
  });

  const getSeverityColor = (severity) => ({
    Minor:    { bg: "#dbeafe", text: "#1e40af", border: "#bfdbfe" },
    Moderate: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
    Critical: { bg: "#fee2e2", text: "#991b1b", border: "#fecaca" },
  }[severity] || { bg: "#e5e7eb", text: "#374151", border: "#d1d5db" });

  const getStatusColor = (status) => ({
    Reported:        { bg: "#dbeafe", text: "#1e40af", border: "#bfdbfe" },
    "Under Repair":  { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
    Resolved:        { bg: "#d1fae5", text: "#065f46", border: "#a7f3d0" },
    "Pending Parts": { bg: "#fed7aa", text: "#9a3412", border: "#fdba74" },
  }[status] || { bg: "#e5e7eb", text: "#374151", border: "#d1d5db" });

  const getStatusIcon = (status) => {
    if (status === "Resolved")      return <MdCheckCircle size={16} />;
    if (status === "Under Repair")  return <MdBuild size={16} />;
    if (status === "Pending Parts") return <MdSchedule size={16} />;
    return <MdWarning size={16} />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const formatCost = (cost) => {
    if (cost === null || cost === undefined) return "N/A";
    return `$${parseFloat(cost).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  };

  const formatDowntime = (minutes) => {
    if (!minutes) return "N/A";
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60), mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  if (loading) {
    return <Layout><div className="d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}><div className="spinner-border text-primary" role="status" /></div></Layout>;
  }

  if (queryError || !breakdown) {
    return (
      <Layout>
        <div className="container-fluid px-3 px-md-4">
          <div className="alert alert-danger mt-4">Breakdown not found or failed to load.</div>
          <button className="btn btn-secondary" onClick={() => navigate("/moms/breakdowns")}><MdArrowBack /> Back to Breakdowns</button>
        </div>
      </Layout>
    );
  }

  const severityColors = getSeverityColor(breakdown.severity);
  const statusColors   = getStatusColor(breakdown.status);

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4" style={{ maxWidth: "900px" }}>
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-light" style={{ borderRadius: "8px", border: "1px solid #e5e7eb" }} onClick={() => navigate("/moms/breakdowns")}>
              <MdArrowBack size={20} />
            </button>
            <div>
              <h1 style={{ fontWeight: "700", fontSize: "clamp(18px, 4vw, 26px)", margin: 0 }}>Breakdown #{breakdown.id}</h1>
              <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>Machine: <strong>{breakdown.machine_id}</strong></p>
            </div>
          </div>
          {canEdit && (
            <button className="btn btn-primary" style={{ borderRadius: "8px", display: "flex", alignItems: "center", gap: "6px" }} onClick={() => navigate(`/moms/breakdowns/${id}/edit`)}>
              <MdEdit size={18} /> Edit
            </button>
          )}
        </div>

        <div className="d-flex gap-2 mb-4 flex-wrap">
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: severityColors.bg, color: severityColors.text, border: `1px solid ${severityColors.border}`, padding: "6px 14px", borderRadius: "8px", fontWeight: "600", fontSize: "13px" }}>
            <MdWarning size={15} /> {breakdown.severity} Severity
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: statusColors.bg, color: statusColors.text, border: `1px solid ${statusColors.border}`, padding: "6px 14px", borderRadius: "8px", fontWeight: "600", fontSize: "13px" }}>
            {getStatusIcon(breakdown.status)} {breakdown.status}
          </span>
        </div>

        <div className="card shadow-sm mb-4" style={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}>
          <div className="card-header" style={{ background: "#f8f9fa", borderRadius: "12px 12px 0 0", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
            <h5 style={{ margin: 0, fontWeight: "600", fontSize: "15px", color: "#374151" }}>Incident Details</h5>
          </div>
          <div className="card-body p-4">
            <div className="row g-4">
              <div className="col-md-6">
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Breakdown Type</label>
                <p style={{ margin: "4px 0 0", fontWeight: "500", fontSize: "15px", color: "#111827" }}>{breakdown.breakdown_type}</p>
              </div>
              <div className="col-md-6">
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Incident Time</label>
                <p style={{ margin: "4px 0 0", fontWeight: "500", fontSize: "15px", color: "#111827" }}>{formatDate(breakdown.incident_time)}</p>
              </div>
              <div className="col-md-6">
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Reported By</label>
                <p style={{ margin: "4px 0 0", fontWeight: "500", fontSize: "15px", color: "#111827" }}>{breakdown.reported_by || "System"}</p>
              </div>
              <div className="col-md-6">
                <label style={{ fontSize: "12px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Resolved At</label>
                <p style={{ margin: "4px 0 0", fontWeight: "500", fontSize: "15px", color: breakdown.resolved_at ? "#065f46" : "#6b7280" }}>
                  {breakdown.resolved_at ? formatDate(breakdown.resolved_at) : "Not yet resolved"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm mb-4" style={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}>
          <div className="card-header" style={{ background: "#f8f9fa", borderRadius: "12px 12px 0 0", padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
            <h5 style={{ margin: 0, fontWeight: "600", fontSize: "15px", color: "#374151" }}>Description & Diagnostics</h5>
          </div>
          <div className="card-body p-4">
            <div className="mb-4">
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Description</label>
              <p style={{ margin: "8px 0 0", color: "#374151", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{breakdown.description || "No description provided."}</p>
            </div>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Diagnostics</label>
              <p style={{ margin: "8px 0 0", color: "#374151", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{breakdown.diagnostics || "No diagnostics recorded."}</p>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="card shadow-sm h-100" style={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              <div className="card-body p-4 text-center">
                <MdSchedule size={32} color="#6b7280" className="mb-2" />
                <p style={{ margin: "0 0 4px", fontSize: "12px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase" }}>Total Downtime</p>
                <p style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#111827" }}>{formatDowntime(breakdown.downtime_minutes)}</p>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card shadow-sm h-100" style={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              <div className="card-body p-4 text-center">
                <MdBuild size={32} color="#6b7280" className="mb-2" />
                <p style={{ margin: "0 0 4px", fontSize: "12px", fontWeight: "600", color: "#9ca3af", textTransform: "uppercase" }}>Repair Cost</p>
                <p style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#111827" }}>{formatCost(breakdown.repair_cost)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-muted pb-5" style={{ fontSize: "12px" }}>
          Created: {formatDate(breakdown.created_at)} &nbsp;|&nbsp; Last Updated: {formatDate(breakdown.updated_at)}
        </div>
      </div>
    </Layout>
  );
}