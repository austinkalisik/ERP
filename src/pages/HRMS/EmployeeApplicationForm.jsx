import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FaUserCircle } from "react-icons/fa";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";
import SearchableSelect from "../../components/SearchableSelect";

// ── Shared searchable select helpers ─────────────────────────────────────────
function LeaveTypeSelect({ value, onChange, leaveTypes }) {
  const options = leaveTypes.length > 0
    ? leaveTypes.map((lt) => ({ value: lt.leave_type, label: lt.leave_type }))
    : [
        { value: "Annual Leave",  label: "Annual Leave" },
        { value: "R&R",           label: "R&R" },
        { value: "Sick Leave",    label: "Sick Leave" },
      ];
  return (
    <SearchableSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Search leave type..."
    />
  );
}

function OTTypeSelect({ value, onChange, overtimeTypes }) {
  const options = overtimeTypes.length > 0
    ? overtimeTypes.map((ot) => ({ value: ot.overtime_type, label: `${ot.overtime_type} (${parseFloat(ot.multiplier).toFixed(2)}×)` }))
    : [
        { value: "Regular OT",          label: "Regular OT (1.50×)" },
        { value: "Night Shift OT",      label: "Night Shift OT (1.10×)" },
        { value: "Off Day OT",          label: "Off Day OT (2.00×)" },
        { value: "Public Holiday Work", label: "Public Holiday Work (2.00×)" },
      ];
  return (
    <SearchableSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder="Search overtime type..."
    />
  );
}

