import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../utils/permissions";
import AddAttendanceModal from "../../components/modals/AddAttendanceModal";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const dateOnly = dateString.includes("T") ? dateString.split("T")[0] : dateString.split(" ")[0];
  return dateOnly;
};

const shiftBadge = (shiftType) => {
  if (!shiftType) return <span className="text-muted">—</span>;
  const isNight = shiftType.toLowerCase().includes("night");
  return (
    <span style={{ backgroundColor: isNight ? "#1e293b" : "#fef9c3", color: isNight ? "#f8fafc" : "#92400e", padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>
      {isNight ? "🌙 Night" : "☀️ Day"}
    </span>
  );
};

// ── Fetch functions ──────────────────────────────────────────────────────────
const fetchDepartments = () =>
  baseApi.get("/api/hrms/departments").then((r) => r.data?.data || r.data || []);

const fetchAttendanceData = async () => {
  const empRes    = await baseApi.get("/api/hrms/employees");
  const employees = empRes.data || [];

  const responses = await Promise.all(
    employees.map((emp) => baseApi.get(`/api/hrms/attendance/${emp.biometric_id}`))
  );

  return responses.flatMap((res, index) => {
    const emp = employees[index];
    return (res.data || []).map((rec) => ({
      biometric_id:    emp.biometric_id,
      employee_number: emp.employee_number,
      fullname:        emp.fullname,
      department:      emp.department,
      date:            rec.date,
      shift_type:      rec.shift_type,
      am_in:           rec.am_time_in,
      am_out:          rec.am_time_out,
      pm_in:           rec.pm_time_in,
      pm_out:          rec.pm_time_out,
      total_hours:     rec.total_hours ?? 0,
      status:          rec.status,
    }));
  });
};

export default function Attendance() {
  const { permissions }  = useAuth();
  const queryClient      = useQueryClient();
  const [search,         setSearch]         = useState("");
  const [department,     setDepartment]     = useState("All");
  const [date,           setDate]           = useState("");
  const [showAddModal,   setShowAddModal]   = useState(false);

  // ── Departments — cached 30 min, very rarely change ─────────────────────
  const { data: departments = [] } = useQuery({
    queryKey:  ["hrms_departments"],
    queryFn:   fetchDepartments,
    staleTime: 30 * 60 * 1000,
  });

  // ── Attendance — cached 2 min (heavy N+1 fetch, don't re-run often) ─────
  const { data: attendance = [], isLoading } = useQuery({
    queryKey:  ["hrms_attendance_all"],
    queryFn:   fetchAttendanceData,
    staleTime: 2 * 60 * 1000,
  });

  // ── Filter ────────────────────────────────────────────────────────────────
  const filteredAttendance = attendance.filter((row) => {
    const matchSearch = row.fullname?.toLowerCase().includes(search.toLowerCase()) ||
                        row.employee_number?.toLowerCase().includes(search.toLowerCase());
    const matchDept = department === "All" || row.department === department;
    const matchDate = !date || formatDate(row.date) === date;
    return matchSearch && matchDept && matchDate;
  });

  // ── Export CSV ────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (filteredAttendance.length === 0) { Swal.fire("No data", "Nothing to export.", "info"); return; }
    const headers = ["Employee No", "Name", "Department", "Date", "Shift", "AM In", "AM Out", "PM In", "PM Out", "Hours", "Status"];
    const rows    = filteredAttendance.map((row) => [
      row.employee_number, row.fullname, row.department, formatDate(row.date),
      row.shift_type || "", row.am_in || "", row.am_out || "", row.pm_in || "", row.pm_out || "",
      row.total_hours ?? 0, row.status,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map((e) => e.map((v) => `"${v}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href     = encodeURI(csvContent);
    link.download = `attendance_${date || formatDate(new Date().toISOString())}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Mark Absent ───────────────────────────────────────────────────────────
  const handleMarkAbsent = async (row) => {
    const result = await Swal.fire({
      title: "Mark as Absent?", text: `Mark ${row.fullname} as absent for ${formatDate(row.date)}?`,
      icon: "warning", showCancelButton: true, confirmButtonText: "Yes, mark absent",
      confirmButtonColor: "#0d6efd", cancelButtonColor: "#dc3545", reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await baseApi.post(`/api/hrms/attendance/mark-absent/${row.biometric_id}`, { date: row.date });
      // Invalidate attendance cache so it refetches fresh data
      queryClient.invalidateQueries({ queryKey: ["hrms_attendance_all"] });
      Swal.fire("Done", "Employee marked absent.", "success");
    } catch {
      Swal.fire("Error", "Unable to mark absent.", "error");
    }
  };

  const statusBadge = (status) => {
    const map = {
      Present:          { cls: "bg-success" },
      Late:             { cls: "bg-warning text-dark" },
      Absent:           { cls: "bg-danger" },
      "On Leave":       { cls: "bg-primary" },
      Holiday:          { cls: "bg-secondary" },
      "Public Holiday": { cls: "", style: { backgroundColor: "#9d174d", color: "#fff" } },
    };
    const s = map[status] ?? { cls: "bg-secondary" };
    return <span className={`badge ${s.cls}`} style={s.style || {}}>{status}</span>;
  };

  return (
    <Layout>
      <div className="container-fluid px-2 px-md-4 py-3">
        <h2 className="fw-bold mb-3">Attendance</h2>

        {/* Filter Bar */}
        <div className="card shadow-sm mb-3">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-12 col-sm-6 col-lg-3">
                <label className="form-label fw-semibold">Choose Date</label>
                <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="col-12 col-sm-6 col-lg-3">
                <label className="form-label fw-semibold">Department</label>
                <select className="form-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="All">All</option>
                  {departments.map((dept) => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
                </select>
              </div>
              <div className="col-12 col-lg-3">
                <label className="form-label fw-semibold">Search</label>
                <input type="text" className="form-control" placeholder="Search employee..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="col-12 col-lg-3">
                <div className="row g-2">
                  <div className={can(permissions, "attendance.manage") ? "col-6" : "col-12"}>
                    <button className="btn btn-success w-100" onClick={handleExport}>Export</button>
                  </div>
                  {can(permissions, "attendance.manage") && (
                    <div className="col-6">
                      <button className="btn btn-primary w-100" onClick={() => setShowAddModal(true)}>Add Attendance</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-center">
                <tr>
                  <th rowSpan="2">Employee No</th>
                  <th rowSpan="2" className="text-start">Name</th>
                  <th rowSpan="2">Department</th>
                  <th rowSpan="2">Shift</th>
                  <th colSpan="2">Morning</th>
                  <th colSpan="2">Afternoon</th>
                  <th rowSpan="2">Hours</th>
                  <th rowSpan="2">Status</th>
                  {can(permissions, "attendance.manage") && <th rowSpan="2">Action</th>}
                </tr>
                <tr>
                  <th>In</th><th>Out</th><th>In</th><th>Out</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="11" className="py-4 text-center">Loading attendance...</td></tr>
                ) : filteredAttendance.length === 0 ? (
                  <tr><td colSpan="11" className="py-4 text-center text-muted">No attendance records found</td></tr>
                ) : (
                  filteredAttendance.map((row, index) => (
                    <tr key={index} className="text-center">
                      <td>{row.employee_number}</td>
                      <td className="text-start">{row.fullname}</td>
                      <td>{row.department}</td>
                      <td>{shiftBadge(row.shift_type)}</td>
                      <td>{row.am_in  || "--:--"}</td>
                      <td>{row.am_out || "--:--"}</td>
                      <td>{row.pm_in  || "--:--"}</td>
                      <td>{row.pm_out || "--:--"}</td>
                      <td>
                        <span className="fw-bold text-success">
                          {["Present", "Late", "Public Holiday"].includes(row.status) ? "12.00" : "0.00"}
                        </span>
                      </td>
                      <td>{statusBadge(row.status)}</td>
                      {can(permissions, "attendance.manage") && (
                        <td>
                          <button className="btn btn-sm btn-danger px-3" disabled={row.status === "Absent"} onClick={() => handleMarkAbsent(row)}>
                            Mark Absent
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="card-footer text-muted">Showing {filteredAttendance.length} entries</div>
        </div>
      </div>

      <AddAttendanceModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["hrms_attendance_all"] })}
      />
    </Layout>
  );
}