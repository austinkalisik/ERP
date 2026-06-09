import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../utils/permissions";
import { MdArrowBack, MdEdit, MdDelete, MdAccessTime, MdPictureAsPdf, MdTableChart } from "react-icons/md";
import Swal from "sweetalert2";

const TIME_CAT_COLORS = {
  "Operating Time (OT)":       { bg: "#d1fae5", text: "#065f46" },
  "Operating Delay (OD)":      { bg: "#fef3c7", text: "#92400e" },
  "Operating Standby (OS)":    { bg: "#dbeafe", text: "#1e40af" },
  "Planned Loss (PL)":         { bg: "#ede9fe", text: "#5b21b6" },
  "Breakdown Loss (BL)":       { bg: "#fee2e2", text: "#991b1b" },
  "Breakdown Loss Other (BLO)":{ bg: "#fce7f3", text: "#9d174d" },
};

const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const str = dateString.includes("T") ? dateString : dateString.replace(" ", "T");
    const [datePart, timePart] = str.split("T");
    const [year, month, day]   = datePart.split("-");
    const dateStr = new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    if (timePart) {
      const [hours, minutes] = timePart.substring(0, 5).split(":");
      const h = parseInt(hours);
      return `${dateStr}, ${String(h % 12 || 12).padStart(2, "0")}:${minutes} ${h >= 12 ? "PM" : "AM"}`;
    }
    return dateStr;
  } catch { return "Invalid Date"; }
};

const calcHours = (start, end) => {
  if (!start || !end) return null;
  try {
    const diff = (new Date(end.replace(" ", "T")) - new Date(start.replace(" ", "T"))) / 3600000;
    return diff > 0 ? diff.toFixed(2) : null;
  } catch { return null; }
};

