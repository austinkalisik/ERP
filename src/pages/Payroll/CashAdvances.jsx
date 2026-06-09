import { useState } from "react";
import { MdSearch, MdAdd } from "react-icons/md";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import baseApi from "../../api/baseApi";
import Layout from "../../components/layouts/DashboardLayout";
import Swal from "sweetalert2";
import { can } from "../../utils/permissions";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import SearchableSelect from "../../components/SearchableSelect";

const MAX_AMOUNT = 4000;

const STATUS_BADGE = {
  Pending:      { bg: "#fef3c7", color: "#92400e" },
  Approved:     { bg: "#d1fae5", color: "#065f46" },
  Rejected:     { bg: "#fee2e2", color: "#991b1b" },
  "Fully Paid": { bg: "#dbeafe", color: "#1e40af" },
};

const Badge = ({ status }) => {
  const s = STATUS_BADGE[status] || { bg: "#f3f4f6", color: "#374151" };
  return <span style={{ backgroundColor: s.bg, color: s.color, padding: "2px 10px", borderRadius: "10px", fontSize: "12px", fontWeight: 600 }}>{status}</span>;
};

export default function CashAdvances() {
  const { permissions }                = useAuth();
  const { formatCurrency, formatDate } = useSettings();
  const queryClient                    = useQueryClient();

  const [searchTerm,   setSearchTerm]   = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal,    setShowModal]    = useState(false);

  // ── All cash advances — cached 2 min ─────────────────────────────────────
  const advancesCacheKey = ["payroll_cash_advances_all"];
  const { data: advances = [], isLoading: loading } = useQuery({
    queryKey:  advancesCacheKey,
    queryFn:   () => baseApi.get("/api/payroll/cash-advances").then((r) => r.data || []),
    staleTime: 2 * 60 * 1000,
  });

  // ── Employees — reuses hrms_all_employees shared cache ───────────────────
  const { data: employees = [] } = useQuery({
    queryKey:  ["hrms_all_employees"],
    queryFn: () => baseApi.get("/api/hrms/employees").then((r) => r.data?.data || r.data || []),
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: advancesCacheKey });

  const handleApprove = async (id) => {
    const result = await Swal.fire({
      title: "Approve Cash Advance?", text: "This will allow the deduction to be applied on the next payroll run.",
      icon: "question", showCancelButton: true, confirmButtonColor: "#28a745",
      cancelButtonColor: "#dc3545", confirmButtonText: "Yes, Approve",
    });
    if (!result.isConfirmed) return;
    try {
      await baseApi.put(`/api/payroll/cash-advances/${id}/status`, { status: "Approved" });
      Swal.fire({ icon: "success", title: "Approved!", confirmButtonColor: "#28a745" });
      refetch();
    } catch { Swal.fire({ icon: "error", title: "Failed", text: "Failed to approve.", confirmButtonColor: "#d33" }); }
  };

  const handleReject = async (id) => {
    const result = await Swal.fire({
      title: "Reject Cash Advance?", icon: "warning", input: "textarea", inputLabel: "Reason (optional)",
      showCancelButton: true, confirmButtonColor: "#dc3545", confirmButtonText: "Yes, Reject",
    });
    if (!result.isConfirmed) return;
    try {
      await baseApi.put(`/api/payroll/cash-advances/${id}/status`, { status: "Rejected", notes: result.value });
      Swal.fire({ icon: "success", title: "Rejected", confirmButtonColor: "#28a745" });
      refetch();
    } catch { Swal.fire({ icon: "error", title: "Failed", confirmButtonColor: "#d33" }); }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Cash Advance?", text: "This action cannot be undone.",
      icon: "warning", showCancelButton: true, confirmButtonColor: "#dc3545", confirmButtonText: "Yes, Delete",
    });
    if (!result.isConfirmed) return;
    try {
      await baseApi.delete(`/api/payroll/cash-advances/${id}`);
      Swal.fire({ icon: "success", title: "Deleted!", confirmButtonColor: "#28a745" });
      refetch();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed", text: err.response?.data?.message || "Failed to delete.", confirmButtonColor: "#d33" });
    }
  };

  const filtered = advances.filter((a) => {
    const name = `${a.employee?.first_name || ""} ${a.employee?.last_name || ""}`.toLowerCase();
    const matchSearch = name.includes(searchTerm.toLowerCase()) || (a.employee?.biometric_id || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">Cash Advances</h3>
        {can(permissions, "payroll.manage") && (
          <button className="btn btn-primary px-4" onClick={() => setShowModal(true)}>
            <MdAdd className="me-1" /> New Request
          </button>
        )}
      </div>

      <SummaryCards advances={advances} formatCurrency={formatCurrency} />

      <div className="card mb-4" style={{ borderRadius: "12px" }}>
        <div className="card-body p-3">
          <div className="d-flex gap-3 align-items-center flex-wrap">
            <div className="position-relative">
              <MdSearch style={{ position: "absolute", top: "50%", left: "8px", transform: "translateY(-50%)", color: "#6c757d" }} />
              <input type="text" className="form-control form-control-sm ps-4" style={{ width: "220px" }} placeholder="Search employee..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <select className="form-select form-select-sm" style={{ width: "160px" }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Fully Paid">Fully Paid</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ borderRadius: "12px" }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: "#f8f9fa" }}>
                  <tr>
                    <th className="px-4 py-3" style={{ fontSize: "13px" }}>Employee</th>
                    <th className="py-3" style={{ fontSize: "13px" }}>Amount</th>
                    <th className="py-3" style={{ fontSize: "13px" }}>Interest</th>
                    <th className="py-3" style={{ fontSize: "13px" }}>Total</th>
                    <th className="py-3" style={{ fontSize: "13px" }}>Installment</th>
                    <th className="py-3" style={{ fontSize: "13px" }}>Remaining</th>
                    <th className="py-3" style={{ fontSize: "13px" }}>Start Date</th>
                    <th className="py-3" style={{ fontSize: "13px" }}>Status</th>
                    {can(permissions, "payroll.manage") && <th className="py-3" style={{ fontSize: "13px" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan="9" className="text-center py-5 text-muted">No cash advances found</td></tr>
                  ) : filtered.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-3">
                        <div style={{ fontSize: "14px", fontWeight: 600 }}>{a.employee?.first_name} {a.employee?.last_name}</div>
                        <div style={{ fontSize: "12px", color: "#6c757d" }}>{a.employee?.biometric_id}</div>
                      </td>
                      <td className="py-3" style={{ fontSize: "13px" }}>{formatCurrency(a.amount)}</td>
                      <td className="py-3" style={{ fontSize: "13px" }}>{parseFloat(a.interest_rate).toFixed(2)}%</td>
                      <td className="py-3" style={{ fontSize: "13px", fontWeight: 600 }}>{formatCurrency(a.total_amount)}</td>
                      <td className="py-3" style={{ fontSize: "13px" }}>{formatCurrency(a.installment_amount)}</td>
                      <td className="py-3">
                        <span style={{ fontSize: "13px", fontWeight: 600, color: parseFloat(a.remaining_balance) > 0 ? "#dc3545" : "#28a745" }}>
                          {formatCurrency(a.remaining_balance)}
                        </span>
                      </td>
                      <td className="py-3" style={{ fontSize: "13px" }}>{formatDate(a.start_date)}</td>
                      <td className="py-3"><Badge status={a.status} /></td>
                      {can(permissions, "payroll.manage") && (
                        <td className="py-3">
                          <div className="d-flex gap-1">
                            {a.status === "Pending" && (
                              <>
                                <button className="btn btn-sm btn-success px-2" onClick={() => handleApprove(a.id)}>Approve</button>
                                <button className="btn btn-sm btn-danger px-2" onClick={() => handleReject(a.id)}>Reject</button>
                                <button className="btn btn-sm btn-outline-danger px-2" onClick={() => handleDelete(a.id)}>Delete</button>
                              </>
                            )}
                            {a.status === "Approved"   && <span style={{ fontSize: "12px", color: "#6c757d" }}>Auto-deducting</span>}
                            {a.status === "Fully Paid" && <span style={{ fontSize: "12px", color: "#28a745" }}>✓ Completed</span>}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <NewCashAdvanceModal
          employees={employees}
          formatCurrency={formatCurrency}
          onClose={() => setShowModal(false)}
          onSave={async (data) => {
            try {
              await baseApi.post("/api/payroll/cash-advances", data);
              Swal.fire({ icon: "success", title: "Submitted!", confirmButtonColor: "#28a745" });
              setShowModal(false);
              refetch();
            } catch (err) {
              Swal.fire({ icon: "error", title: "Failed", text: err.response?.data?.message || "Failed to submit.", confirmButtonColor: "#d33" });
            }
          }}
        />
      )}
    </Layout>
  );
}

