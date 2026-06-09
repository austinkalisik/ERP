import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FaUserCircle } from "react-icons/fa";
import { MdSearch } from "react-icons/md";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";
import { can } from "../../utils/permissions";

const formatDate = (date) => {
  if (!date) return "N/A";
  return date.includes("T") ? date.split("T")[0] : date.split(" ")[0];
};

export default function AttendanceTab({ employee, permissions }) {
  const queryClient   = useQueryClient();
  const [currentPage,    setCurrentPage]    = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm,     setSearchTerm]     = useState("");
  const [showAddModal,     setShowAddModal]     = useState(false);
  const [showAbsentModal,  setShowAbsentModal]  = useState(false);
  const [showUpdateModal,  setShowUpdateModal]  = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [selectedRecord,   setSelectedRecord]   = useState(null);

  // ── Per-employee attendance — cached 2 min ────────────────────────────────
  const cacheKey = ["hrms_attendance", employee?.biometric_id];
  const { data: attendanceRecords = [], isLoading: loading } = useQuery({
    queryKey:  cacheKey,
    queryFn:   () => baseApi.get(`/api/hrms/attendance/${employee.biometric_id}`).then((r) => r.data || []),
    staleTime: 2 * 60 * 1000,
    enabled:   !!employee?.biometric_id,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: cacheKey });

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  const handleAddAttendance = async (formData) => {
    const exists = attendanceRecords.some((r) => formatDate(r.date) === formData.date);
    if (exists) { Swal.fire({ icon: "warning", title: "Duplicate Entry", text: "Attendance for this date already exists." }); return; }
    try {
      await baseApi.post(`/api/hrms/attendance/${employee.biometric_id}`, formData);
      refetch(); setShowAddModal(false);
      Swal.fire({ icon: "success", title: "Success!", text: "Attendance record added!", confirmButtonColor: "#28a745" });
    } catch { Swal.fire({ icon: "error", title: "Failed", text: "Failed to add attendance record.", confirmButtonColor: "#d33" }); }
  };

  const handleMarkHoliday = async (formData) => {
    try {
      await baseApi.post(`/api/hrms/attendance/${employee.biometric_id}/holiday`, formData);
      refetch(); setShowHolidayModal(false);
      Swal.fire({ icon: "success", title: "Success!", text: "Marked as Public Holiday!", confirmButtonColor: "#28a745" });
    } catch { Swal.fire({ icon: "error", title: "Failed", confirmButtonColor: "#d33" }); }
  };

  const handleMarkAbsent = async (formData) => {
    try {
      await baseApi.post(`/api/hrms/attendance/${employee.biometric_id}/absent`, formData);
      refetch(); setShowAbsentModal(false);
      Swal.fire({ icon: "success", title: "Success!", text: "Marked as absent!", confirmButtonColor: "#28a745" });
    } catch { Swal.fire({ icon: "error", title: "Failed", confirmButtonColor: "#d33" }); }
  };

  const handleUpdateAttendance = async (id, formData) => {
    try {
      await baseApi.put(`/api/hrms/attendance/${id}`, formData);
      refetch(); setShowUpdateModal(false); setSelectedRecord(null);
      Swal.fire({ icon: "success", title: "Success!", text: "Attendance updated!", confirmButtonColor: "#28a745" });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed", text: err.response?.data?.message || "Failed to update.", confirmButtonColor: "#d33" });
    }
  };

  // ── Filtering & pagination ─────────────────────────────────────────────────
  const filteredRecords  = attendanceRecords.filter((r) => String(r.date || "").toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages       = Math.ceil(filteredRecords.length / entriesPerPage);
  const startIndex       = (currentPage - 1) * entriesPerPage;
  const currentRecords   = filteredRecords.slice(startIndex, startIndex + entriesPerPage);

  const shiftBadge = (shiftType) => {
    if (!shiftType) return <span className="text-muted">—</span>;
    const isNight = shiftType.toLowerCase().includes("night");
    return (
      <span style={{ backgroundColor: isNight ? "#1e293b" : "#fef9c3", color: isNight ? "#f8fafc" : "#92400e", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "600" }}>
        {isNight ? "🌙 Night" : "☀️ Day"}
      </span>
    );
  };

  const displayHours = (status) => ["Present", "Late", "Public Holiday"].includes(status) ? "12.00" : "0.00";

  const statusBadge = (status) => {
    const map = {
      Present: { bg: "#d1fae5", color: "#065f46" }, Late: { bg: "#fef3c7", color: "#92400e" },
      Absent: { bg: "#fee2e2", color: "#991b1b" }, "On Leave": { bg: "#dbeafe", color: "#1e40af" },
      Holiday: { bg: "#ede9fe", color: "#5b21b6" }, "Public Holiday": { bg: "#fce7f3", color: "#9d174d" },
    };
    const s = map[status] || { bg: "#f3f4f6", color: "#374151" };
    return <span style={{ backgroundColor: s.bg, color: s.color, padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "600" }}>{status}</span>;
  };

  return (
    <div className="row g-4">
      {/* Employee Info Card */}
      <div className="col-lg-4">
        <div className="card" style={{ borderRadius: "12px", backgroundColor: "white", borderTop: "3px solid #ffe680" }}>
          <div className="card-body text-center py-5">
            <div style={{ width: "120px", height: "120px", borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", backgroundColor: "#e0e0e0" }}>
              {employee.profile_picture ? <img src={employee.profile_picture} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <FaUserCircle size={100} color="#555" />}
            </div>
            <h4 className="mb-2 fw-bold">{employee.fullname}</h4>
            <p className="text-muted mb-0" style={{ fontSize: "14px" }}>{employee.biometric_id}</p>
            <p className="text-muted" style={{ fontSize: "13px" }}>{employee.department}</p>
            {employee.shift?.shift_name && <div className="mt-2">{shiftBadge(employee.shift.shift_name)}</div>}
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="col-lg-8">
        <div className="card" style={{ borderRadius: "12px", backgroundColor: "white", borderTop: "3px solid #ffe680" }}>
          <div className="card-body p-4">
            {can(permissions, "attendance.manage") && (
              <div className="d-flex gap-2 mb-4">
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>Add Attendance</button>
                <button className="btn btn-danger" onClick={() => setShowAbsentModal(true)}>Mark Absent</button>
                <button className="btn btn-outline-purple" style={{ borderColor: "#9d174d", color: "#9d174d" }} onClick={() => setShowHolidayModal(true)}>Mark Holiday</button>
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: "14px" }}>Show</span>
                <select className="form-select form-select-sm" style={{ width: "70px" }} value={entriesPerPage} onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                  {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <span style={{ fontSize: "14px" }}>entries</span>
              </div>
              <div className="position-relative">
                <MdSearch style={{ position: "absolute", top: "50%", left: "8px", transform: "translateY(-50%)", color: "#6c757d" }} />
                <input type="text" className="form-control form-control-sm ps-4" style={{ width: "200px" }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by date..." />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead style={{ backgroundColor: "#f8f9fa" }}>
                      <tr>
                        {["Date", "Shift", "AM In", "AM Out", "PM In", "PM Out", "Hours", "Status", "Action"].map((h) => (
                          <th key={h} style={{ fontSize: "13px", padding: "12px" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentRecords.length > 0 ? (
                        currentRecords.map((record) => (
                          <tr key={record.id}>
                            <td style={{ fontSize: "13px", padding: "12px" }}>{formatDate(record.date)}</td>
                            <td style={{ fontSize: "13px", padding: "12px" }}>{shiftBadge(record.shift_type)}</td>
                            <td style={{ fontSize: "13px", padding: "12px" }}>{record.am_time_in  || "—"}</td>
                            <td style={{ fontSize: "13px", padding: "12px" }}>{record.am_time_out || "—"}</td>
                            <td style={{ fontSize: "13px", padding: "12px" }}>{record.pm_time_in  || "—"}</td>
                            <td style={{ fontSize: "13px", padding: "12px" }}>{record.pm_time_out || "—"}</td>
                            <td style={{ fontSize: "13px", padding: "12px" }}><span className="fw-bold text-success">{displayHours(record.status)}</span></td>
                            <td style={{ fontSize: "13px", padding: "12px" }}>{statusBadge(record.status)}</td>
                            <td style={{ fontSize: "13px", padding: "12px" }}>
                              {can(permissions, "attendance.manage") && (
                                <button className="btn btn-sm btn-outline-primary" onClick={() => { setSelectedRecord(record); setShowUpdateModal(true); }}>Update</button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="9" className="text-center py-4" style={{ fontSize: "14px" }}>No attendance records found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div style={{ fontSize: "13px", color: "#6c757d" }}>
                      Showing {startIndex + 1} to {Math.min(startIndex + entriesPerPage, filteredRecords.length)} of {filteredRecords.length} entries
                    </div>
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Previous</button>
                        </li>
                        {[...Array(totalPages)].map((_, i) => {
                          const p = i + 1;
                          if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                            return <li key={p} className={`page-item ${currentPage === p ? "active" : ""}`}><button className="page-link" onClick={() => setCurrentPage(p)}>{p}</button></li>;
                          } else if (p === currentPage - 2 || p === currentPage + 2) {
                            return <li key={p} className="page-item disabled"><span className="page-link">...</span></li>;
                          }
                          return null;
                        })}
                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Next</button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showAddModal     && <AddAttendanceModal    onClose={() => setShowAddModal(false)}                              onSave={handleAddAttendance} />}
      {showHolidayModal && <MarkHolidayModal      onClose={() => setShowHolidayModal(false)}                         onSave={handleMarkHoliday} />}
      {showAbsentModal  && <MarkAbsentModal       onClose={() => setShowAbsentModal(false)}                          onSave={handleMarkAbsent} />}
      {showUpdateModal  && selectedRecord && <UpdateAttendanceModal record={selectedRecord} onClose={() => { setShowUpdateModal(false); setSelectedRecord(null); }} onSave={(fd) => handleUpdateAttendance(selectedRecord.id, fd)} />}
    </div>
  );
}

function TimeFields({ formData, setFormData }) {
  return (
    <>
      <div className="row">
        <div className="col-6 mb-3"><label className="form-label">AM Time In</label><input type="time" className="form-control" value={formData.am_time_in} onChange={(e) => setFormData({ ...formData, am_time_in: e.target.value })} /></div>
        <div className="col-6 mb-3"><label className="form-label">AM Time Out</label><input type="time" className="form-control" value={formData.am_time_out} onChange={(e) => setFormData({ ...formData, am_time_out: e.target.value })} /></div>
      </div>
      <div className="row">
        <div className="col-6 mb-3"><label className="form-label">PM Time In</label><input type="time" className="form-control" value={formData.pm_time_in} onChange={(e) => setFormData({ ...formData, pm_time_in: e.target.value })} /></div>
        <div className="col-6 mb-3"><label className="form-label">PM Time Out</label><input type="time" className="form-control" value={formData.pm_time_out} onChange={(e) => setFormData({ ...formData, pm_time_out: e.target.value })} /></div>
      </div>
    </>
  );
}

function ModalWrapper({ title, onClose, onSave, saveLabel, children }) {
  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header"><h5 className="modal-title">{title}</h5><button type="button" className="btn-close" onClick={onClose} /></div>
          <div className="modal-body">{children}</div>
          <div className="modal-footer"><button type="button" className="btn btn-danger" onClick={onClose}>Cancel</button><button type="button" className="btn btn-primary" onClick={onSave}>{saveLabel}</button></div>
        </div>
      </div>
    </div>
  );
}

function AddAttendanceModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({ date: "", am_time_in: "", am_time_out: "", pm_time_in: "", pm_time_out: "" });
  const handleSubmit = () => {
    if (!formData.date) { Swal.fire({ icon: "warning", title: "Date Required", text: "Please select a date." }); return; }
    onSave({ date: formData.date, am_time_in: formData.am_time_in || null, am_time_out: formData.am_time_out || null, pm_time_in: formData.pm_time_in || null, pm_time_out: formData.pm_time_out || null });
  };
  return (
    <ModalWrapper title="Add Attendance" onClose={onClose} onSave={handleSubmit} saveLabel="Add Attendance">
      <div className="mb-3"><label className="form-label">Date</label><input type="date" className="form-control" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></div>
      <TimeFields formData={formData} setFormData={setFormData} />
    </ModalWrapper>
  );
}

function MarkHolidayModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({ date: "" });
  const handleSubmit = () => {
    if (!formData.date) { Swal.fire({ icon: "warning", title: "Date Required" }); return; }
    onSave({ date: formData.date });
  };
  return (
    <ModalWrapper title="Mark as Public Holiday" onClose={onClose} onSave={handleSubmit} saveLabel="Mark Holiday">
      <div className="alert alert-info py-2 mb-3" style={{ fontSize: "13px" }}>Public Holiday = <strong>full day paid (12 hrs)</strong>. No punch times required.</div>
      <div className="mb-3"><label className="form-label">Date</label><input type="date" className="form-control" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></div>
    </ModalWrapper>
  );
}

function MarkAbsentModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({ date: "" });
  const handleSubmit = () => {
    if (!formData.date) { Swal.fire({ icon: "warning", title: "Date Required" }); return; }
    onSave({ date: formData.date });
  };
  return (
    <ModalWrapper title="Mark as Absent" onClose={onClose} onSave={handleSubmit} saveLabel="Mark Absent">
      <div className="mb-3"><label className="form-label">Date</label><input type="date" className="form-control" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></div>
    </ModalWrapper>
  );
}

function UpdateAttendanceModal({ record, onClose, onSave }) {
  const formatTime = (t) => (t ? t.substring(0, 5) : "");
  const [formData, setFormData] = useState({ status: record.status || "Present", am_time_in: formatTime(record.am_time_in), am_time_out: formatTime(record.am_time_out), pm_time_in: formatTime(record.pm_time_in), pm_time_out: formatTime(record.pm_time_out) });
  const hideTimes = ["Absent", "On Leave", "Public Holiday", "Holiday"].includes(formData.status);
  const handleSubmit = () => {
    onSave({ status: formData.status, am_time_in: hideTimes ? null : (formData.am_time_in || null), am_time_out: hideTimes ? null : (formData.am_time_out || null), pm_time_in: hideTimes ? null : (formData.pm_time_in || null), pm_time_out: hideTimes ? null : (formData.pm_time_out || null) });
  };
  return (
    <ModalWrapper title="Update Attendance" onClose={onClose} onSave={handleSubmit} saveLabel="Update Attendance">
      <div className="mb-3"><label className="form-label">Date</label><input type="date" className="form-control" value={record.date ? record.date.split("T")[0] : ""} disabled /></div>
      <div className="mb-3">
        <label className="form-label">Status</label>
        <select className="form-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
          {["Present", "Late", "Absent", "On Leave", "Public Holiday", "Holiday"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {!hideTimes ? <TimeFields formData={formData} setFormData={setFormData} /> : <div className="alert alert-info py-2" style={{ fontSize: "13px" }}>No punch times needed for <strong>{formData.status}</strong>.</div>}
    </ModalWrapper>
  );
}