export default function ApplicationFormsTab({ employee, onApplicationUpdated }) {
  const queryClient = useQueryClient();
  const [showNewApplicationModal, setShowNewApplicationModal] = useState(false);

  // ── Static lookup data — reuses cache from Applications.jsx ──────────────
  const { data: leaveTypes    = [] } = useQuery({ queryKey: ["hrms_leave_types"],    queryFn: () => baseApi.get("/api/hrms/leave-types").then((r)    => r.data || []), staleTime: 30 * 60 * 1000 });
  const { data: overtimeTypes = [] } = useQuery({ queryKey: ["hrms_overtime_types"], queryFn: () => baseApi.get("/api/hrms/overtime-types").then((r) => r.data || []), staleTime: 30 * 60 * 1000 });

  // ── Applications per employee — cached 30s ───────────────────────────────
  const cacheKey = ["hrms_employee_applications", employee?.biometric_id];
  const { data: applications = [], isLoading } = useQuery({
    queryKey: cacheKey,
    queryFn:  () => baseApi.get(`/api/hrms/applications/${employee.biometric_id}`).then((r) => r.data || []),
    staleTime: 30 * 1000,
    enabled:  !!employee?.biometric_id,
  });

  const handleNewApplication = async (formData) => {
    try {
      await baseApi.post(`/api/hrms/applications/${employee.biometric_id}`, formData);
      queryClient.invalidateQueries({ queryKey: cacheKey });
      if (onApplicationUpdated) await onApplicationUpdated();
      setShowNewApplicationModal(false);
      Swal.fire({ icon: "success", title: "Success!", text: "Application submitted successfully!", confirmButtonColor: "#28a745" });
    } catch {
      Swal.fire({ icon: "error", title: "Failed", text: "Failed to submit application.", confirmButtonColor: "#d33" });
    }
  };

  const formatDateTime = (date, time) => {
    if (!date) return "N/A";
    const dateOnly = date.includes("T") ? date.split("T")[0] : date.split(" ")[0];
    const [year, month, day] = dateOnly.split("-");
    const formatted = `${year}-${month}-${day}`;
    return time ? `${formatted} ${time}` : formatted;
  };

  const getStatusBadge = (status) => {
    const map = {
      "draft":            { bg: "#9ca3af", text: "Draft" },
      "pending head":     { bg: "#f59e0b", text: "Pending Head" },
      "approved by head": { bg: "#3b82f6", text: "Approved by Head" },
      "pending hr":       { bg: "#f59e0b", text: "Pending HR" },
      "approved by hr":   { bg: "#10b981", text: "Approved by HR" },
      "posted":           { bg: "#16a34a", text: "Posted" },
      "rejected":         { bg: "#dc2626", text: "Rejected" },
      "cancelled":        { bg: "#6b7280", text: "Cancelled" },
    };
    const s = map[status?.toLowerCase()] || map["draft"];
    return (
      <span style={{ backgroundColor: s.bg, color: "white", padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "500" }}>
        {s.text}
      </span>
    );
  };

  return (
    <div className="row g-4">
      {/* Employee Info Card */}
      <div className="col-lg-4">
        <div className="card" style={{ borderRadius: "12px", backgroundColor: "white", borderTop: "3px solid #ffe680" }}>
          <div className="card-body text-center py-5">
            <div style={{ width: "120px", height: "120px", borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", backgroundColor: "#e0e0e0" }}>
              {employee.profile_picture
                ? <img src={employee.profile_picture} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <FaUserCircle size={100} color="#555" />
              }
            </div>
            <h4 className="mb-2 fw-bold">{employee.fullname}</h4>
            <p className="text-muted mb-0" style={{ fontSize: "14px" }}>{employee.biometric_id}</p>
            <p className="text-muted" style={{ fontSize: "13px" }}>{employee.department}</p>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="col-lg-8">
        <div className="card" style={{ borderRadius: "12px", backgroundColor: "white", borderTop: "3px solid #ffe680" }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-end mb-4">
              <button className="btn btn-primary" onClick={() => setShowNewApplicationModal(true)} style={{ fontSize: "14px", padding: "10px 24px", borderRadius: "6px", fontWeight: "500" }}>
                New Application
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead style={{ backgroundColor: "#f8f9fa" }}>
                    <tr>
                      <th style={{ fontSize: "13px", padding: "12px" }}>Application Type</th>
                      <th style={{ fontSize: "13px", padding: "12px" }}>Type</th>
                      <th style={{ fontSize: "13px", padding: "12px" }}>Purpose</th>
                      <th style={{ fontSize: "13px", padding: "12px" }}>Date/Time From</th>
                      <th style={{ fontSize: "13px", padding: "12px" }}>Date/Time To</th>
                      <th style={{ fontSize: "13px", padding: "12px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.length > 0 ? (
                      applications.map((app) => (
                        <tr key={app.id}>
                          <td style={{ fontSize: "13px", padding: "12px" }}>
                            <span style={{ backgroundColor: app.application_type === "Leave" ? "#2563eb" : "#7c3aed", color: "#fff", fontSize: "11px", fontWeight: "600", padding: "3px 8px", borderRadius: "999px", whiteSpace: "nowrap" }}>
                              {app.application_type || "N/A"}
                            </span>
                          </td>
                          <td style={{ fontSize: "13px", padding: "12px" }}>
                            {app.application_type === "Leave"
                              ? <>{app.leave_type || "N/A"}{app.leave_duration === "Half Day" && <div><small className="text-muted">({app.half_day_period} - Half Day)</small></div>}</>
                              : (app.overtime_type || "N/A")}
                          </td>
                          <td style={{ fontSize: "13px", padding: "12px" }}>
                            <span className="text-truncate d-inline-block" style={{ maxWidth: "150px" }} title={app.purpose}>{app.purpose || "N/A"}</span>
                          </td>
                          <td style={{ fontSize: "13px", padding: "12px" }}>{formatDateTime(app.date_from, app.time_from)}</td>
                          <td style={{ fontSize: "13px", padding: "12px" }}>{formatDateTime(app.date_to, app.time_to)}</td>
                          <td style={{ fontSize: "13px", padding: "12px" }}>{getStatusBadge(app.status)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="6" className="text-center py-4" style={{ fontSize: "14px" }}>No applications found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showNewApplicationModal && (
        <NewApplicationModal
          leaveTypes={leaveTypes}
          overtimeTypes={overtimeTypes}
          onClose={() => setShowNewApplicationModal(false)}
          onSave={handleNewApplication}
        />
      )}
    </div>
  );
}

function NewApplicationModal({ onClose, onSave, leaveTypes, overtimeTypes }) {
  const [formData, setFormData] = useState({
    application_type: "", leave_type: "", leave_duration: "Full Day", half_day_period: "AM",
    leave_start_time: "", leave_end_time: "", overtime_type: "Regular OT", status: "Draft",
    overtime_date: "", ot_in: "", ot_out: "", date_from: "", date_to: "", purpose: "",
  });

  const isOvertime = formData.application_type === "Overtime";
  const isLeave    = formData.application_type === "Leave";

  const handleSubmit = (e) => {
    e.preventDefault();
    let payload = { ...formData };
    if (isOvertime) {
      payload.date_from = formData.overtime_date; payload.date_to = formData.overtime_date;
      payload.time_from = formData.ot_in; payload.time_to = formData.ot_out;
      payload.leave_type = null; payload.leave_duration = null; payload.half_day_period = null;
    }
    if (isLeave) {
      payload.overtime_type = null;
      if (formData.leave_duration === "Half Day") {
        payload.date_to = formData.date_from; payload.time_from = formData.leave_start_time;
        payload.time_to = formData.leave_end_time;
      } else {
        payload.time_from = null; payload.time_to = null; payload.half_day_period = null;
      }
    }
    delete payload.overtime_date; delete payload.ot_in; delete payload.ot_out;
    delete payload.leave_start_time; delete payload.leave_end_time;
    onSave(payload);
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "750px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">New Application</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label fw-semibold">Application Type:</label>
                <select className="form-select" value={formData.application_type} onChange={(e) => setFormData({ ...formData, application_type: e.target.value })} required>
                  <option value="">Select</option>
                  <option value="Leave">Leave</option>
                  <option value="Overtime">Overtime</option>
                </select>
              </div>

              {isOvertime && (
                <>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Overtime Type:</label>
                    <OTTypeSelect value={formData.overtime_type} onChange={(v) => setFormData({ ...formData, overtime_type: v })} overtimeTypes={overtimeTypes} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Overtime Date:</label>
                    <input type="date" className="form-control" value={formData.overtime_date} onChange={(e) => setFormData({ ...formData, overtime_date: e.target.value })} required />
                  </div>
                  <div className="row mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold">OT Start Time:</label>
                      <input type="time" className="form-control" value={formData.ot_in} onChange={(e) => setFormData({ ...formData, ot_in: e.target.value })} required />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">OT End Time:</label>
                      <input type="time" className="form-control" value={formData.ot_out} onChange={(e) => setFormData({ ...formData, ot_out: e.target.value })} required />
                    </div>
                  </div>
                </>
              )}

              {isLeave && (
                <>
                  <div className="row mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold">Leave Type:</label>
                      <LeaveTypeSelect value={formData.leave_type} onChange={(v) => setFormData({ ...formData, leave_type: v })} leaveTypes={leaveTypes} />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">Leave Duration:</label>
                      <select className="form-select" value={formData.leave_duration} onChange={(e) => setFormData({ ...formData, leave_duration: e.target.value })} required>
                        <option value="Full Day">Full Day</option>
                        <option value="Half Day">Half Day</option>
                      </select>
                    </div>
                  </div>

                  {formData.leave_duration === "Half Day" && (
                    <>
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Half Day Period:</label>
                        <select className="form-select" value={formData.half_day_period} onChange={(e) => setFormData({ ...formData, half_day_period: e.target.value })} required>
                          <option value="AM">Morning (AM)</option>
                          <option value="PM">Afternoon (PM)</option>
                        </select>
                      </div>
                      <div className="row mb-3">
                        <div className="col-6">
                          <label className="form-label fw-semibold">Start Time:</label>
                          <input type="time" className="form-control" value={formData.leave_start_time} onChange={(e) => setFormData({ ...formData, leave_start_time: e.target.value })} required />
                        </div>
                        <div className="col-6">
                          <label className="form-label fw-semibold">End Time:</label>
                          <input type="time" className="form-control" value={formData.leave_end_time} onChange={(e) => setFormData({ ...formData, leave_end_time: e.target.value })} required />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="row mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold">{formData.leave_duration === "Half Day" ? "Leave Date:" : "Date From:"}</label>
                      <input type="date" className="form-control" value={formData.date_from} onChange={(e) => setFormData({ ...formData, date_from: e.target.value })} required />
                    </div>
                    {formData.leave_duration === "Full Day" && (
                      <div className="col-6">
                        <label className="form-label fw-semibold">Date To:</label>
                        <input type="date" className="form-control" value={formData.date_to} onChange={(e) => setFormData({ ...formData, date_to: e.target.value })} required />
                      </div>
                    )}
                  </div>

                  {formData.leave_duration === "Half Day" && formData.date_from && formData.leave_start_time && formData.leave_end_time && (
                    <div className="alert alert-info">
                      <strong>📋 Half Day Summary:</strong>
                      <div className="mt-2">
                        <div>Date: {formData.date_from}</div>
                        <div>Period: {formData.half_day_period === "AM" ? "Morning (AM)" : "Afternoon (PM)"}</div>
                        <div>Time: {formData.leave_start_time} – {formData.leave_end_time} ({calculateHours(formData.leave_start_time, formData.leave_end_time)} hours)</div>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="mb-3">
                <label className="form-label fw-semibold">Purpose / Reason:</label>
                <textarea className="form-control" rows="4" value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} placeholder="Explain the reason for this application" required />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
              <button type="submit" className="btn btn-primary">Submit Application</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function calculateHours(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let startMins = sh * 60 + sm, endMins = eh * 60 + em;
  if (endMins < startMins) endMins += 24 * 60;
  return ((endMins - startMins) / 60).toFixed(1);
}