function SummaryCards({ advances, formatCurrency }) {
  const pending   = advances.filter((a) => a.status === "Pending").length;
  const approved  = advances.filter((a) => a.status === "Approved");
  const totalOwed = approved.reduce((sum, a) => sum + parseFloat(a.remaining_balance || 0), 0);
  const fullyPaid = advances.filter((a) => a.status === "Fully Paid").length;
  const cards = [
    { label: "Pending Requests",  value: pending,                   color: "#f59e0b", bg: "#fef3c7" },
    { label: "Active Advances",   value: approved.length,           color: "#3b82f6", bg: "#dbeafe" },
    { label: "Total Outstanding", value: formatCurrency(totalOwed), color: "#ef4444", bg: "#fee2e2" },
    { label: "Fully Paid",        value: fullyPaid,                 color: "#10b981", bg: "#d1fae5" },
  ];
  return (
    <div className="row g-3 mb-4">
      {cards.map((c) => (
        <div key={c.label} className="col-md-3">
          <div className="card" style={{ borderRadius: "12px", borderLeft: `4px solid ${c.color}` }}>
            <div className="card-body py-3">
              <div style={{ fontSize: "12px", color: "#6c757d" }}>{c.label}</div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: c.color }}>{c.value}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function NewCashAdvanceModal({ employees, formatCurrency, onClose, onSave }) {
  const [form, setForm] = useState({
    biometric_id: "", amount: "", interest_rate: "0",
    installment_amount: "", start_date: "", purpose: "", notes: "",
  });

  // Build options for SearchableSelect
  const employeeOptions = employees.map((emp) => ({
    value: emp.biometric_id,
    label: `${emp.fullname} (${emp.biometric_id})`,
  }));

  const amount      = parseFloat(form.amount) || 0;
  const interest    = parseFloat(form.interest_rate) || 0;
  const totalAmount = amount + (amount * interest / 100);
  const installment = parseFloat(form.installment_amount) || 0;
  const periods     = installment > 0 ? Math.ceil(totalAmount / installment) : 0;

  const handleSubmit = () => {
    if (!form.biometric_id)                           return Swal.fire({ icon: "warning", title: "Select an employee" });
    if (!form.amount || amount <= 0)                  return Swal.fire({ icon: "warning", title: "Enter a valid amount" });
    if (amount > MAX_AMOUNT)                          return Swal.fire({ icon: "warning", title: `Maximum amount is ${formatCurrency(MAX_AMOUNT)}` });
    if (!form.installment_amount || installment <= 0) return Swal.fire({ icon: "warning", title: "Enter installment amount" });
    if (!form.start_date)                             return Swal.fire({ icon: "warning", title: "Select a start date" });
    onSave(form);
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">New Cash Advance Request</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="alert alert-info py-2 mb-3" style={{ fontSize: "13px" }}>
              Maximum: <strong>{formatCurrency(MAX_AMOUNT)}</strong> — deducted automatically each payroll run.
            </div>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-semibold">Employee</label>
                {/* SearchableSelect — employee list can be large */}
                <SearchableSelect
                  options={employeeOptions}
                  value={form.biometric_id}
                  onChange={(v) => setForm({ ...form, biometric_id: v })}
                  placeholder="Search employee..."
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Amount</label>
                <input type="number" className="form-control" placeholder={`Max ${MAX_AMOUNT}`} value={form.amount} min="1" max={MAX_AMOUNT} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Interest Rate (%)</label>
                <input type="number" className="form-control" placeholder="0" value={form.interest_rate} min="0" max="100" step="0.5" onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Installment per Payroll</label>
                <input type="number" className="form-control" placeholder="e.g. 500" value={form.installment_amount} min="1" onChange={(e) => setForm({ ...form, installment_amount: e.target.value })} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Start Date (First Deduction)</label>
                <input type="date" className="form-control" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Purpose</label>
                <input type="text" className="form-control" placeholder="e.g. Medical, Personal" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
              </div>
            </div>
            {amount > 0 && installment > 0 && (
              <div className="mt-3 p-3 rounded" style={{ backgroundColor: "#f8f9fa", border: "1px solid #dee2e6", fontSize: "13px" }}>
                <div style={{ fontWeight: 600, marginBottom: "8px" }}>Summary</div>
                <div className="row g-2">
                  <div className="col-6">Principal: <strong>{formatCurrency(amount)}</strong></div>
                  <div className="col-6">Interest ({interest}%): <strong>{formatCurrency(amount * interest / 100)}</strong></div>
                  <div className="col-6">Total to Repay: <strong style={{ color: "#dc3545" }}>{formatCurrency(totalAmount)}</strong></div>
                  <div className="col-6">Payroll Deductions: <strong>{periods} payroll(s)</strong></div>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-danger" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>Submit Request</button>
          </div>
        </div>
      </div>
    </div>
  );
}