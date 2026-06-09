import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";
import { useSettings } from "../../contexts/SettingsContext";
import { MdSearch, MdFilterList, MdVisibility, MdEdit, MdArrowBack, MdAttachMoney, MdCheckCircle } from "react-icons/md";

export default function SalaryTable() {
  const navigate               = useNavigate();
  const { formatCurrency, formatDate } = useSettings();
  const queryClient            = useQueryClient();

  const [searchTerm,       setSearchTerm]       = useState("");
  const [filterStatus,     setFilterStatus]     = useState("All");
  const [currentPage,      setCurrentPage]      = useState(1);
  const [selectedPayrolls, setSelectedPayrolls] = useState([]);

  // ── Payrolls — cached per page+status combination ────────────────────────
  // staleTime 30s: payroll statuses change when HR approves
  const { data: payrollData, isLoading: loading } = useQuery({
    queryKey:  ["payroll_list", currentPage, filterStatus],
    queryFn:   () => {
      const params = { page: currentPage, per_page: 15 };
      if (filterStatus !== "All") params.status = filterStatus;
      return baseApi.get("/api/payroll", { params }).then((r) => r.data);
    },
    staleTime: 30 * 1000,
    keepPreviousData: true, // show old data while loading next page
  });

  const payrolls   = payrollData?.data       || [];
  const totalPages = payrollData?.last_page  || 1;

  const refetch = () => queryClient.invalidateQueries({ queryKey: ["payroll_list"] });

  const handleStatusChange = async (payrollId, newStatus) => {
    const result = await Swal.fire({
      title: `Change Status to ${newStatus}?`, icon: "question", showCancelButton: true,
      confirmButtonColor: "#0d6efd", cancelButtonColor: "#dc3545", confirmButtonText: "Yes, change it",
    });
    if (!result.isConfirmed) return;
    try {
      await baseApi.put(`/api/payroll/${payrollId}/status`, { status: newStatus });
      Swal.fire({ icon: "success", title: "Success!", text: `Status changed to ${newStatus}`, confirmButtonColor: "#28a745", timer: 2000 });
      refetch();
    } catch { Swal.fire({ icon: "error", title: "Failed", text: "Failed to update status", confirmButtonColor: "#d33" }); }
  };

  const handleBulkApprove = async () => {
    if (selectedPayrolls.length === 0) { Swal.fire({ icon: "warning", title: "No Selection", text: "Please select at least one payroll to approve" }); return; }
    const result = await Swal.fire({
      title: `Approve ${selectedPayrolls.length} Payrolls?`, icon: "question", showCancelButton: true,
      confirmButtonColor: "#28a745", cancelButtonColor: "#dc3545", confirmButtonText: "Yes, approve all",
    });
    if (!result.isConfirmed) return;
    try {
      await baseApi.post("/api/payroll/bulk-approve", { payroll_ids: selectedPayrolls });
      Swal.fire({ icon: "success", title: "Success!", text: `${selectedPayrolls.length} payrolls approved`, confirmButtonColor: "#28a745", timer: 2000 });
      setSelectedPayrolls([]);
      refetch();
    } catch { Swal.fire({ icon: "error", title: "Failed", confirmButtonColor: "#d33" }); }
  };

  const handleToggleSelect = (id) =>
    setSelectedPayrolls((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const filteredPayrolls = payrolls.filter((p) => {
    const name = `${p.employee?.first_name} ${p.employee?.last_name}`.toLowerCase();
    const id   = (p.employee?.biometric_id || "").toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || id.includes(searchTerm.toLowerCase());
  });

  const pendingCount    = filteredPayrolls.filter((p) => p.status === "Pending").length;
  const totalGross      = filteredPayrolls.reduce((s, p) => s + parseFloat(p.gross_pay  || 0), 0);
  const totalDeductions = filteredPayrolls.reduce((s, p) => s + parseFloat(p.deductions || 0), 0);
  const totalNet        = filteredPayrolls.reduce((s, p) => s + parseFloat(p.net_pay    || 0), 0);

  const handleSelectAllPending = () => {
    const pendingIds = filteredPayrolls.filter((p) => p.status === "Pending").map((p) => p.id);
    setSelectedPayrolls(selectedPayrolls.length === pendingIds.length ? [] : pendingIds);
  };

  const getStatusBadge = (status) => {
    const styles = { Pending: { bg: "#fef3c7", color: "#92400e" }, Approved: { bg: "#dbeafe", color: "#1e40af" }, Paid: { bg: "#d1fae5", color: "#065f46" }, Rejected: { bg: "#fee2e2", color: "#991b1b" } };
    const s = styles[status] || styles.Pending;
    return <span style={{ backgroundColor: s.bg, color: s.color, padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" }}>{status}</span>;
  };

  const getNextStatusOptions = (status) => ({ Pending: ["Approved", "Rejected"], Approved: ["Paid", "Rejected"], Paid: [], Rejected: ["Pending"] }[status] || []);

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 style={{ fontWeight: "bold", fontSize: "clamp(20px, 5vw, 28px)" }}>Salary Table</h1>
            <p className="text-muted mb-0">View and manage all payroll records</p>
          </div>
          <button className="btn btn-outline-danger" onClick={() => navigate("/payroll")}><MdArrowBack className="me-2" />Back</button>
        </div>

        {/* Summary Cards */}
        <div className="row g-3 mb-4">
          {[
            { label: "Total Gross Pay",  value: formatCurrency(totalGross),      bg: "#e7f3ff", color: "#0d6efd" },
            { label: "Total Deductions", value: formatCurrency(totalDeductions), bg: "#fff3e0", color: "#f57c00" },
            { label: "Total Net Pay",    value: formatCurrency(totalNet),        bg: "#d4edda", color: "#28a745" },
            { label: "Pending",          value: pendingCount,                    bg: "#fef3c7", color: "#f59e0b" },
          ].map((card) => (
            <div key={card.label} className="col-md-3">
              <div className="card" style={{ borderRadius: "12px" }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    <div style={{ width: "60px", height: "60px", borderRadius: "12px", backgroundColor: card.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MdAttachMoney size={32} color={card.color} />
                    </div>
                    <div className="ms-3">
                      <div className="text-muted" style={{ fontSize: "13px" }}>{card.label}</div>
                      <h4 className="mb-0 fw-bold">{card.value}</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ borderRadius: "12px" }}>
          <div className="card-body p-4">
            <div className="row mb-4">
              <div className="col-md-4 mb-3 mb-md-0">
                <div className="position-relative">
                  <MdSearch style={{ position: "absolute", top: "50%", left: "12px", transform: "translateY(-50%)", color: "#6c757d" }} />
                  <input type="text" className="form-control ps-5" placeholder="Search by employee name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div className="col-md-2 mb-3 mb-md-0">
                <div className="position-relative">
                  <MdFilterList style={{ position: "absolute", top: "50%", left: "12px", transform: "translateY(-50%)", color: "#6c757d" }} />
                  <select className="form-select ps-5" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Paid">Paid</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div className="col-md-3 mb-3 mb-md-0">
                {pendingCount > 0 && (
                  <button className="btn btn-outline-primary w-100" onClick={handleSelectAllPending}>
                    {selectedPayrolls.length === pendingCount ? "Deselect All Pending" : "Select All Pending"}
                  </button>
                )}
              </div>
              <div className="col-md-3">
                {selectedPayrolls.length > 0 ? (
                  <button className="btn btn-success w-100" onClick={handleBulkApprove}>
                    <MdCheckCircle className="me-2" />Approve Selected ({selectedPayrolls.length})
                  </button>
                ) : (
                  <button className="btn btn-success w-100" onClick={() => navigate("/payroll/run")}>+ Run New Payroll</button>
                )}
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
                        <th style={{ padding: "12px", width: "40px" }}>
                          <input type="checkbox" checked={selectedPayrolls.length === pendingCount && pendingCount > 0} onChange={handleSelectAllPending} disabled={pendingCount === 0} />
                        </th>
                        <th style={{ padding: "12px" }}>Employee</th>
                        <th style={{ padding: "12px" }}>Pay Period</th>
                        <th style={{ padding: "12px" }}>Payment Date</th>
                        <th style={{ padding: "12px" }}>Gross Pay</th>
                        <th style={{ padding: "12px" }}>Deductions</th>
                        <th style={{ padding: "12px" }}>Net Pay</th>
                        <th style={{ padding: "12px" }}>Status</th>
                        <th style={{ padding: "12px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayrolls.length > 0 ? (
                        filteredPayrolls.map((payroll) => (
                          <tr key={payroll.id}>
                            <td style={{ padding: "12px" }}>
                              <input type="checkbox" checked={selectedPayrolls.includes(payroll.id)} onChange={() => handleToggleSelect(payroll.id)} disabled={payroll.status !== "Pending"} />
                            </td>
                            <td style={{ padding: "12px" }}>
                              <div style={{ fontWeight: "600" }}>{payroll.employee?.first_name} {payroll.employee?.last_name}</div>
                              <div style={{ fontSize: "12px", color: "#6c757d" }}>{payroll.employee?.biometric_id}</div>
                            </td>
                            <td style={{ padding: "12px", fontSize: "14px" }}>{formatDate(payroll.pay_period_start)} – {formatDate(payroll.pay_period_end)}</td>
                            <td style={{ padding: "12px", fontSize: "14px" }}>{formatDate(payroll.payment_date)}</td>
                            <td style={{ padding: "12px", fontSize: "14px", fontWeight: "600" }}>{formatCurrency(payroll.gross_pay)}</td>
                            <td style={{ padding: "12px", fontSize: "14px", color: "#dc3545" }}>-{formatCurrency(payroll.deductions)}</td>
                            <td style={{ padding: "12px", fontSize: "14px", fontWeight: "600", color: "#28a745" }}>{formatCurrency(payroll.net_pay)}</td>
                            <td style={{ padding: "12px" }}>{getStatusBadge(payroll.status)}</td>
                            <td style={{ padding: "12px" }}>
                              <div className="d-flex gap-2">
                                <button className="btn btn-sm btn-primary" style={{ fontSize: "12px", padding: "4px 12px" }} onClick={() => navigate(`/hrms/employee/${payroll.employee?.biometric_id}`)}>
                                  <MdVisibility className="me-1" />View
                                </button>
                                {getNextStatusOptions(payroll.status).length > 0 && (
                                  <div className="dropdown">
                                    <button className="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" style={{ fontSize: "12px", padding: "4px 12px" }}>
                                      <MdEdit className="me-1" />Change
                                    </button>
                                    <ul className="dropdown-menu">
                                      {getNextStatusOptions(payroll.status).map((status) => (
                                        <li key={status}><button className="dropdown-item" onClick={() => handleStatusChange(payroll.id, status)}>{status}</button></li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="text-center py-5" style={{ fontSize: "14px", color: "#6c757d" }}>
                            {searchTerm || filterStatus !== "All" ? "No payroll records found matching your filters" : "No payroll records yet. Run your first payroll to get started!"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    <nav>
                      <ul className="pagination">
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>Previous</button>
                        </li>
                        {[...Array(totalPages)].map((_, i) => (
                          <li key={i + 1} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                            <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                          </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
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
    </Layout>
  );
}