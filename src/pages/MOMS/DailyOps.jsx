import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import baseApi from "../../api/baseApi";
import { MdAdd, MdPictureAsPdf } from "react-icons/md";
import EndShiftModal from "../../components/MOMS/EndShiftModal";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import { can } from "../../utils/permissions";

const STATUS_COLORS = {
  "In Progress":      { bg: "#dbeafe", text: "#1e40af" },
  "Completed":        { bg: "#d1fae5", text: "#065f46" },
  "Pending Approval": { bg: "#fef3c7", text: "#92400e" },
  "Approved":         { bg: "#e5e7eb", text: "#374151" },
};

const fmt = (n, d = 2) => (n != null && n !== "" ? parseFloat(n).toFixed(d) : "—");

function DERCell({ value, type }) {
  if (value == null || value === "" || parseFloat(value) === 0) {
    return <td className="text-center" style={{ color: "#9ca3af" }}>—</td>;
  }
  return (
    <td className="text-center fw-bold" style={{ backgroundColor: type === "available" ? "#d1fae5" : "#fee2e2", color: type === "available" ? "#065f46" : "#991b1b" }}>
      {parseFloat(value).toFixed(2)}
    </td>
  );
}

export default function DailyOps() {
  const navigate     = useNavigate();
  const { permissions } = useAuth();
  const canViewStats = can(permissions, "moms.operations.approve");
  const { formatDate, formatDateTime } = useSettings();
  const queryClient  = useQueryClient();

  const [selectedDate,      setSelectedDate]      = useState(new Date().toISOString().split("T")[0]);
  const [showEndShiftModal, setShowEndShiftModal] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState(null);
  // ADDED: loading state for PDF download button
  const [downloadingPdf,    setDownloadingPdf]    = useState(false);

  const opsCacheKey = ["moms_daily_ops", selectedDate];
  const { data: opsData, isLoading: loading } = useQuery({
    queryKey: opsCacheKey,
    queryFn:  () => baseApi.get(`/api/moms/operations/daily?date=${selectedDate}`).then((r) => r.data),
    staleTime: 60 * 1000,
  });

  const { data: statsData } = useQuery({
    queryKey:  ["moms_ops_stats"],
    queryFn:   () => baseApi.get("/api/moms/operations/stats").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    enabled:   canViewStats,
  });

  const operations = opsData?.operations || [];
  const stats      = statsData || { totalShifts: 0, inProgress: 0, pendingApproval: 0, approved: 0 };

  const summary = useMemo(() => operations.reduce((acc, op) => {
    const h = (parseFloat(op.ending_hour_meter) || 0) - (parseFloat(op.starting_hour_meter) || 0);
    acc.engineHours += h > 0 ? h : 0;
    acc.available   += parseFloat(op.hours_available)   || 0;
    acc.unavailable += parseFloat(op.hours_unavailable) || 0;
    acc.tons        += parseFloat(op.tons)              || 0;
    acc.fuel        += parseFloat(op.fuel_consumed)     || 0;
    return acc;
  }, { engineHours: 0, available: 0, unavailable: 0, tons: 0, fuel: 0 }), [operations]);

  const refetch = () => queryClient.invalidateQueries({ queryKey: opsCacheKey });

  const handleEndShift = (op)  => { setSelectedOperation(op); setShowEndShiftModal(true); };
  const handleApprove  = async (id) => {
    try {
      await baseApi.post(`/api/moms/operations/${id}/approve`);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["moms_ops_stats"] });
    } catch (e) { console.error(e); }
  };

  const handleExportCSV = () => {
    if (!operations.length) return;
    const headers = ["Date","Asset No","Description","Start Hrs","Finish Hrs","Ready Hrs",
      "Standby With Operator (Delays)","Hrs Available","Hrs Unavailable",
      "Tons","Trips","Fuel (L)","Operator","Location","Department","Status","Delay Reason","Notes"];
    const rows = operations.map(op => [
      op.shift_start_time ? formatDate(op.shift_start_time) : selectedDate,
      op.machine_asset_no||"", op.machine_description||"",
      op.starting_hour_meter||"", op.ending_hour_meter||"",
      op.ready_hours||"", op.standby_hours||"",
      op.hours_available||"", op.hours_unavailable||"",
      op.tons||"", op.trips||"", op.fuel_consumed||"",
      op.operator||"", op.location||"", op.department||"",
      op.status||"", op.delay_reason||"", op.end_shift_notes||"",
    ]);
    const csv  = [headers,...rows].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv;charset=utf-8;"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href=url; a.download=`DER_${selectedDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ADDED: Download Daily Production Summary PDF from backend blade template
  const handleExportPdf = async () => {
    setDownloadingPdf(true);
    try {
      const response = await baseApi.get("/api/moms/reports/daily-production", {
        params: { date: selectedDate },
        responseType: "blob",
      });
      const url  = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href  = url;
      link.setAttribute("download", `Daily_Production_Report_${selectedDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF export failed:", e);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const displayDate  = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const totalTrips   = operations.reduce((acc, op) => acc + (parseInt(op.trips) || 0), 0);

  return (
    <Layout>
      <div className="container-fluid px-2 px-md-3">

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div>
            <h4 className="fw-bold mb-0" style={{ fontSize: "clamp(18px, 4vw, 26px)" }}>Daily Equipment Report</h4>
            <small className="text-muted">Plant & Equipment — PNG Mining Standard</small>
          </div>
          <button className="btn btn-success d-flex align-items-center gap-2" style={{ height: "40px", borderRadius: "8px", fontWeight: 500, whiteSpace: "nowrap" }} onClick={() => navigate("/moms/operations/start-shift")}>
            <MdAdd size={18} /> Start New Shift
          </button>
        </div>

        {canViewStats && (
          <div className="row g-2 mb-3">
            {[
              { label: "Total Shifts",     value: stats.totalShifts,     color: "#1e293b" },
              { label: "In Progress",      value: stats.inProgress,      color: "#3b82f6" },
              { label: "Pending Approval", value: stats.pendingApproval, color: "#ca8a04" },
              { label: "Approved",         value: stats.approved,        color: "#16a34a" },
            ].map(s => (
              <div className="col-6 col-lg-3" key={s.label}>
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "10px" }}>
                  <div className="card-body p-3">
                    <p className="text-muted mb-1" style={{ fontSize: "12px" }}>{s.label}</p>
                    <h2 className="mb-0 fw-bold" style={{ fontSize: "28px", color: s.color }}>{s.value}</h2>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "12px" }}>
          <div className="card-body p-3 p-md-4">
            <div className="d-flex flex-wrap align-items-end gap-2 mb-3">
              <div>
                <label className="form-label fw-500 mb-1" style={{ fontSize: "13px" }}>Select Date</label>
                <input type="date" className="form-control form-control-sm" value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  style={{ height: "38px", borderRadius: "7px", minWidth: "160px" }} />
              </div>
              {/* CSV export — unchanged */}
              <button
                className="btn btn-outline-success btn-sm"
                style={{ height: "38px", borderRadius: "7px" }}
                onClick={handleExportCSV}
              >
                Export CSV
              </button>
              {/* ADDED: Daily Production Summary PDF button */}
              <button
                className="btn btn-sm d-flex align-items-center gap-1"
                style={{ height: "38px", borderRadius: "7px", backgroundColor: "#dc2626", color: "#fff", border: "none", fontWeight: 500, whiteSpace: "nowrap" }}
                onClick={handleExportPdf}
                disabled={downloadingPdf}
              >
                {downloadingPdf
                  ? <><span className="spinner-border spinner-border-sm me-1" /> Generating...</>
                  : <><MdPictureAsPdf size={16} /> Daily Production Report (PDF)</>
                }
              </button>
            </div>

            <div className="row g-2 mb-3">
              {[
                { label: "Engine Hrs",      value: fmt(summary.engineHours), bg: "#f8fafc", tc: "#374151" },
                { label: "Hrs Available",   value: fmt(summary.available),   bg: "#d1fae5", tc: "#065f46" },
                { label: "Hrs Unavailable", value: fmt(summary.unavailable), bg: "#fee2e2", tc: "#991b1b" },
                { label: "Total Tons",      value: fmt(summary.tons, 0),     bg: "#f8fafc", tc: "#374151" },
                { label: "Fuel (L)",        value: fmt(summary.fuel),        bg: "#f8fafc", tc: "#374151" },
              ].map(s => (
                <div className="col-6 col-md-4 col-lg" key={s.label}>
                  <div className="p-2 p-md-3 rounded-3 text-center h-100" style={{ backgroundColor: s.bg }}>
                    <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px", color: s.tc, marginBottom: "2px" }}>{s.label}</div>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: s.tc }}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <h6 className="fw-semibold mb-2" style={{ fontSize: "14px" }}>Daily Operations — {displayDate}</h6>

            {loading ? (
              <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
            ) : operations.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted mb-3">No operations recorded for {displayDate}</p>
                <button className="btn btn-success btn-sm" onClick={() => navigate("/moms/operations/start-shift")}>+ Start First Shift</button>
              </div>
            ) : (
              <div className="table-responsive" style={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <table className="table table-hover table-sm align-middle mb-0" style={{ fontSize: "12.5px", whiteSpace: "nowrap", minWidth: "1400px" }}>
                  <thead style={{ backgroundColor: "#f8fafc", fontSize: "12px" }}>
                    <tr>
                      <th style={th()}>Date</th>
                      <th style={th()}>Asset No</th>
                      <th style={th()}>Description</th>
                      <th style={th()}>Start Hrs</th>
                      <th style={th()}>Finish Hrs</th>
                      <th style={th()}>Ready Hrs</th>
                      <th style={th()}>Standby (Delays)</th>
                      <th style={{ ...th(), backgroundColor: "#d1fae5", color: "#065f46" }}>Hrs Available</th>
                      <th style={{ ...th(), backgroundColor: "#fee2e2", color: "#991b1b" }}>Hrs Unavailable</th>
                      <th style={th()}>Tons</th>
                      <th style={th()}>Trips</th>
                      <th style={th()}>Fuel (L)</th>
                      <th style={th()}>Operator</th>
                      <th style={th()}>Location</th>
                      <th style={th()}>Department</th>
                      <th style={th()}>Status</th>
                      <th style={{ ...th(), minWidth: "140px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operations.map(op => {
                      const sc     = STATUS_COLORS[op.status] || STATUS_COLORS["Completed"];
                      const opDate = op.shift_start_time ? formatDate(op.shift_start_time) : selectedDate;
                      return (
                        <tr key={op.id}>
                          <td style={td()}>{opDate}</td>
                          <td style={{ ...td(), fontWeight:600, color:"#3b82f6", cursor:"pointer" }} onClick={() => navigate(`/moms/operations/${op.id}`)}>
                            {op.machine_asset_no || "—"}
                          </td>
                          <td style={td()}>{op.machine_description || "—"}</td>
                          <td style={{ ...td(), color:"#16a34a", fontWeight:600 }}>{op.starting_hour_meter ?? "—"}</td>
                          <td style={{ ...td(), color: op.ending_hour_meter ? "#16a34a" : "#9ca3af", fontWeight:600 }}>{op.ending_hour_meter ?? "—"}</td>
                          <td style={td()}>{op.ready_hours    != null ? fmt(op.ready_hours)   : "—"}</td>
                          <td style={td()}>{op.standby_hours  != null ? fmt(op.standby_hours) : "—"}</td>
                          <DERCell value={op.hours_available}   type="available" />
                          <DERCell value={op.hours_unavailable} type="unavailable" />
                          <td className="text-center" style={td()}>{op.tons != null ? fmt(op.tons, 0) : "—"}</td>
                          <td className="text-center" style={td()}>{op.trips ?? "—"}</td>
                          <td className="text-center" style={td()}>{op.fuel_consumed != null ? fmt(op.fuel_consumed) : "—"}</td>
                          <td style={td()}>{op.operator   || "—"}</td>
                          <td style={td()}>{op.location   || "—"}</td>
                          <td style={td()}>{op.department || "—"}</td>
                          <td style={td()}>
                            <span style={{ backgroundColor:sc.bg, color:sc.text, padding:"3px 7px", borderRadius:"5px", fontWeight:600, fontSize:"11px" }}>{op.status}</span>
                          </td>
                          <td style={{ ...td(), whiteSpace:"nowrap" }}>
                            <button className="btn btn-link btn-sm p-0 me-2" style={{ color:"#3b82f6", fontSize:"12px" }} onClick={() => navigate(`/moms/operations/${op.id}`)}>View</button>
                            {op.status === "In Progress" && (
                              <button className="btn btn-sm" style={{ backgroundColor:"#16a34a", color:"#fff", border:"none", fontSize:"11px", padding:"3px 9px", borderRadius:"5px" }} onClick={() => handleEndShift(op)}>End Shift</button>
                            )}
                            {op.status === "Pending Approval" && canViewStats && (
                              <button className="btn btn-sm" style={{ backgroundColor:"#7c3aed", color:"#fff", border:"none", fontSize:"11px", padding:"3px 9px", borderRadius:"5px" }} onClick={() => handleApprove(op.id)}>Approve</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {operations.length > 1 && (
                    <tfoot>
                      <tr className="fw-bold" style={{ backgroundColor:"#f8fafc", borderTop:"2px solid #e2e8f0" }}>
                        <td colSpan="7" className="text-end pe-3 py-2 text-secondary">TOTALS</td>
                        <td className="text-center py-2 fw-bold" style={{ backgroundColor:"#d1fae5", color:"#065f46" }}>{fmt(summary.available)}</td>
                        <td className="text-center py-2 fw-bold" style={{ backgroundColor:"#fee2e2", color:"#991b1b" }}>{fmt(summary.unavailable)}</td>
                        <td className="text-center py-2">{fmt(summary.tons, 0)}</td>
                        <td className="text-center py-2">{totalTrips > 0 ? totalTrips : "—"}</td>
                        <td className="text-center py-2">{fmt(summary.fuel)} L</td>
                        <td colSpan="5" />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <EndShiftModal
        show={showEndShiftModal}
        onHide={() => setShowEndShiftModal(false)}
        operation={selectedOperation}
        onSuccess={() => refetch()}
      />
    </Layout>
  );
}

const th = () => ({ padding: "10px 12px", fontWeight: 600, fontSize: "12px", borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" });
const td = () => ({ padding: "9px 12px" });