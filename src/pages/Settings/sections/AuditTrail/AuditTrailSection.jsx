import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import baseApi from "../../../../api/baseApi";
import {
  MdHistory, MdSearch, MdRefresh, MdVisibility,
  MdPerson, MdCalendarToday, MdComputer, MdLocationOn,
} from "react-icons/md";

// ── Pure helpers (no state) ───────────────────────────────────────────────────
const getActionBadge = (action) => ({
  created: "success", approved: "success", fulfilled: "success",
  updated: "info", stock_in: "info",
  deleted: "danger", rejected: "danger",
  cancelled: "warning", stock_out: "warning",
  login: "secondary", logout: "secondary",
})[action] || "secondary";

const getModuleBadge = (mod) => ({
  HRMS: "primary", Payroll: "success", AIMS: "warning", MOMS: "info", System: "secondary",
})[mod] || "secondary";

// Infer module from description when log.module is null
const inferModule = (log) => {
  if (log.module) return log.module;
  if (log.action === "login" || log.action === "logout") return "System";
  const desc = (log.description || "").toLowerCase();
  if (desc.includes("employee") || desc.includes("department") || desc.includes("shift") || desc.includes("assignment") || desc.includes("operator")) return "HRMS";
  if (desc.includes("payroll") || desc.includes("payslip") || desc.includes("salary")) return "Payroll";
  if (desc.includes("inventory") || desc.includes("stock") || desc.includes("item")) return "AIMS";
  if (desc.includes("machine") || desc.includes("fuel") || desc.includes("maintenance") || desc.includes("breakdown")) return "MOMS";
  if (desc.includes("user") || desc.includes("logged in") || desc.includes("logged out") || desc.includes("login") || desc.includes("logout")) return "System";
  return null;
};

