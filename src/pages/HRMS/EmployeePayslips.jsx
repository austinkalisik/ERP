import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";
import { MdSearch, MdDownload, MdVisibility, MdReceipt, MdCheckCircle, MdPendingActions } from "react-icons/md";
import { useSettings } from "../../contexts/SettingsContext";

export default function EmployeePayslips({ employee }) {
  const navigate           = useNavigate();
  const { formatCurrency } = useSettings();

  const [searchTerm,    setSearchTerm]    = useState("");
  const [filterStatus,  setFilterStatus]  = useState("All");

  // ── Per-employee payslips — cached 5 min ──────────────────────────────────
  const { data: payslips = [], isLoading: loading } = useQuery({
    queryKey:  ["payroll_payslips", employee?.biometric_id],
    queryFn:   () => baseApi.get(`/api/payroll/payslips/${employee.biometric_id}`).then((r) => r.data || []),
    staleTime: 5 * 60 * 1000,
    enabled:   !!employee?.biometric_id,
    onError:   (err) => {
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.message || "Failed to load payslips", confirmButtonColor: "#d33" });
    },
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const getStatusBadge = (status) => {
    const styles = { Paid: "bg-success", Pending: "bg-warning", Cancelled: "bg-danger", Approved: "bg-info", Rejected: "bg-danger" };
    return <span className={`badge ${styles[status] || "bg-secondary"} text-white`}>{status}</span>;
  };

  if (!employee?.biometric_id) {
    return <div className="alert alert-warning"><strong>Unable to load payslips:</strong> Employee ID is missing.</div>;
  }

  const filteredPayslips = payslips.filter((payslip) => {
    const payroll = payslip.payroll;
    if (!payroll) return false;
    const matchesSearch =
      String(payroll.pay_period_start || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(payroll.pay_period_end   || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(payroll.payment_date     || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "All" || payroll.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalNetPay  = payslips.filter((p) => p.payroll?.status === "Paid").reduce((sum, p) => sum + parseFloat(p.net_pay || 0), 0);
  const pendingCount = payslips.filter((p) => p.payroll?.status === "Pending").length;

  return (
    <div className="row g-4">
      {/* Summary */}
      <div className="col-12">
        <div className="card" style={{ borderRadius: "12px", borderTop: "3px solid #ffe680" }}>
          <div className="card-body p-4">
            <div className="row">
              {[
                { label: "Total Payslips", value: payslips.length,             color: "#0d6efd", bg: "#e7f3ff", icon: <MdReceipt size={32} color="#0d6efd" /> },
                { label: "Total Paid",     value: formatCurrency(totalNetPay), color: "#28a745", bg: "#d4edda", icon: <MdCheckCircle size={32} color="#28a745" /> },
                { label: "Pending",        value: pendingCount,               color: "#ffc107", bg: "#fff3cd", icon: <MdPendingActions size={32} color="#ffc107" /> },
              ].map((c) => (
                <div key={c.label} className="col-md-4">
                  <div className="d-flex align-items-center">
                    <div style={{ width: "60px", height: "60px", borderRadius: "12px", backgroundColor: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{c.icon}</div>
                    <div className="ms-3">
                      <div className="text-muted" style={{ fontSize: "13px" }}>{c.label}</div>
                      <h4 className="mb-0 fw-bold">{c.value}</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="col-12">
        <div className="card" style={{ borderRadius: "12px", borderTop: "3px solid #ffe680" }}>
          <div className="card-body p-4">
            <h5 className="fw-bold mb-4">Payroll History</h5>
            <div className="row mb-4">
              <div className="col-md-6 mb-3 mb-md-0">
                <div className="position-relative">
                  <MdSearch style={{ position: "absolute", top: "50%", left: "12px", transform: "translateY(-50%)", color: "#6c757d" }} />
                  <input type="text" className="form-control ps-5" placeholder="Search by date..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div className="col-md-6">
                <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="All">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead style={{ backgroundColor: "#f8f9fa" }}>
                    <tr>
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
                    {filteredPayslips.length > 0 ? (
                      filteredPayslips.map((payslip) => {
                        const payroll = payslip.payroll;
                        if (!payroll) return null;
                        return (
                          <tr key={payslip.id}>
                            <td style={{ padding: "12px", fontSize: "14px" }}>{formatDate(payroll.pay_period_start)} - {formatDate(payroll.pay_period_end)}</td>
                            <td style={{ padding: "12px", fontSize: "14px" }}>{formatDate(payroll.payment_date)}</td>
                            <td style={{ padding: "12px", fontSize: "14px", fontWeight: "500" }}>{formatCurrency(payroll.gross_pay)}</td>
                            <td style={{ padding: "12px", fontSize: "14px", color: "#dc3545" }}>-{formatCurrency(payroll.deductions)}</td>
                            <td style={{ padding: "12px", fontSize: "14px", fontWeight: "600", color: "#28a745" }}>{formatCurrency(payslip.net_pay)}</td>
                            <td style={{ padding: "12px", fontSize: "14px" }}>{getStatusBadge(payroll.status)}</td>
                            <td style={{ padding: "12px" }}>
                              <button className="btn btn-sm btn-primary me-2" style={{ fontSize: "12px", padding: "4px 12px" }} onClick={() => navigate(`/payslip/${payslip.id}`)}>
                                <MdVisibility className="me-1" />View
                              </button>
                              {payslip.pdf_path && (
                                <button className="btn btn-sm btn-danger" style={{ fontSize: "12px", padding: "4px 12px" }} onClick={() => window.open(`${import.meta.env.VITE_API_URL}/storage/${payslip.pdf_path}`, "_blank")}>
                                  <MdDownload className="me-1" />PDF
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-5" style={{ fontSize: "14px", color: "#6c757d" }}>
                          {searchTerm || filterStatus !== "All" ? "No payslips found matching your filters" : "No payslips generated yet"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}