export default function AssignmentView() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { permissions } = useAuth();
  const queryClient = useQueryClient();

  const canEdit   = can(permissions, "moms.assignments.update");
  const canDelete = can(permissions, "moms.assignments.delete");

  const cacheKey = ["moms_assignment", id];
  const { data: assignment, isLoading: loading } = useQuery({
    queryKey:  cacheKey,
    queryFn:   () => baseApi.get(`/api/moms/assignments/${id}`).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
    enabled:   !!id,
    onError:   () => {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to load assignment details", confirmButtonColor: "#3b82f6" });
      navigate("/moms/assignments");
    },
  });

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete Assignment?", text: "This action cannot be undone!", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#ef4444", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, delete it!",
    });
    if (!result.isConfirmed) return;
    try {
      await baseApi.delete(`/api/moms/assignments/${id}`);
      queryClient.invalidateQueries({ queryKey: ["moms_assignments"] });
      Swal.fire({ icon: "success", title: "Deleted!", timer: 2000, showConfirmButton: false });
      setTimeout(() => navigate("/moms/assignments"), 2000);
    } catch {
      Swal.fire({ icon: "error", title: "Delete Failed", text: "Failed to delete assignment", confirmButtonColor: "#3b82f6" });
    }
  };

  // FIXED: DER export now triggers a real file download using a hidden <a> tag
  // instead of window.open() which can be blocked by popup blockers.
  const handleExport = async (format) => {
    try {
      const response = await baseApi.get(
        `/api/moms/assignments/${id}/export-der`,
        { params: { format }, responseType: "blob" }
      );

      const ext      = format === "pdf" ? "pdf" : "csv";
      const mimeType = format === "pdf" ? "application/pdf" : "text/csv";
      const url      = window.URL.createObjectURL(new Blob([response.data], { type: mimeType }));
      const link     = document.createElement("a");
      link.href      = url;
      link.setAttribute("download", `DER_${assignment?.machine_id_display ?? "export"}_${format === "pdf" ? "report.pdf" : "report.csv"}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      Swal.fire({ icon: "error", title: "Export Failed", text: "Could not generate the DER export.", confirmButtonColor: "#3b82f6" });
    }
  };

  const Field = ({ label, value, highlight = false }) => (
    <div className="col-md-6">
      <label style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}:</label>
      <p style={{ fontSize: "15px", fontWeight: "500", margin: "6px 0 0", color: highlight ? "#3b82f6" : "inherit" }}>{value || "—"}</p>
    </div>
  );

  const statusColors = {
    Pending:   { bg: "#dbeafe", text: "#1e40af" }, Active: { bg: "#d1fae5", text: "#065f46" },
    Completed: { bg: "#e5e7eb", text: "#374151" }, Cancelled: { bg: "#fee2e2", text: "#991b1b" },
  };

  if (loading)     return <Layout><div className="text-center py-5">Loading...</div></Layout>;
  if (!assignment) return <Layout><div className="text-center py-5">Assignment not found</div></Layout>;

  const sc      = statusColors[assignment.status] || { bg: "#e5e7eb", text: "#374151" };
  const smrDiff = assignment.reading_start != null && assignment.reading_end != null
    ? (parseFloat(assignment.reading_end) - parseFloat(assignment.reading_start)).toFixed(2)
    : null;

  const timeEntries     = assignment.time_entries || [];
  const totalEntryHours = timeEntries.reduce((sum, e) => {
    const h = parseFloat(e.duration_hours || calcHours(e.start_time, e.end_time) || 0);
    return sum + h;
  }, 0);

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="mb-4">
          <button className="btn btn-link text-decoration-none p-0 mb-2" onClick={() => navigate("/moms/assignments")} style={{ color: "#3b82f6", fontSize: "14px" }}>
            <MdArrowBack className="me-1" /> Back to Assignments
          </button>
          <h1 style={{ fontWeight: "bold", fontSize: "28px", margin: 0 }}>Assignment Details</h1>
        </div>

        <div className="row g-3">
          <div className="col-lg-8">

            {/* Assignment Info */}
            <div className="card shadow-sm mb-3" style={{ borderRadius: "12px" }}>
              <div className="card-header" style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #e9ecef", padding: "16px 20px" }}>
                <h5 style={{ margin: 0, fontWeight: "600" }}>Assignment Information</h5>
              </div>
              <div className="card-body" style={{ padding: "24px" }}>
                <div className="row g-4">
                  <Field label="Machine"     value={assignment.machine_id_display} highlight />
                  <Field label="Operator"    value={assignment.operator_name} />
                  <Field label="Job Site"    value={assignment.job_site} highlight />
                  <Field label="Assigned By" value={assignment.assigned_by_name || "System"} />
                  <div className="col-md-6">
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status:</label>
                    <p style={{ margin: "6px 0 0" }}>
                      <span className="badge" style={{ backgroundColor: sc.bg, color: sc.text, padding: "6px 12px", borderRadius: "6px", fontSize: "13px" }}>{assignment.status}</span>
                    </p>
                  </div>
                  <Field label="Shift Type"  value={assignment.shift_type} />
                  <Field label="Shift Start" value={formatDateTime(assignment.start_time)} />
                  <Field label="Shift End"   value={formatDateTime(assignment.end_time)} />
                  {assignment.task_description && (
                    <div className="col-12">
                      <label style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Task Description:</label>
                      <p style={{ fontSize: "15px", margin: "6px 0 0", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>{assignment.task_description}</p>
                    </div>
                  )}
                </div>

                {(assignment.reading_start != null || assignment.reading_end != null) && (
                  <div className="mt-4 pt-4" style={{ borderTop: "1px solid #e5e7eb" }}>
                    <h6 style={{ fontWeight: "600", marginBottom: "16px" }}>SMR Reading</h6>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Start (Hrs):</label>
                        <p style={{ fontSize: "22px", fontWeight: "bold", margin: "4px 0 0" }}>{assignment.reading_start ?? "—"}</p>
                      </div>
                      <div className="col-md-4">
                        <label style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>End (Hrs):</label>
                        <p style={{ fontSize: "22px", fontWeight: "bold", margin: "4px 0 0" }}>{assignment.reading_end ?? "—"}</p>
                      </div>
                      {smrDiff !== null && (
                        <div className="col-md-4">
                          <label style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Total (Hrs):</label>
                          <p style={{ fontSize: "22px", fontWeight: "bold", margin: "4px 0 0", color: "#3b82f6" }}>{smrDiff}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Time Entries */}
            <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-header d-flex align-items-center justify-content-between" style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #e9ecef", padding: "16px 20px" }}>
                <h5 style={{ margin: 0, fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                  <MdAccessTime size={20} color="#0ea5e9" />
                  Time Entries
                  <span style={{ fontSize: "13px", backgroundColor: "#dbeafe", color: "#1e40af", borderRadius: "10px", padding: "2px 10px", fontWeight: "600" }}>{timeEntries.length}</span>
                </h5>
                {totalEntryHours > 0 && (
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#0ea5e9" }}>Total: {totalEntryHours.toFixed(2)} hrs</span>
                )}
              </div>
              <div className="card-body p-0">
                {timeEntries.length === 0 ? (
                  <p style={{ color: "#9ca3af", fontStyle: "italic", margin: 0, padding: "20px" }}>No time entries recorded.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table mb-0" style={{ fontSize: "14px" }}>
                      <thead style={{ backgroundColor: "#f8fafc" }}>
                        <tr>
                          {["#", "Time Category", "Activity", "Start", "End", "Duration"].map((h) => (
                            <th key={h} style={{ padding: "12px 16px", fontWeight: "600", color: "#6b7280", fontSize: "12px", textTransform: "uppercase" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {timeEntries.map((entry, idx) => {
                          const catColor = TIME_CAT_COLORS[entry.time_category] || { bg: "#f3f4f6", text: "#374151" };
                          const hrs      = entry.duration_hours || calcHours(entry.start_time, entry.end_time);
                          return (
                            <tr key={entry.id || idx}>
                              <td style={{ padding: "12px 16px", color: "#9ca3af", fontWeight: "600" }}>{idx + 1}</td>
                              <td style={{ padding: "12px 16px" }}>
                                {entry.time_category
                                  ? <span style={{ fontSize: "12px", backgroundColor: catColor.bg, color: catColor.text, padding: "3px 10px", borderRadius: "4px", fontWeight: "600", whiteSpace: "nowrap" }}>{entry.time_category}</span>
                                  : <span style={{ color: "#9ca3af" }}>—</span>
                                }
                              </td>
                              <td style={{ padding: "12px 16px" }}>{entry.activity || <span style={{ color: "#9ca3af" }}>—</span>}</td>
                              <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>{formatDateTime(entry.start_time)}</td>
                              <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>{entry.end_time ? formatDateTime(entry.end_time) : <span style={{ color: "#9ca3af" }}>—</span>}</td>
                              <td style={{ padding: "12px 16px", fontWeight: "600", color: "#0ea5e9" }}>
                                {hrs ? `${parseFloat(hrs).toFixed(2)} hrs` : <span style={{ color: "#9ca3af" }}>—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {timeEntries.length > 1 && totalEntryHours > 0 && (
                        <tfoot style={{ borderTop: "2px solid #e5e7eb" }}>
                          <tr>
                            <td colSpan="5" style={{ padding: "12px 16px", fontWeight: "700", textAlign: "right", color: "#374151" }}>Total Hours:</td>
                            <td style={{ padding: "12px 16px", fontWeight: "700", color: "#0ea5e9" }}>{totalEntryHours.toFixed(2)} hrs</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="col-lg-4">
            <div className="card shadow-sm mb-3" style={{ borderRadius: "12px" }}>
              <div className="card-header" style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #e9ecef", padding: "16px 20px" }}>
                <h5 style={{ margin: 0, fontWeight: "600" }}>Statistics</h5>
              </div>
              <div className="card-body" style={{ padding: "24px" }}>
                {[
                  { label: "Engine Hours",    value: smrDiff !== null ? `${smrDiff} hrs` : "0" },
                  { label: "Time Entries",    value: `${timeEntries.length}` },
                  { label: "Logged Hours",    value: totalEntryHours > 0 ? `${totalEntryHours.toFixed(2)} hrs` : "0" },
                  { label: "Fuel Consumed",   value: "0.00 L" },
                  { label: "Operations Logs", value: "0" },
                ].map((s, i) => (
                  <div key={i} className="mb-3">
                    <p style={{ fontSize: "13px", color: "#6b7280", margin: 0, fontWeight: "600" }}>{s.label}</p>
                    <p style={{ fontSize: "22px", fontWeight: "bold", margin: "4px 0 0" }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-header" style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #e9ecef", padding: "16px 20px" }}>
                <h5 style={{ margin: 0, fontWeight: "600" }}>Actions</h5>
              </div>
              <div className="card-body" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {(canEdit || canDelete) && (
                  <div className="d-flex gap-2">
                    {canEdit && (
                      <button className="btn btn-primary flex-fill" onClick={() => navigate(`/moms/assignments/${id}/edit`)} style={{ height: "40px", fontSize: "14px", fontWeight: "500", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        <MdEdit size={18} /> Edit
                      </button>
                    )}
                    {canDelete && (
                      <button className="btn btn-danger flex-fill" onClick={handleDelete} style={{ height: "40px", fontSize: "14px", fontWeight: "500", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        <MdDelete size={18} /> Delete
                      </button>
                    )}
                  </div>
                )}
                <button className="btn w-100" onClick={() => handleExport("pdf")} style={{ height: "40px", fontSize: "14px", fontWeight: "500", borderRadius: "8px", backgroundColor: "#dc2626", color: "white", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <MdPictureAsPdf size={18} /> Export DER (PDF)
                </button>
                <button className="btn w-100" onClick={() => handleExport("csv")} style={{ height: "40px", fontSize: "14px", fontWeight: "500", borderRadius: "8px", backgroundColor: "#0891b2", color: "white", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <MdTableChart size={18} /> Export DER (CSV)
                </button>
                <button className="btn btn-secondary w-100" onClick={() => navigate("/moms/assignments")} style={{ height: "40px", fontSize: "14px", fontWeight: "500", borderRadius: "8px" }}>
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}