export default function AuditTrailSection() {
  const queryClient = useQueryClient();

  const [search,    setSearch]    = useState("");
  const [module,    setModule]    = useState("All");
  const [action,    setAction]    = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");
  const [page,      setPage]      = useState(1);

  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal,   setShowModal]   = useState(false);

  // ── Audit logs — server-side filters + pagination baked into the key ──────
  // Different filter combinations each get their own cache slot
  const logsCacheKey = ["audit_logs", { search, module, action, startDate, endDate, page }];
  const { data: logsData, isLoading: loading, refetch } = useQuery({
    queryKey:  logsCacheKey,
    queryFn:   () => {
      const params = new URLSearchParams({ page, per_page: 50 });
      if (search)           params.append("search",     search);
      if (module !== "All") params.append("module",     module);
      if (action !== "All") params.append("action",     action);
      if (startDate)        params.append("start_date", startDate);
      if (endDate)          params.append("end_date",   endDate);
      return baseApi.get(`/api/audit-logs?${params}`).then((r) => r.data);
    },
    staleTime: 60 * 1000, // 1 min — audit logs are append-only so short stale is fine
    keepPreviousData: true, // no flicker when paginating
  });

  const logs       = logsData?.data         || [];
  const totalPages = logsData?.last_page    || 1;
  const currentPage = logsData?.current_page || 1;

  // ── Stats — cached 60 s, refreshes independently of the logs query ────────
  const { data: stats } = useQuery({
    queryKey:  ["audit_logs_stats"],
    queryFn:   () => baseApi.get("/api/audit-logs/statistics").then((r) => r.data),
    staleTime: 60 * 1000,
  });

  const handleViewDetails = async (log) => {
    try {
      const res = await baseApi.get(`/api/audit-logs/${log.id}`);
      setSelectedLog(res.data.data);
      setShowModal(true);
    } catch (err) {
      console.error("Failed to fetch log details", err);
    }
  };

  const clearFilters = () => {
    setSearch(""); setModule("All"); setAction("All"); setStartDate(""); setEndDate(""); setPage(1);
  };

  // When a filter changes, reset to page 1
  const applyFilter = (setter) => (val) => { setter(val); setPage(1); };

  return (
    <div>
      <div className="row mb-3 align-items-center">
        <div className="col">
          <h3 className="fw-bold d-flex align-items-center gap-2">
            <MdHistory size={28} className="text-primary" />Audit Trail
          </h3>
          <p className="text-muted mb-0">System activity and change history</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="row g-3 mb-4">
          <StatCard title="Total Logs" value={stats.total_logs?.toLocaleString()} icon={<MdHistory />}       color="primary" />
          <StatCard title="Today"      value={stats.today_logs?.toLocaleString()} icon={<MdCalendarToday />} color="success" />
          <StatCard title="This Week"  value={stats.week_logs?.toLocaleString()}  icon={<MdCalendarToday />} color="info" />
        </div>
      )}

      {/* Filters */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white"><MdSearch /></span>
                <input className="form-control" placeholder="Search description or user..." value={search} onChange={(e) => applyFilter(setSearch)(e.target.value)} />
              </div>
            </div>
            <div className="col-md-2">
              <select className="form-select" value={module} onChange={(e) => applyFilter(setModule)(e.target.value)}>
                <option value="All">All Modules</option>
                <option value="HRMS">HRMS</option>
                <option value="Payroll">Payroll</option>
                <option value="AIMS">AIMS</option>
                <option value="MOMS">MOMS</option>
                <option value="System">System</option>
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select" value={action} onChange={(e) => applyFilter(setAction)(e.target.value)}>
                <option value="All">All Actions</option>
                <option value="created">Created</option>
                <option value="updated">Updated</option>
                <option value="deleted">Deleted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="stock_in">Stock In</option>
                <option value="stock_out">Stock Out</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
              </select>
            </div>
            <div className="col-md-2">
              <input type="date" className="form-control" value={startDate} onChange={(e) => applyFilter(setStartDate)(e.target.value)} />
            </div>
            <div className="col-md-2">
              <input type="date" className="form-control" value={endDate} onChange={(e) => applyFilter(setEndDate)(e.target.value)} />
            </div>
          </div>
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-sm btn-outline-primary" onClick={() => refetch()}>
              <MdRefresh className="me-1" />Refresh
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={clearFilters}>Clear Filters</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Date & Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Module</th>
                <th>Description</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-4">Loading audit logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="6" className="text-center text-muted py-4">No audit logs found</td></tr>
              ) : (
                logs.map((log) => (
                  <AuditLogRow key={log.id} log={log} onView={handleViewDetails} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="card-footer d-flex justify-content-between align-items-center">
            <div className="text-muted">Page {currentPage} of {totalPages}</div>
            <div className="btn-group">
              <button className="btn btn-sm btn-outline-primary" disabled={currentPage === 1}         onClick={() => setPage((p) => p - 1)}>Previous</button>
              <button className="btn btn-sm btn-outline-primary" disabled={currentPage === totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {showModal && selectedLog && (
        <AuditLogModal log={selectedLog} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ title, value, icon, color }) {
  return (
    <div className="col-md-4">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex gap-3 align-items-center">
          <div className={`text-${color}`} style={{ fontSize: "32px" }}>{icon}</div>
          <div>
            <div className="text-muted small">{title}</div>
            <div className="fw-bold fs-3">{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuditLogRow({ log, onView }) {
  const resolvedModule = inferModule(log);
  return (
    <tr>
      <td><small className="text-muted">{new Date(log.created_at).toLocaleString()}</small></td>
      <td>
        <div className="d-flex align-items-center gap-2">
          <MdPerson className="text-muted" />
          <div>
            <div className="fw-semibold">{log.user_name || "System"}</div>
            {log.user_role && <small className="text-muted">{log.user_role}</small>}
          </div>
        </div>
      </td>
      <td><span className={`badge bg-${getActionBadge(log.action)} rounded-pill`}>{log.action}</span></td>
      <td>
        {resolvedModule
          ? <span className={`badge bg-${getModuleBadge(resolvedModule)}`}>{resolvedModule}</span>
          : <span className="text-muted">—</span>}
      </td>
      <td>{log.description}</td>
      <td className="text-center">
        <button className="btn btn-sm btn-outline-primary" onClick={() => onView(log)}><MdVisibility /></button>
      </td>
    </tr>
  );
}

function AuditLogModal({ log, onClose }) {
  const resolvedModule = inferModule(log);
  return (
    <>
      <div className="modal-backdrop fade show" onClick={onClose} style={{ zIndex: 1040 }} />
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div className="modal-content border-0 shadow-lg">
            <div className={`modal-header bg-${getActionBadge(log.action)} text-white`}>
              <h5 className="modal-title fw-bold"><MdHistory className="me-2" />Audit Log Details</h5>
              <button type="button" className="btn-close btn-close-white" onClick={onClose} />
            </div>
            <div className="modal-body">
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="border rounded p-3">
                    <div className="d-flex align-items-center gap-2 mb-2"><MdCalendarToday className="text-primary" /><strong className="text-muted small">Date & Time</strong></div>
                    <div className="fw-semibold">{new Date(log.created_at).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}</div>
                    <div className="text-muted small">{new Date(log.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="border rounded p-3">
                    <div className="d-flex align-items-center gap-2 mb-2"><MdPerson className="text-primary" /><strong className="text-muted small">User</strong></div>
                    <div className="fw-semibold">{log.user_name || "System"}</div>
                    {log.user_role && <div className="text-muted small text-capitalize">{log.user_role.replace(/_/g, " ")}</div>}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="border rounded p-3">
                    <strong className="text-muted small d-block mb-2">Action</strong>
                    <span className={`badge bg-${getActionBadge(log.action)} px-3 py-2`}>{log.action.toUpperCase()}</span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="border rounded p-3">
                    <strong className="text-muted small d-block mb-2">Module</strong>
                    {resolvedModule
                      ? <span className={`badge bg-${getModuleBadge(resolvedModule)} px-3 py-2`}>{resolvedModule}</span>
                      : <span className="text-muted">—</span>}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <strong className="text-muted small d-block mb-2">Description</strong>
                <div className="border rounded p-3 bg-light"><p className="mb-0">{log.description}</p></div>
              </div>

              {(log.ip_address || log.user_agent) && (
                <div className="mb-4">
                  <div className="d-flex align-items-center gap-2 mb-2"><MdComputer className="text-primary" /><strong className="text-muted small">Technical Information</strong></div>
                  <div className="border rounded p-3">
                    {log.ip_address && (
                      <div className="mb-2">
                        <div className="d-flex align-items-center gap-2"><MdLocationOn size={16} className="text-muted" /><small className="text-muted">IP Address:</small></div>
                        <div className="font-monospace small ms-4">{log.ip_address}</div>
                      </div>
                    )}
                    {log.user_agent && (
                      <div>
                        <div className="d-flex align-items-center gap-2"><MdComputer size={16} className="text-muted" /><small className="text-muted">Device/Browser:</small></div>
                        <div className="font-monospace small text-wrap ms-4">{log.user_agent}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {log.action === "created" && log.new_values && Object.keys(log.new_values).length > 0 && (
                <div>
                  <strong className="text-muted small d-block mb-2">Item Details</strong>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover mb-0">
                      <thead className="table-light"><tr><th width="30%">Field Name</th><th width="70%">Value</th></tr></thead>
                      <tbody>
                        {Object.entries(log.new_values)
                          .filter(([key]) => !["id", "created_at", "updated_at"].includes(key))
                          .map(([field, value]) => (
                            <tr key={field}>
                              <td className="fw-semibold text-capitalize">
                                {field.replace(/_/g, " ")}
                                {field === "current_stock" && <div className="text-muted small fw-normal">(Stock added via Stock In)</div>}
                              </td>
                              <td className="bg-success bg-opacity-10">
                                <code className="text-dark">{value === null || value === "" ? <em className="text-muted">(empty)</em> : typeof value === "object" ? JSON.stringify(value) : String(value)}</code>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {(log.action === "updated" || log.action === "deleted") && log.changes && Object.keys(log.changes).length > 0 && (
                <div>
                  <strong className="text-muted small d-block mb-2">Changes Made</strong>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover mb-0">
                      <thead className="table-light"><tr><th width="30%">Field Name</th><th width="35%">Previous Value</th><th width="35%">New Value</th></tr></thead>
                      <tbody>
                        {Object.entries(log.changes).map(([field, values]) => (
                          <tr key={field}>
                            <td className="fw-semibold text-capitalize">{field.replace(/_/g, " ")}</td>
                            <td className="bg-danger bg-opacity-10">
                              <code className="text-dark">{values.old === null || values.old === "" ? <em className="text-muted">(empty)</em> : JSON.stringify(values.old)}</code>
                            </td>
                            <td className="bg-success bg-opacity-10">
                              <code className="text-dark">{values.new === null || values.new === "" ? <em className="text-muted">(empty)</em> : JSON.stringify(values.new)}</code>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {log.action !== "login" && log.action !== "logout" &&
               (!log.changes    || Object.keys(log.changes).length    === 0) &&
               (!log.new_values || Object.keys(log.new_values).length === 0) && (
                <div className="alert alert-info mb-0">
                  <small><strong>Note:</strong> No detailed changes were recorded for this action.</small>
                </div>
              )}
            </div>
            <div className="modal-footer bg-light">
              <button className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}