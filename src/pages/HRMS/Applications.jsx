import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../utils/permissions";
import SearchableSelect from "../../components/SearchableSelect";

function LeaveTypeSelect({ value, onChange, leaveTypes }) {
  const options = leaveTypes.length > 0
    ? leaveTypes.map((lt) => ({ value: lt.leave_type, label: lt.leave_type }))
    : [
        { value: "Annual Leave",  label: "Annual Leave" },
        { value: "R&R",           label: "R&R (Rest & Recreation)" },
        { value: "Sick Leave",    label: "Sick Leave" },
        { value: "Special Leave", label: "Special Leave" },
      ];
  return <SearchableSelect options={options} value={value} onChange={onChange} placeholder="Search leave type..." />;
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
  return <SearchableSelect options={options} value={value} onChange={onChange} placeholder="Search overtime type..." />;
}

const fetchLeaveTypes    = () => baseApi.get("/api/hrms/leave-types").then((r)    => r.data || []);
const fetchOvertimeTypes = () => baseApi.get("/api/hrms/overtime-types").then((r) => r.data || []);

export default function Applications() {
  const { user, permissions } = useAuth();
  const queryClient           = useQueryClient();
  const biometricId           = user?.biometric_id;

  // ── Role flags ────────────────────────────────────────────────────────────
  const isEmployee   = user?.role === "employee";
  const isDeptHead   = user?.role === "dept_head";
  const isPrivileged = ["system_admin", "hr"].includes(user?.role); // auto-post on create
  const canApprove   = can(permissions, "leave.approve") || can(permissions, "leave.manage") ||
                       can(permissions, "ot.approve")    || can(permissions, "ot.manage");

  const [showNewApplicationModal,  setShowNewApplicationModal]  = useState(false);
  const [showBulkApplicationModal, setShowBulkApplicationModal] = useState(false);
  const [statusFilter,             setStatusFilter]             = useState("All");
  const [typeFilter,               setTypeFilter]               = useState("All");
  const [searchTerm,               setSearchTerm]               = useState("");

  const { data: leaveTypes    = [] } = useQuery({ queryKey: ["hrms_leave_types"],    queryFn: fetchLeaveTypes,    staleTime: 30 * 60 * 1000 });
  const { data: overtimeTypes = [] } = useQuery({ queryKey: ["hrms_overtime_types"], queryFn: fetchOvertimeTypes, staleTime: 30 * 60 * 1000 });

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["hrms_applications", biometricId, isEmployee],
    queryFn:  () => isEmployee && biometricId
      ? baseApi.get(`/api/hrms/applications/${biometricId}`).then((r) => r.data || [])
      : baseApi.get("/api/hrms/applications").then((r) => r.data || []),
    staleTime: 30 * 1000,
    enabled: isEmployee ? !!biometricId : true,
  });

  const refetchApplications = () =>
    queryClient.invalidateQueries({ queryKey: ["hrms_applications"] });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleNewApplication = async (formData) => {
    if (!biometricId) { Swal.fire({ icon: "error", title: "Employee not found", confirmButtonColor: "#d33" }); return; }
    try {
      await baseApi.post(`/api/hrms/applications/${biometricId}`, formData);
      setShowNewApplicationModal(false);
      Swal.fire({ icon: "success", title: "Success!", text: "Application submitted successfully!", confirmButtonColor: "#28a745" });
      refetchApplications();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed", text: err.response?.data?.message || "Failed to submit application.", confirmButtonColor: "#d33" });
    }
  };

  const handleEmployeeBulkApplication = async (apps) => {
    if (!biometricId) { Swal.fire({ icon: "error", title: "Employee not found", confirmButtonColor: "#d33" }); return; }
    try {
      Swal.fire({ title: "Submitting Applications...", text: `Submitting ${apps.length} application(s)`, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const results    = await Promise.allSettled(apps.map((app) => baseApi.post(`/api/hrms/applications/${biometricId}`, app)));
      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed     = results.filter((r) => r.status === "rejected").length;
      setShowBulkApplicationModal(false);
      failed === 0
        ? Swal.fire({ icon: "success", title: "Success!", text: `All ${successful} application(s) submitted!`, confirmButtonColor: "#28a745" })
        : Swal.fire({ icon: "warning", title: "Partially Successful", html: `<p>${successful} submitted</p><p>${failed} failed</p>`, confirmButtonColor: "#f59e0b" });
      refetchApplications();
    } catch { Swal.fire({ icon: "error", title: "Failed", confirmButtonColor: "#d33" }); }
  };

  // Dept head bulk — receives bulkData in AdminBulkApplicationModal format
  // backend will NOT auto-post since dept_head role is not privileged
  const handleDeptHeadBulkApplication = async (bulkData) => {
    try {
      Swal.fire({ title: "Submitting Applications...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const allPromises = [];
      bulkData.forEach((ed) =>
        ed.applications.forEach((app) =>
          allPromises.push(baseApi.post(`/api/hrms/applications/${ed.biometric_id}`, {
            ...app,
            status: "Draft",
          }))
        )
      );
      const results    = await Promise.allSettled(allPromises);
      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed     = results.filter((r) => r.status === "rejected").length;
      setShowBulkApplicationModal(false);
      failed === 0
        ? Swal.fire({ icon: "success", title: "Success!", text: `All ${successful} application(s) submitted for approval!`, confirmButtonColor: "#28a745" })
        : Swal.fire({ icon: "warning", title: "Partially Successful", html: `<p>${successful} submitted</p><p>${failed} failed</p>`, confirmButtonColor: "#f59e0b" });
      refetchApplications();
    } catch { Swal.fire({ icon: "error", title: "Failed", confirmButtonColor: "#d33" }); }
  };

  const handleAdminBulkApplication = async (bulkData) => {
    try {
      Swal.fire({ title: "Submitting Bulk Applications...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const allPromises = [];
      bulkData.forEach((ed) =>
        ed.applications.forEach((app) =>
          allPromises.push(baseApi.post(`/api/hrms/applications/${ed.biometric_id}`, app))
        )
      );
      const results    = await Promise.allSettled(allPromises);
      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed     = results.filter((r) => r.status === "rejected").length;
      setShowBulkApplicationModal(false);
      failed === 0
        ? Swal.fire({ icon: "success", title: "Success!", text: `All ${successful} posted successfully!`, confirmButtonColor: "#28a745" })
        : Swal.fire({ icon: "warning", title: "Partially Successful", html: `<p>${successful} posted</p><p>${failed} failed</p>`, confirmButtonColor: "#f59e0b" });
      refetchApplications();
    } catch { Swal.fire({ icon: "error", title: "Failed", confirmButtonColor: "#d33" }); }
  };

  const handleStatusUpdate = async (app, newStatus, extraPayload = {}) => {
    try {
      await baseApi.put(`/api/hrms/applications/${app.id}`, { status: newStatus, ...extraPayload });
      refetchApplications();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed", text: err.response?.data?.message || "Action failed.", confirmButtonColor: "#d33" });
    }
  };

  const handleReject = async (app) => {
    const { value: reason } = await Swal.fire({
      title: "Reject Application?",
      html: `<div class="text-start mb-3"><p><strong>Employee:</strong> ${app.employee_name || app.biometric_id}</p><p><strong>Type:</strong> ${app.application_type}</p></div>`,
      input: "textarea", inputLabel: "Reason for rejection (optional)", inputPlaceholder: "Enter reason...",
      icon: "warning", showCancelButton: true, confirmButtonText: "Yes, reject",
      confirmButtonColor: "#dc3545", cancelButtonColor: "#6c757d",
    });
    if (reason === undefined) return;
    await handleStatusUpdate(app, "Rejected", { rejection_reason: reason || null });
    Swal.fire({ icon: "success", title: "Rejected", confirmButtonColor: "#28a745" });
  };

  const handleDelete = async (app) => {
    const result = await Swal.fire({
      title: "Delete Application?",
      html: `<div class="text-start"><p><strong>${app.employee_name || app.biometric_id}</strong></p><p>${app.application_type}</p><p class="text-danger mt-3"><strong>⚠️ Cannot be undone!</strong></p></div>`,
      icon: "warning", showCancelButton: true, confirmButtonText: "Yes, delete it",
      confirmButtonColor: "#dc3545", cancelButtonColor: "#6c757d",
    });
    if (!result.isConfirmed) return;
    try {
      await baseApi.delete(`/api/hrms/applications/${app.id}`);
      Swal.fire({ icon: "success", title: "Deleted!", confirmButtonColor: "#28a745" });
      refetchApplications();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed", text: err.response?.data?.message || "Failed to delete.", confirmButtonColor: "#d33" });
    }
  };

  const handleSubmit = async (app) => {
    const result = await Swal.fire({ title: "Submit Application?", icon: "question", showCancelButton: true, confirmButtonText: "Yes, submit", confirmButtonColor: "#2563eb", cancelButtonColor: "#6c757d" });
    if (!result.isConfirmed) return;
    await handleStatusUpdate(app, "Pending Head");
    Swal.fire({ icon: "success", title: "Submitted!", confirmButtonColor: "#28a745" });
  };

  const handleHeadApprove = async (app) => {
    const result = await Swal.fire({ title: "Approve Application?", icon: "question", showCancelButton: true, confirmButtonText: "Yes, approve", confirmButtonColor: "#28a745", cancelButtonColor: "#6c757d" });
    if (!result.isConfirmed) return;
    await handleStatusUpdate(app, "Pending HR");
    Swal.fire({ icon: "success", title: "Approved! Forwarded to HR.", confirmButtonColor: "#28a745" });
  };

  const handleHRApprove = async (app) => {
    const result = await Swal.fire({ title: "Approve Application?", icon: "question", showCancelButton: true, confirmButtonText: "Yes, approve", confirmButtonColor: "#28a745", cancelButtonColor: "#6c757d" });
    if (!result.isConfirmed) return;
    await handleStatusUpdate(app, "Approved by HR");
    Swal.fire({ icon: "success", title: "Approved!", confirmButtonColor: "#28a745" });
  };

  const handlePost = async (app) => {
    const result = await Swal.fire({ title: "Post to Payroll/Attendance?", icon: "info", showCancelButton: true, confirmButtonText: "Yes, post it", confirmButtonColor: "#10b981", cancelButtonColor: "#6c757d" });
    if (!result.isConfirmed) return;
    await handleStatusUpdate(app, "Posted");
    Swal.fire({ icon: "success", title: "Posted!", confirmButtonColor: "#28a745" });
  };

  // ── Permission helpers ────────────────────────────────────────────────────

  const canSubmit = (app) => {
    // Only employee or dept_head can submit their own Draft apps
    if (!isEmployee && !isDeptHead) return false;
    if (app.status !== "Draft") return false;
    // Apps created by hr/system_admin are auto-Posted — no Submit needed
    const createdByRole = app.created_by_role ?? "employee";
    if (createdByRole === "hr" || createdByRole === "system_admin") return false;
    return true;
  };

  const canDelete = (app) => {
    const isDraft      = app.status === "Draft";
    const isPendingHead = app.status === "Pending Head";
    const isPendingHR  = app.status === "Pending HR";

    // ✅ system_admin — can delete anything at any status
    if (user?.role === "system_admin") return true;

    // ✅ hr — can delete Draft, Pending Head, or Pending HR
    if (user?.role === "hr") return isDraft || isPendingHead || isPendingHR;

    // ✅ employee — can only delete their OWN Draft apps
    // Once submitted (Pending Head or beyond), they lose the ability to delete
    if (isEmployee) {
      const isOwn = app.biometric_id === biometricId || app.employee_biometric_id === biometricId;
      return isOwn && isDraft;
    }

    // ✅ dept_head — can only delete their OWN Draft apps (same as employee)
    if (isDeptHead) {
      const isOwn = app.biometric_id === biometricId || app.employee_biometric_id === biometricId;
      return isOwn && isDraft;
    }

    return false;
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    const dateOnly = date.includes("T") ? date.split("T")[0] : date.split(" ")[0];
    const [year, month, day] = dateOnly.split("-");
    return `${year}-${month}-${day}`;
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
    return <span style={{ backgroundColor: s.bg, color: "#fff", padding: "3px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "600", whiteSpace: "nowrap" }}>{s.text}</span>;
  };

  const filteredApplications = applications.filter((app) => {
    const matchStatus = statusFilter === "All" || app.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchType   = typeFilter   === "All" || app.application_type === typeFilter;
    const matchSearch = !searchTerm  ||
      app.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.biometric_id?.toLowerCase().includes(searchTerm.toLowerCase())  ||
      app.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchType && matchSearch;
  });

  const pageTitle = isEmployee || isDeptHead ? "My Applications" : "Applications Management";

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4 py-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
          <h2 className="fw-bold">{pageTitle}</h2>
          <div className="d-flex gap-2 flex-wrap">
            {/* Employee — New + Bulk (own apps, multiple dates) */}
            {isEmployee && (
              <>
                <button className="btn btn-primary" onClick={() => setShowNewApplicationModal(true)} style={{ fontSize: "14px", padding: "10px 24px", borderRadius: "6px", fontWeight: "500" }}>New Application</button>
                <button className="btn btn-outline-primary" onClick={() => setShowBulkApplicationModal(true)} style={{ fontSize: "14px", padding: "10px 24px", borderRadius: "6px", fontWeight: "500" }}>Bulk Application</button>
              </>
            )}
            {/* Dept Head — New + Bulk (own apps, multiple dates, goes through approval flow) */}
            {isDeptHead && (
              <>
                <button className="btn btn-primary" onClick={() => setShowNewApplicationModal(true)} style={{ fontSize: "14px", padding: "10px 24px", borderRadius: "6px", fontWeight: "500" }}>New Application</button>
                <button className="btn btn-outline-primary" onClick={() => setShowBulkApplicationModal(true)} style={{ fontSize: "14px", padding: "10px 24px", borderRadius: "6px", fontWeight: "500" }}>Bulk Application</button>
              </>
            )}
            {/* HR / Admin — Bulk for multiple employees (auto-posted) */}
            {isPrivileged && (
              <button className="btn btn-primary" onClick={() => setShowBulkApplicationModal(true)} style={{ fontSize: "14px", padding: "10px 24px", borderRadius: "6px", fontWeight: "500" }}>
                Bulk Application (Multiple Employees)
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="card shadow-sm mb-4" style={{ borderRadius: "12px" }}>
          <div className="card-body">
            <div className="row g-3">
              {!isEmployee && !isDeptHead && (
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Search Employee:</label>
                  <input type="text" className="form-control" placeholder="Search by name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              )}
              <div className={(isEmployee || isDeptHead) ? "col-md-6" : "col-md-4"}>
                <label className="form-label fw-semibold">Status:</label>
                <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="All">All</option>
                  {["Draft","Pending Head","Approved by Head","Pending HR","Approved by HR","Posted","Rejected","Cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className={(isEmployee || isDeptHead) ? "col-md-6" : "col-md-4"}>
                <label className="form-label fw-semibold">Type:</label>
                <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="All">All</option>
                  <option value="Leave">Leave</option>
                  <option value="Overtime">Overtime</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
          <div className="card-body">
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" /><p className="mt-3 text-muted">Loading applications...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead style={{ backgroundColor: "#f8f9fa" }}>
                    <tr>
                      {!isEmployee && !isDeptHead && <th style={{ fontSize: "14px", padding: "12px" }}>Employee</th>}
                      <th className="text-nowrap" style={{ fontSize: "14px", padding: "12px" }}>Type</th>
                      <th style={{ fontSize: "14px", padding: "12px" }}>Leave/OT Type</th>
                      <th className="text-nowrap" style={{ fontSize: "14px", padding: "12px" }}>Date From</th>
                      <th className="text-nowrap" style={{ fontSize: "14px", padding: "12px" }}>Date To</th>
                      <th className="text-nowrap" style={{ fontSize: "14px", padding: "12px" }}>Duration</th>
                      <th className="d-none d-md-table-cell" style={{ fontSize: "14px", padding: "12px" }}>Purpose</th>
                      <th className="text-nowrap" style={{ fontSize: "14px", padding: "12px" }}>Status</th>
                      <th className="text-nowrap text-center" style={{ fontSize: "14px", padding: "12px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.length > 0 ? (
                      filteredApplications.map((app) => (
                        <tr key={app.id}>
                          {!isEmployee && !isDeptHead && (
                            <td style={{ fontSize: "13px", padding: "12px" }}>
                              <strong>{app.employee_name || "N/A"}</strong><br />
                              <small className="text-muted">{app.employee_biometric_id || app.biometric_id}</small>
                            </td>
                          )}
                          <td className="text-nowrap" style={{ fontSize: "13px", padding: "12px" }}>
                            <span style={{ backgroundColor: app.application_type === "Leave" ? "#2563eb" : "#7c3aed", color: "#fff", fontSize: "11px", fontWeight: "600", padding: "3px 8px", borderRadius: "999px" }}>
                              {app.application_type}
                            </span>
                          </td>
                          <td style={{ fontSize: "13px", padding: "12px" }}>
                            {app.application_type === "Leave"
                              ? <>{app.leave_type || "N/A"}{app.leave_duration === "Half Day" && <div><small className="text-muted">({app.half_day_period} - Half Day)</small></div>}</>
                              : (app.overtime_type || "N/A")}
                          </td>
                          <td className="text-nowrap" style={{ fontSize: "13px", padding: "12px" }}>{formatDate(app.date_from)}</td>
                          <td className="text-nowrap" style={{ fontSize: "13px", padding: "12px" }}>{formatDate(app.date_to)}</td>
                          <td className="text-nowrap" style={{ fontSize: "13px", padding: "12px" }}>{app.time_from && app.time_to ? `${app.time_from} - ${app.time_to}` : "—"}</td>
                          <td className="d-none d-md-table-cell" style={{ fontSize: "13px", padding: "12px" }}>
                            <span className="text-truncate d-inline-block" style={{ maxWidth: "200px" }} title={app.purpose}>{app.purpose || "N/A"}</span>
                          </td>
                          <td className="text-nowrap" style={{ fontSize: "13px", padding: "12px" }}>{getStatusBadge(app.status)}</td>
                          <td style={{ fontSize: "13px", padding: "12px" }}>
                            <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center flex-wrap">

                              {/* Submit — employee/dept_head own Draft only, not hr/admin-created */}
                              {canSubmit(app) && (
                                <button className="btn btn-sm" onClick={() => handleSubmit(app)} style={{ backgroundColor: "#2563eb", color: "#fff", fontSize: "12px", padding: "4px 10px", borderRadius: "6px", border: "none" }}>Submit</button>
                              )}

                              {/* Dept head approves Pending Head */}
                              {isDeptHead && app.status === "Pending Head" && (
                                <>
                                  <button className="btn btn-sm" onClick={() => handleHeadApprove(app)} style={{ backgroundColor: "#16a34a", color: "#fff", fontSize: "12px", padding: "4px 10px", borderRadius: "6px", border: "none" }}>Approve</button>
                                  <button className="btn btn-sm" onClick={() => handleReject(app)}      style={{ backgroundColor: "#dc2626", color: "#fff", fontSize: "12px", padding: "4px 10px", borderRadius: "6px", border: "none" }}>Reject</button>
                                </>
                              )}

                              {/* Non-employee approvers (hr/admin acting as head) for Pending Head */}
                              {canApprove && !isEmployee && !isDeptHead && app.status === "Pending Head" && (
                                <>
                                  <button className="btn btn-sm" onClick={() => handleHeadApprove(app)} style={{ backgroundColor: "#16a34a", color: "#fff", fontSize: "12px", padding: "4px 10px", borderRadius: "6px", border: "none" }}>Approve</button>
                                  <button className="btn btn-sm" onClick={() => handleReject(app)}      style={{ backgroundColor: "#dc2626", color: "#fff", fontSize: "12px", padding: "4px 10px", borderRadius: "6px", border: "none" }}>Reject</button>
                                </>
                              )}

                              {/* HR / Admin approve Pending HR */}
                              {(user?.role === "hr" || user?.role === "system_admin") && app.status === "Pending HR" && (
                                <>
                                  <button className="btn btn-sm" onClick={() => handleHRApprove(app)} style={{ backgroundColor: "#16a34a", color: "#fff", fontSize: "12px", padding: "4px 10px", borderRadius: "6px", border: "none" }}>Approve</button>
                                  <button className="btn btn-sm" onClick={() => handleReject(app)}    style={{ backgroundColor: "#dc2626", color: "#fff", fontSize: "12px", padding: "4px 10px", borderRadius: "6px", border: "none" }}>Reject</button>
                                </>
                              )}

                              {/* HR / Admin post Approved by HR */}
                              {(user?.role === "hr" || user?.role === "system_admin") && app.status === "Approved by HR" && (
                                <button className="btn btn-sm" onClick={() => handlePost(app)} style={{ backgroundColor: "#10b981", color: "#fff", fontSize: "12px", padding: "4px 10px", borderRadius: "6px", border: "none" }}>Post</button>
                              )}

                              {/* Delete — rules enforced by canDelete() */}
                              {canDelete(app) && (
                                <button className="btn btn-sm" onClick={() => handleDelete(app)} style={{ backgroundColor: "#6b7280", color: "#fff", fontSize: "12px", padding: "4px 10px", borderRadius: "6px", border: "none" }}>Delete</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={(isEmployee || isDeptHead) ? 8 : 9} className="text-center py-5">
                          <div className="text-muted">
                            <p className="mb-2">📋 No applications found</p>
                            {(isEmployee || isDeptHead) && <button className="btn btn-sm btn-primary" onClick={() => setShowNewApplicationModal(true)}>Create New Application</button>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {!isLoading && filteredApplications.length > 0 && (
              <div className="mt-3 text-muted" style={{ fontSize: "13px" }}>
                Showing {filteredApplications.length} of {applications.length} application(s)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}

      {/* New Application — employee and dept_head */}
      {showNewApplicationModal && (isEmployee || isDeptHead) && (
        <NewApplicationModal
          leaveTypes={leaveTypes} overtimeTypes={overtimeTypes}
          onClose={() => setShowNewApplicationModal(false)}
          onSave={handleNewApplication}
        />
      )}

      {/* Bulk — employee: multiple dates for themselves */}
      {showBulkApplicationModal && isEmployee && (
        <EmployeeBulkApplicationModal
          leaveTypes={leaveTypes} overtimeTypes={overtimeTypes}
          onClose={() => setShowBulkApplicationModal(false)}
          onSave={handleEmployeeBulkApplication}
        />
      )}

      {/* Bulk — dept_head: multiple dates for themselves, goes through approval */}
      {showBulkApplicationModal && isDeptHead && (
        <AdminBulkApplicationModal
          leaveTypes={leaveTypes} overtimeTypes={overtimeTypes}
          onClose={() => setShowBulkApplicationModal(false)}
          onSave={handleDeptHeadBulkApplication}
          submitLabel="Submit for"
        />
      )}

      {/* Bulk — hr/admin: multiple employees, auto-posted */}
      {showBulkApplicationModal && isPrivileged && (
        <AdminBulkApplicationModal
          leaveTypes={leaveTypes} overtimeTypes={overtimeTypes}
          onClose={() => setShowBulkApplicationModal(false)}
          onSave={handleAdminBulkApplication}
          submitLabel="Post for"
        />
      )}
    </Layout>
  );
}

// ── NewApplicationModal ───────────────────────────────────────────────────────
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
        payload.time_to = formData.leave_end_time; payload.half_day_period = formData.half_day_period;
      } else {
        payload.time_from = null; payload.time_to = null; payload.half_day_period = null;
      }
    }
    delete payload.overtime_date; delete payload.ot_in; delete payload.ot_out;
    delete payload.leave_start_time; delete payload.leave_end_time;
    onSave(payload);
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content" style={{ borderRadius: "12px" }}>
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">New Application</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body px-4">
              <div className="mb-3">
                <label className="form-label fw-semibold">Application Type:</label>
                <select className="form-select" value={formData.application_type} onChange={(e) => setFormData({ ...formData, application_type: e.target.value })} required>
                  <option value="">Select Type</option>
                  <option value="Leave">Leave</option>
                  <option value="Overtime">Overtime</option>
                </select>
              </div>
              {isOvertime && (
                <>
                  <div className="row mb-3">
                    <div className="col-12 col-md-6"><label className="form-label fw-semibold">Overtime Type:</label><OTTypeSelect value={formData.overtime_type} onChange={(v) => setFormData({ ...formData, overtime_type: v })} overtimeTypes={overtimeTypes} /></div>
                    <div className="col-12 col-md-6"><label className="form-label fw-semibold">Overtime Date:</label><input type="date" className="form-control" value={formData.overtime_date} onChange={(e) => setFormData({ ...formData, overtime_date: e.target.value })} required /></div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-12 col-md-6"><label className="form-label fw-semibold">OT Start Time:</label><input type="time" className="form-control" value={formData.ot_in} onChange={(e) => setFormData({ ...formData, ot_in: e.target.value })} required /></div>
                    <div className="col-12 col-md-6"><label className="form-label fw-semibold">OT End Time:</label><input type="time" className="form-control" value={formData.ot_out} onChange={(e) => setFormData({ ...formData, ot_out: e.target.value })} required /></div>
                  </div>
                </>
              )}
              {isLeave && (
                <>
                  <div className="row mb-3">
                    <div className="col-12 col-md-6"><label className="form-label fw-semibold">Leave Type:</label><LeaveTypeSelect value={formData.leave_type} onChange={(v) => setFormData({ ...formData, leave_type: v })} leaveTypes={leaveTypes} /></div>
                    <div className="col-12 col-md-6"><label className="form-label fw-semibold">Leave Duration:</label><select className="form-select" value={formData.leave_duration} onChange={(e) => setFormData({ ...formData, leave_duration: e.target.value })} required><option value="Full Day">Full Day</option><option value="Half Day">Half Day</option></select></div>
                  </div>
                  {formData.leave_duration === "Half Day" && (
                    <>
                      <div className="mb-3"><label className="form-label fw-semibold">Half Day Period:</label><select className="form-select" value={formData.half_day_period} onChange={(e) => setFormData({ ...formData, half_day_period: e.target.value })} required><option value="AM">Morning (AM)</option><option value="PM">Afternoon (PM)</option></select></div>
                      <div className="row mb-3">
                        <div className="col-12 col-md-6"><label className="form-label fw-semibold">Start Time:</label><input type="time" className="form-control" value={formData.leave_start_time} onChange={(e) => setFormData({ ...formData, leave_start_time: e.target.value })} required /></div>
                        <div className="col-12 col-md-6"><label className="form-label fw-semibold">End Time:</label><input type="time" className="form-control" value={formData.leave_end_time} onChange={(e) => setFormData({ ...formData, leave_end_time: e.target.value })} required /></div>
                      </div>
                    </>
                  )}
                  <div className="row mb-3">
                    <div className="col-12 col-md-6"><label className="form-label fw-semibold">{formData.leave_duration === "Half Day" ? "Leave Date:" : "Date From:"}</label><input type="date" className="form-control" value={formData.date_from} onChange={(e) => setFormData({ ...formData, date_from: e.target.value })} required /></div>
                    {formData.leave_duration === "Full Day" && <div className="col-12 col-md-6"><label className="form-label fw-semibold">Date To:</label><input type="date" className="form-control" value={formData.date_to} onChange={(e) => setFormData({ ...formData, date_to: e.target.value })} required /></div>}
                  </div>
                </>
              )}
              <div className="mb-3">
                <label className="form-label fw-semibold">Purpose / Reason:</label>
                <textarea className="form-control" rows="4" value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} placeholder="Explain the reason..." required />
              </div>
            </div>
            <div className="modal-footer border-0 pt-0">
              <button type="button" className="btn" onClick={onClose} style={{ backgroundColor: "#dc2626", color: "#fff", fontWeight: "600", padding: "8px 20px", borderRadius: "6px" }}>Cancel</button>
              <button type="submit" className="btn" style={{ backgroundColor: "#2563eb", color: "#fff", fontWeight: "600", padding: "8px 20px", borderRadius: "6px" }}>Submit Application</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── EmployeeBulkApplicationModal (used by employee — multiple dates for themselves) ──
function EmployeeBulkApplicationModal({ onClose, onSave, leaveTypes, overtimeTypes }) {
  const [applications, setApplications] = useState([]);
  const [commonData, setCommonData]     = useState({ application_type: "", leave_type: "", overtime_type: "Regular OT", purpose: "" });

  const addEntry    = () => setApplications([...applications, { id: Date.now(), date_from: "", date_to: "", time_from: "", time_to: "", leave_duration: "Full Day", half_day_period: "AM" }]);
  const removeEntry = (id) => setApplications(applications.filter((a) => a.id !== id));
  const updateEntry = (id, field, value) => setApplications(applications.map((a) => a.id === id ? { ...a, [field]: value } : a));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (applications.length === 0) { Swal.fire({ icon: "warning", title: "No Applications", confirmButtonColor: "#f59e0b" }); return; }
    const payload = applications.map((app) => {
      let final = { application_type: commonData.application_type, purpose: commonData.purpose, status: "Draft" };
      if (commonData.application_type === "Leave") {
        final.leave_type = commonData.leave_type; final.leave_duration = app.leave_duration; final.date_from = app.date_from;
        if (app.leave_duration === "Half Day") { final.date_to = app.date_from; final.time_from = app.time_from; final.time_to = app.time_to; final.half_day_period = app.half_day_period; }
        else { final.date_to = app.date_to; }
      }
      if (commonData.application_type === "Overtime") {
        final.overtime_type = commonData.overtime_type; final.date_from = app.date_from; final.date_to = app.date_from;
        final.time_from = app.time_from; final.time_to = app.time_to;
      }
      return final;
    });
    onSave(payload);
  };

  const isLeave    = commonData.application_type === "Leave";
  const isOvertime = commonData.application_type === "Overtime";

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered modal-xl" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "90vw" }}>
        <div className="modal-content" style={{ borderRadius: "12px" }}>
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">Bulk Application (Multiple Dates)</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body px-4" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              <div className="card mb-4" style={{ backgroundColor: "#f8f9fa" }}>
                <div className="card-body">
                  <h6 className="fw-bold mb-3">Common Information</h6>
                  <div className="row g-3">
                    <div className="col-md-6"><label className="form-label fw-semibold">Application Type:</label><select className="form-select" value={commonData.application_type} onChange={(e) => { setCommonData({ ...commonData, application_type: e.target.value }); setApplications([]); }} required><option value="">Select Type</option><option value="Leave">Leave</option><option value="Overtime">Overtime</option></select></div>
                    {isLeave    && <div className="col-md-6"><label className="form-label fw-semibold">Leave Type:</label><LeaveTypeSelect value={commonData.leave_type} onChange={(v) => setCommonData({ ...commonData, leave_type: v })} leaveTypes={leaveTypes} /></div>}
                    {isOvertime && <div className="col-md-6"><label className="form-label fw-semibold">Overtime Type:</label><OTTypeSelect value={commonData.overtime_type} onChange={(v) => setCommonData({ ...commonData, overtime_type: v })} overtimeTypes={overtimeTypes} /></div>}
                    <div className="col-12"><label className="form-label fw-semibold">Purpose:</label><textarea className="form-control" rows="3" value={commonData.purpose} onChange={(e) => setCommonData({ ...commonData, purpose: e.target.value })} required /></div>
                  </div>
                </div>
              </div>
              {commonData.application_type && (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0">Individual Dates ({applications.length})</h6>
                    <button type="button" className="btn btn-sm btn-primary" onClick={addEntry}>+ Add Date</button>
                  </div>
                  {applications.length === 0
                    ? <div className="alert alert-info">Click "Add Date" to add individual dates/times</div>
                    : <div className="row g-3">{applications.map((app, index) => (
                        <div key={app.id} className="col-12">
                          <div className="card"><div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-3"><h6 className="fw-semibold mb-0">Date #{index + 1}</h6><button type="button" className="btn btn-sm btn-danger" onClick={() => removeEntry(app.id)}>Remove</button></div>
                            <div className="row g-3">
                              {isLeave && (<>
                                <div className="col-md-3"><label className="form-label fw-semibold">Duration:</label><select className="form-select" value={app.leave_duration} onChange={(e) => updateEntry(app.id, "leave_duration", e.target.value)}><option value="Full Day">Full Day</option><option value="Half Day">Half Day</option></select></div>
                                {app.leave_duration === "Half Day" && <div className="col-md-3"><label className="form-label fw-semibold">Period:</label><select className="form-select" value={app.half_day_period} onChange={(e) => updateEntry(app.id, "half_day_period", e.target.value)}><option value="AM">AM</option><option value="PM">PM</option></select></div>}
                                <div className="col-md-3"><label className="form-label fw-semibold">{app.leave_duration === "Half Day" ? "Date:" : "Date From:"}</label><input type="date" className="form-control" value={app.date_from} onChange={(e) => updateEntry(app.id, "date_from", e.target.value)} required /></div>
                                {app.leave_duration === "Full Day" && <div className="col-md-3"><label className="form-label fw-semibold">Date To:</label><input type="date" className="form-control" value={app.date_to} onChange={(e) => updateEntry(app.id, "date_to", e.target.value)} required /></div>}
                                {app.leave_duration === "Half Day" && <><div className="col-md-3"><label className="form-label fw-semibold">Start Time:</label><input type="time" className="form-control" value={app.time_from} onChange={(e) => updateEntry(app.id, "time_from", e.target.value)} required /></div><div className="col-md-3"><label className="form-label fw-semibold">End Time:</label><input type="time" className="form-control" value={app.time_to} onChange={(e) => updateEntry(app.id, "time_to", e.target.value)} required /></div></>}
                              </>)}
                              {isOvertime && (<>
                                <div className="col-md-4"><label className="form-label fw-semibold">Date:</label><input type="date" className="form-control" value={app.date_from} onChange={(e) => updateEntry(app.id, "date_from", e.target.value)} required /></div>
                                <div className="col-md-4"><label className="form-label fw-semibold">Start Time:</label><input type="time" className="form-control" value={app.time_from} onChange={(e) => updateEntry(app.id, "time_from", e.target.value)} required /></div>
                                <div className="col-md-4"><label className="form-label fw-semibold">End Time:</label><input type="time" className="form-control" value={app.time_to} onChange={(e) => updateEntry(app.id, "time_to", e.target.value)} required /></div>
                              </>)}
                            </div>
                          </div></div>
                        </div>
                      ))}</div>
                  }
                </>
              )}
            </div>
            <div className="modal-footer border-0 pt-0">
              <button type="button" className="btn" onClick={onClose} style={{ backgroundColor: "#dc2626", color: "#fff", fontWeight: "600", padding: "8px 20px", borderRadius: "6px" }}>Cancel</button>
              <button type="submit" className="btn" disabled={applications.length === 0} style={{ backgroundColor: "#2563eb", color: "#fff", fontWeight: "600", padding: "8px 20px", borderRadius: "6px" }}>Submit {applications.length} Application(s)</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── AdminBulkApplicationModal (dept_head via submitLabel="Submit for", hr/admin via "Post for") ──
function AdminBulkApplicationModal({ onClose, onSave, leaveTypes, overtimeTypes, submitLabel = "Post for" }) {
  const [employees,  setEmployees]  = useState([]);
  const [commonData, setCommonData] = useState({ application_type: "", leave_type: "", overtime_type: "Regular OT", purpose: "", date_from: "", date_to: "", time_from: "", time_to: "", leave_duration: "Full Day", half_day_period: "AM" });

  const { data: employeeList = [], isLoading: loadingEmployees } = useQuery({
    queryKey:  ["hrms_all_employees"],
    queryFn: () => baseApi.get("/api/hrms/employees").then((r) => r.data?.data || r.data || []),
    staleTime: 5 * 60 * 1000,
  });

  const addEmployee    = (emp) => {
    if (employees.find((e) => e.biometric_id === emp.biometric_id)) { Swal.fire({ icon: "warning", title: "Already Added", confirmButtonColor: "#f59e0b" }); return; }
    setEmployees([...employees, emp]);
  };
  const removeEmployee = (id) => setEmployees(employees.filter((e) => e.biometric_id !== id));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (employees.length === 0) { Swal.fire({ icon: "warning", title: "No Employees Selected", confirmButtonColor: "#f59e0b" }); return; }
    const bulkData = employees.map((emp) => {
      let app = { application_type: commonData.application_type, purpose: commonData.purpose };
      if (commonData.application_type === "Leave") {
        app.leave_type = commonData.leave_type; app.leave_duration = commonData.leave_duration; app.date_from = commonData.date_from;
        if (commonData.leave_duration === "Half Day") { app.date_to = commonData.date_from; app.time_from = commonData.time_from; app.time_to = commonData.time_to; app.half_day_period = commonData.half_day_period; }
        else { app.date_to = commonData.date_to; }
      }
      if (commonData.application_type === "Overtime") {
        app.overtime_type = commonData.overtime_type; app.date_from = commonData.date_from; app.date_to = commonData.date_from;
        app.time_from = commonData.time_from; app.time_to = commonData.time_to;
      }
      return { biometric_id: emp.biometric_id, applications: [app] };
    });
    onSave(bulkData);
  };

  const isLeave    = commonData.application_type === "Leave";
  const isOvertime = commonData.application_type === "Overtime";

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered modal-xl" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "95vw" }}>
        <div className="modal-content" style={{ borderRadius: "12px" }}>
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">Bulk Application (Multiple Employees)</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body px-4" style={{ maxHeight: "75vh", overflowY: "auto" }}>
              <div className="row">
                <div className="col-md-4">
                  <div className="card mb-3" style={{ backgroundColor: "#f8f9fa" }}>
                    <div className="card-body">
                      <h6 className="fw-bold mb-3">Select Employees</h6>
                      {loadingEmployees ? (
                        <div className="text-center py-3"><div className="spinner-border spinner-border-sm text-primary" /></div>
                      ) : (
                        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                          {employeeList.map((emp) => (
                            <div key={emp.biometric_id} className="d-flex justify-content-between align-items-center p-2 mb-2 bg-white rounded" style={{ cursor: "pointer" }} onClick={() => addEmployee(emp)}>
                              <div><div className="fw-semibold" style={{ fontSize: "13px" }}>{emp.first_name} {emp.last_name}</div><small className="text-muted">{emp.biometric_id}</small></div>
                              <button type="button" className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); addEmployee(emp); }}>+</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="card" style={{ backgroundColor: "#e0f2fe" }}>
                    <div className="card-body">
                      <h6 className="fw-bold mb-3">Selected ({employees.length})</h6>
                      {employees.length === 0 ? <p className="text-muted small">No employees selected</p> : (
                        <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                          {employees.map((emp) => (
                            <div key={emp.biometric_id} className="d-flex justify-content-between align-items-center p-2 mb-2 bg-white rounded">
                              <div><div className="fw-semibold" style={{ fontSize: "13px" }}>{emp.first_name} {emp.last_name}</div><small className="text-muted">{emp.biometric_id}</small></div>
                              <button type="button" className="btn btn-sm btn-danger" onClick={() => removeEmployee(emp.biometric_id)}>×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-md-8">
                  <div className="card" style={{ backgroundColor: "#f8f9fa" }}>
                    <div className="card-body">
                      <h6 className="fw-bold mb-3">Application Details (applies to all selected employees)</h6>
                      <div className="row g-3">
                        <div className="col-md-6"><label className="form-label fw-semibold">Application Type:</label><select className="form-select" value={commonData.application_type} onChange={(e) => setCommonData({ ...commonData, application_type: e.target.value })} required><option value="">Select Type</option><option value="Leave">Leave</option><option value="Overtime">Overtime</option></select></div>
                        {isLeave && (<>
                          <div className="col-md-6"><label className="form-label fw-semibold">Leave Type:</label><LeaveTypeSelect value={commonData.leave_type} onChange={(v) => setCommonData({ ...commonData, leave_type: v })} leaveTypes={leaveTypes} /></div>
                          <div className="col-md-6"><label className="form-label fw-semibold">Leave Duration:</label><select className="form-select" value={commonData.leave_duration} onChange={(e) => setCommonData({ ...commonData, leave_duration: e.target.value })}><option value="Full Day">Full Day</option><option value="Half Day">Half Day</option></select></div>
                          {commonData.leave_duration === "Half Day" && <div className="col-md-6"><label className="form-label fw-semibold">Half Day Period:</label><select className="form-select" value={commonData.half_day_period} onChange={(e) => setCommonData({ ...commonData, half_day_period: e.target.value })}><option value="AM">Morning (AM)</option><option value="PM">Afternoon (PM)</option></select></div>}
                          <div className="col-md-6"><label className="form-label fw-semibold">{commonData.leave_duration === "Half Day" ? "Leave Date:" : "Date From:"}</label><input type="date" className="form-control" value={commonData.date_from} onChange={(e) => setCommonData({ ...commonData, date_from: e.target.value })} required /></div>
                          {commonData.leave_duration === "Full Day" && <div className="col-md-6"><label className="form-label fw-semibold">Date To:</label><input type="date" className="form-control" value={commonData.date_to} onChange={(e) => setCommonData({ ...commonData, date_to: e.target.value })} required /></div>}
                          {commonData.leave_duration === "Half Day" && <><div className="col-md-6"><label className="form-label fw-semibold">Start Time:</label><input type="time" className="form-control" value={commonData.time_from} onChange={(e) => setCommonData({ ...commonData, time_from: e.target.value })} required /></div><div className="col-md-6"><label className="form-label fw-semibold">End Time:</label><input type="time" className="form-control" value={commonData.time_to} onChange={(e) => setCommonData({ ...commonData, time_to: e.target.value })} required /></div></>}
                        </>)}
                        {isOvertime && (<>
                          <div className="col-md-6"><label className="form-label fw-semibold">Overtime Type:</label><OTTypeSelect value={commonData.overtime_type} onChange={(v) => setCommonData({ ...commonData, overtime_type: v })} overtimeTypes={overtimeTypes} /></div>
                          <div className="col-md-6"><label className="form-label fw-semibold">Date:</label><input type="date" className="form-control" value={commonData.date_from} onChange={(e) => setCommonData({ ...commonData, date_from: e.target.value })} required /></div>
                          <div className="col-md-6"><label className="form-label fw-semibold">Start Time:</label><input type="time" className="form-control" value={commonData.time_from} onChange={(e) => setCommonData({ ...commonData, time_from: e.target.value })} required /></div>
                          <div className="col-md-6"><label className="form-label fw-semibold">End Time:</label><input type="time" className="form-control" value={commonData.time_to} onChange={(e) => setCommonData({ ...commonData, time_to: e.target.value })} required /></div>
                        </>)}
                        <div className="col-12"><label className="form-label fw-semibold">Purpose:</label><textarea className="form-control" rows="3" value={commonData.purpose} onChange={(e) => setCommonData({ ...commonData, purpose: e.target.value })} required /></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 pt-0">
              <button type="button" className="btn" onClick={onClose} style={{ backgroundColor: "#dc2626", color: "#fff", fontWeight: "600", padding: "8px 20px", borderRadius: "6px" }}>Cancel</button>
              <button type="submit" className="btn" disabled={employees.length === 0} style={{ backgroundColor: "#10b981", color: "#fff", fontWeight: "600", padding: "8px 20px", borderRadius: "6px" }}>
                {submitLabel} {employees.length} Employee(s)
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}