import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FaUserCircle } from "react-icons/fa";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";
import { can } from "../../utils/permissions";
import { useSettings } from "../../contexts/SettingsContext";

const MAX_AMOUNT = 4000;

const STATUS_BADGE = {
  Pending:      { bg: "#fef3c7", color: "#92400e" },
  Approved:     { bg: "#d1fae5", color: "#065f46" },
  Rejected:     { bg: "#fee2e2", color: "#991b1b" },
  "Fully Paid": { bg: "#dbeafe", color: "#1e40af" },
};

const Badge = ({ status }) => {
  const s = STATUS_BADGE[status] || { bg: "#f3f4f6", color: "#374151" };
  return (
    <span style={{ backgroundColor: s.bg, color: s.color, padding: "2px 10px", borderRadius: "10px", fontSize: "12px", fontWeight: 600 }}>
      {status}
    </span>
  );
};

const formatDate = (d) => {
  if (!d) return "—";
  const parts = d.split("T")[0].split("-").map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

export default function EmployeeCashAdvances({ employee, permissions }) {
  const { formatCurrency } = useSettings();
  const queryClient        = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);

  // ── Per-employee cash advances — cached 2 min ─────────────────────────────
  const cacheKey = ["payroll_cash_advances", employee?.biometric_id];
  const { data: advances = [], isLoading: loading } = useQuery({
    queryKey:  cacheKey,
    queryFn:   () => baseApi.get(`/api/payroll/cash-advances/employee/${employee.biometric_id}`).then((r) => r.data || []),
    staleTime: 2 * 60 * 1000,
    enabled:   !!employee?.biometric_id,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: cacheKey });

  const handleApprove = async (id) => {
    const result = await Swal.fire({
      title: "Approve Cash Advance?", text: "Deduction will be applied on the next payroll run.",
      icon: "question", showCancelButton: true, confirmButtonColor: "#28a745",
      cancelButtonColor: "#dc3545", confirmButtonText: "Yes, Approve",
    });
    if (!result.isConfirmed) return;
    try {
      await baseApi.put(`/api/payroll/cash-advances/${id}/status`, { status: "Approved" });
      Swal.fire({ icon: "success", title: "Approved!", confirmButtonColor: "#28a745" });
      refetch();
    } catch { Swal.fire({ icon: "error", title: "Failed", text: "Could not approve.", confirmButtonColor: "#d33" }); }
  };

  const handleReject = async (id) => {
    const result = await Swal.fire({
      title: "Reject Cash Advance?", icon: "warning",
      input: "textarea", inputLabel: "Reason (optional)",
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
      Swal.fire({ icon: "error", title: "Failed", text: err.response?.data?.message || "Could not delete.", confirmButtonColor: "#d33" });
    }
  };

  const active     = advances.filter((a) => a.status === "Approved");
  const totalOwed  = active.reduce((sum, a) => sum + parseFloat(a.remaining_balance || 0), 0);
  const totalTaken = advances.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0);

  return (
    <div>
      {/* Employee Card */}
      <div className="card mb-4" style={{ borderRadius: "12px", border: "2px solid #ffe680" }}>
        <div className="card-body text-center py-4">
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", margin: "0 auto", backgroundColor: "#e0e0e0", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {employee.profile_picture ? <img src={employee.profile_picture} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <FaUserCircle size={70} color="#555" />}
          </div>
          <h5 className="mt-3 mb-1 fw-bold">{employee.fullname}</h5>
          <div className="text-muted" style={{ fontSize: "13px" }}>{employee.biometric_id} — {employee.department || "N/A"}</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: "Total Advances Taken", value: formatCurrency(totalTaken), color: "#3b82f6" },
          { label: "Active Advances",      value: active.length,             color: "#f59e0b" },
          { label: "Outstanding Balance",  value: formatCurrency(totalOwed), color: "#ef4444" },
          { label: "Fully Paid",           value: advances.filter((a) => a.status === "Fully Paid").length, color: "#10b981" },
        ].map((c) => (
          <div key={c.label} className="col-md-3">
            <div className="card" style={{ borderRadius: "10px", borderLeft: `4px solid ${c.color}` }}>
              <div className="card-body py-3">
                <div style={{ fontSize: "12px", color: "#6c757d" }}>{c.label}</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: c.color }}>{c.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ borderRadius: "12px" }}>
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">Cash Advance History</h5>
            {can(permissions, "payroll.manage") && (
              <button className="btn btn-primary btn-sm px-4" onClick={() => setShowAddModal(true)}>+ New Request</button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-4"><div className="spinner-border text-primary" role="status" /></div>
          ) : advances.length === 0 ? (
            <div className="text-center py-4 text-muted">No cash advance records found</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover mb-0">
                <thead className="table-light">
                  <tr style={{ fontSize: "13px" }}>
                    <th>Amount</th><th>Interest</th><th>Total</th><th>Installment/Payroll</th>
                    <th>Deducted</th><th>Remaining</th><th>Start Date</th><th>Purpose</th><th>Status</th>
                    {can(permissions, "payroll.manage") && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {advances.map((a) => (
                    <tr key={a.id} style={{ fontSize: "13px" }}>
                      <td>{formatCurrency(a.amount)}</td>
                      <td>{parseFloat(a.interest_rate).toFixed(2)}%</td>
                      <td className="fw-semibold">{formatCurrency(a.total_amount)}</td>
                      <td>{formatCurrency(a.installment_amount)}</td>
                      <td style={{ color: "#28a745", fontWeight: 600 }}>{formatCurrency(a.total_deducted)}</td>
                      <td style={{ color: parseFloat(a.remaining_balance) > 0 ? "#dc3545" : "#28a745", fontWeight: 600 }}>{formatCurrency(a.remaining_balance)}</td>
                      <td>{formatDate(a.start_date)}</td>
                      <td>{a.purpose || "—"}</td>
                      <td><Badge status={a.status} /></td>
                      {can(permissions, "payroll.manage") && (
                        <td>
                          <div className="d-flex gap-1">
                            {a.status === "Pending" && (
                              <>
                                <button className="btn btn-sm btn-success px-2" onClick={() => handleApprove(a.id)}>Approve</button>
                                <button className="btn btn-sm btn-danger px-2" onClick={() => handleReject(a.id)}>Reject</button>
                                <button className="btn btn-sm btn-outline-danger px-2" onClick={() => handleDelete(a.id)}>Delete</button>
                              </>
                            )}
                            {a.status === "Approved"   && <span style={{ fontSize: "11px", color: "#6c757d" }}>Auto-deducting</span>}
                            {a.status === "Fully Paid" && <span style={{ fontSize: "11px", color: "#28a745" }}>✓ Paid</span>}
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

      {showAddModal && (
        <NewCashAdvanceModal
          employee={employee}
          onClose={() => setShowAddModal(false)}
          onSave={async (data) => {
            try {
              await baseApi.post("/api/payroll/cash-advances", { ...data, biometric_id: employee.biometric_id });
              Swal.fire({ icon: "success", title: "Submitted!", confirmButtonColor: "#28a745" });
              setShowAddModal(false);
              refetch();
            } catch (err) {
              Swal.fire({ icon: "error", title: "Failed", text: err.response?.data?.message || "Failed to submit.", confirmButtonColor: "#d33" });
            }
          }}
        />
      )}
    </div>
  );
}

function NewCashAdvanceModal({ employee, onClose, onSave }) {
  const { formatCurrency } = useSettings();
  const [form, setForm] = useState({ amount: "", interest_rate: "0", installment_amount: "", start_date: "", purpose: "" });

  const amount      = parseFloat(form.amount) || 0;
  const interest    = parseFloat(form.interest_rate) || 0;
  const totalAmount = amount + (amount * interest / 100);
  const installment = parseFloat(form.installment_amount) || 0;
  const periods     = installment > 0 ? Math.ceil(totalAmount / installment) : 0;

  const handleSubmit = () => {
    if (!form.amount || amount <= 0) return Swal.fire({ icon: "warning", title: "Enter a valid amount" });
    if (amount > MAX_AMOUNT) return Swal.fire({ icon: "warning", title: `Maximum amount is ${formatCurrency(MAX_AMOUNT)}` });
    if (!form.installment_amount || installment <= 0) return Swal.fire({ icon: "warning", title: "Enter installment amount per payroll" });
    if (!form.start_date) return Swal.fire({ icon: "warning", title: "Select a start date" });
    onSave(form);
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">New Cash Advance — {employee.fullname}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="alert alert-info py-2 mb-3" style={{ fontSize: "13px" }}>
              Maximum: <strong>{formatCurrency(MAX_AMOUNT)}</strong> — auto-deducted each payroll run.
            </div>
            <div className="row g-3">
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
                <label className="form-label fw-semibold">Start Date</label>
                <input type="date" className="form-control" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Purpose</label>
                <input type="text" className="form-control" placeholder="e.g. Medical, Personal" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
              </div>
            </div>
            {amount > 0 && installment > 0 && (
              <div className="mt-3 p-3 rounded" style={{ backgroundColor: "#f8f9fa", border: "1px solid #dee2e6", fontSize: "13px" }}>
                <div className="fw-semibold mb-2">Summary</div>
                <div className="row g-1">
                  <div className="col-6">Principal: <strong>{formatCurrency(amount)}</strong></div>
                  <div className="col-6">Interest: <strong>{formatCurrency(amount * interest / 100)}</strong></div>
                  <div className="col-6">Total to Repay: <strong style={{ color: "#dc3545" }}>{formatCurrency(totalAmount)}</strong></div>
                  <div className="col-6">Payroll Deductions: <strong>{periods} run(s)</strong></div>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-danger" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>Submit Request</button>
          </div>
        </div>
      </div>
    </div>
  );
}