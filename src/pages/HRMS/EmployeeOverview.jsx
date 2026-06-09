import Layout from "../../components/layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import baseApi from "../../api/baseApi";
import { FaEye, FaTrash } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../utils/permissions";

export default function EmployeeOverview() {
  const navigate = useNavigate();
  const { user, permissions } = useAuth();

  const [search,           setSearch]           = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter,     setStatusFilter]     = useState("All");

  const canCreate = can(permissions, "employee.create");
  const canDelete = can(permissions, "employee.delete");

  // Redirect employee users
  useEffect(() => {
    if (user?.role === "employee" && user?.biometric_id) {
      navigate(`/hrms/employee/${user.biometric_id}`, { replace: true });
    }
  }, [user, navigate]);

  // ── React Query — queryKey includes filters so each combination is cached ─
  // staleTime 60s: filters change often so we don't cache too long, but
  // switching back to a previous filter combo shows instantly from cache
  const { data: employees = [] } = useQuery({
    queryKey:  ["hrms_employees_list", search, departmentFilter, statusFilter],
   queryFn: () => baseApi.get("/api/hrms/employees", {
params: { search, department: departmentFilter, status: statusFilter },
}).then((r) => r.data?.data || r.data || []),
    staleTime: 60 * 1000,
    enabled:   user?.role !== "employee",
  });

  if (user?.role === "employee") return null;

  const filteredEmployees = employees.filter((emp) => {
    const matchSearch = emp.fullname?.toLowerCase().includes(search.toLowerCase()) || emp.biometric_id?.toString().includes(search);
    const matchDept   = departmentFilter === "All" || emp.department === departmentFilter;
    const matchStatus = statusFilter     === "All" || emp.status     === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const handleExportCSV = () => {
    window.open(`http://localhost:8000/api/hrms/export/employees/csv?search=${search}&department=${departmentFilter}&status=${statusFilter}`, "_blank");
  };

  const handleExportPDF = () => {
    window.open(`http://localhost:8000/api/hrms/export/employees/pdf?search=${search}&department=${departmentFilter}&status=${statusFilter}`, "_blank");
  };

  const getStatusBadge = (status) => {
    const map = { Regular: "bg-success", Probationary: "bg-warning", Resigned: "bg-secondary", Terminated: "bg-danger", Retired: "bg-info" };
    return map[status] || "bg-dark";
  };

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4 py-4">
        <h2 className="fw-bold mb-4">Employee Overview</h2>

        <div className="card shadow-sm p-4" style={{ borderRadius: "12px" }}>
          {/* Filters */}
          <div className="row g-4 align-items-end mb-4">
            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold">Search</label>
              <input type="text" className="form-control" placeholder="Search employee..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold">Department</label>
              <select className="form-select" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                <option value="All">All</option>
                <option value="HR">HR</option>
                <option value="IT">IT</option>
                <option value="Finance">Finance</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label fw-semibold">Status</label>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All</option>
                <option value="Regular">Regular</option>
                <option value="Probationary">Probationary</option>
                <option value="End of Contract">End of Contract</option>
                <option value="Retired">Retired</option>
                <option value="Terminated">Terminated</option>
                <option value="Resigned">Resigned</option>
              </select>
            </div>
            <div className="col-12 col-md-3 d-flex gap-2 flex-wrap">
              <button className="btn btn-success w-100 w-md-auto" onClick={handleExportCSV}>Export CSV</button>
              <button className="btn btn-danger w-100 w-md-auto" onClick={handleExportPDF}>Export PDF</button>
              {canCreate && (
                <button className="btn btn-primary w-100 w-md-auto" onClick={() => navigate("/hrms/add-employee")}>Add Employee</button>
              )}
            </div>
          </div>

          {/* Desktop Table */}
          <div className="d-none d-md-block table-responsive">
            <table className="table table-bordered align-middle text-center">
              <thead className="table-light">
                <tr>
                  <th>Employee ID</th><th>Full Name</th><th>Department</th><th>Position</th><th>Hire Date</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr><td colSpan="7" className="py-3 text-muted">No employees found.</td></tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.id}>
                      <td>{emp.biometric_id}</td>
                      <td>{emp.fullname}</td>
                      <td>{emp.department}</td>
                      <td>{emp.position}</td>
                      <td>{emp.hireDate}</td>
                      <td><span className={`badge ${getStatusBadge(emp.status)}`}>{emp.status}</span></td>
                      <td>
                        <div className="d-flex justify-content-center gap-3">
                          {can(permissions, "employee.view") && (
                            <FaEye className="text-primary" style={{ cursor: "pointer" }} onClick={() => navigate(`/hrms/employee/${emp.biometric_id}`)} />
                          )}
                          {canDelete && (
                            <FaTrash className="text-danger" style={{ cursor: "pointer" }} onClick={() => alert("Delete employee")} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="d-md-none">
            {filteredEmployees.length === 0 ? (
              <p className="text-center text-muted">No employees found.</p>
            ) : (
              filteredEmployees.map((emp) => (
                <div key={emp.id} className="card mb-3 shadow-sm">
                  <div className="card-body">
                    <h6 className="fw-bold mb-1">{emp.fullname}</h6>
                    <small className="text-muted">ID: {emp.biometric_id}</small>
                    <div className="mt-2">
                      <div><strong>Department:</strong> {emp.department}</div>
                      <div><strong>Position:</strong> {emp.position}</div>
                      <div><strong>Hire Date:</strong> {emp.hireDate}</div>
                    </div>
                    <span className={`badge ${getStatusBadge(emp.status)} mt-2`}>{emp.status}</span>
                    <div className="d-flex gap-2 mt-3">
                      {can(permissions, "employee.view") && (
                        <button className="btn btn-primary w-100" onClick={() => navigate(`/hrms/employee/${emp.biometric_id}`)}>View</button>
                      )}
                      {canDelete && (
                        <button className="btn btn-danger w-100" onClick={() => alert("Delete employee")}>Delete</button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}