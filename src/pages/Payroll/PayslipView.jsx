import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import baseApi from "../../api/baseApi";
import Layout from "../../components/layouts/DashboardLayout";
import { MdArrowBack, MdDownload } from "react-icons/md";
import { useSettings } from "../../contexts/SettingsContext";

export default function PayslipView() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { formatCurrency, formatDate } = useSettings();

  // ── Single payslip — cached 5 min per ID ─────────────────────────────────
  const { data: payslip, isLoading: loading } = useQuery({
    queryKey:  ["payroll_payslip", id],
    queryFn:   () => baseApi.get(`/api/payroll/payslip/${id}`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    enabled:   !!id,
  });

  const formatNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
        </div>
      </Layout>
    );
  }

  if (!payslip) {
    return <Layout><div className="alert alert-danger">Payslip not found</div></Layout>;
  }

  const payroll  = payslip.payroll;
  const employee = payslip.employee;

  if (!payroll || !employee) {
    return <Layout><div className="alert alert-danger">Payslip data is incomplete. Missing payroll or employee information.</div></Layout>;
  }

  const department    = employee?.employment_information?.department?.name || employee?.employmentInformation?.department?.name || "N/A";
  const basicPay      = parseFloat(payroll.gross_pay || 0) - parseFloat(payroll.overtime_pay || 0) - parseFloat(payroll.leave_pay || 0);
  const leaveDays     = parseFloat(payroll.leave_days   || 0);
  const leavePay      = parseFloat(payroll.leave_pay    || 0);
  const otHours       = parseFloat(payroll.overtime_hours || 0);
  const otPay         = parseFloat(payroll.overtime_pay  || 0);
  const lwop          = parseFloat(payroll.lwop          || 0);
  const cashAdvDeduct = parseFloat(payroll.cash_advance_deduction || 0);
  const lateDeduct    = parseFloat(payroll.late_deduction || 0);

  return (
    <Layout>
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="fw-bold mb-0">Payslip Details</h3>
          <div className="d-flex gap-2">
            {payslip.pdf_path && (
              <button className="btn btn-primary" onClick={() => window.open(`${import.meta.env.VITE_API_URL}/storage/${payslip.pdf_path}`, "_blank")}>
                <MdDownload className="me-2" />Download PDF
              </button>
            )}
            <button className="btn btn-danger" onClick={() => navigate(-1)}>
              <MdArrowBack className="me-2" />Back
            </button>
          </div>
        </div>

        <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
          <div className="card-body p-5">
            <div className="text-center mb-5 pb-4 border-bottom">
              <h2 className="fw-bold mb-2">CAMP ADMINISTRATION LIMITED</h2>
              <h4 className="text-muted">EMPLOYEE PAYSLIP</h4>
            </div>

            <div className="row mb-4">
              <div className="col-md-6">
                <table className="table table-borderless">
                  <tbody>
                    <tr><td className="fw-bold" style={{ width: "180px" }}>Employee Name:</td><td>{employee.first_name} {employee.last_name}</td></tr>
                    <tr><td className="fw-bold">Employee ID:</td><td>{employee.biometric_id}</td></tr>
                    <tr><td className="fw-bold">Department:</td><td>{department}</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <table className="table table-borderless">
                  <tbody>
                    <tr><td className="fw-bold" style={{ width: "180px" }}>Pay Period:</td><td>{formatDate(payroll.pay_period_start)} – {formatDate(payroll.pay_period_end)}</td></tr>
                    <tr><td className="fw-bold">Payment Date:</td><td>{formatDate(payroll.payment_date)}</td></tr>
                    <tr><td className="fw-bold">Pay Type:</td><td>{payroll.pay_type}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h5 className="fw-bold mb-3">Earnings</h5>
            <div className="table-responsive mb-4">
              <table className="table table-bordered">
                <thead className="table-light"><tr><th>Description</th><th className="text-end">Amount</th></tr></thead>
                <tbody>
                  <tr><td>Basic Pay ({payroll.days_worked || 0} days × 12 hrs/day)</td><td className="text-end">{formatCurrency(basicPay)}</td></tr>
                  {leaveDays > 0 && <tr><td>Leave Pay ({formatNumber(leaveDays)} day(s) × 8 hrs)</td><td className="text-end">{formatCurrency(leavePay)}</td></tr>}
                  {otHours   > 0 && <tr><td>Overtime Pay ({formatNumber(otHours)} hrs)</td><td className="text-end">{formatCurrency(otPay)}</td></tr>}
                  {parseFloat(payroll.bonuses || 0) > 0 && <tr><td>Bonuses</td><td className="text-end">{formatCurrency(payroll.bonuses)}</td></tr>}
                  <tr className="table-secondary fw-bold"><td>GROSS PAY</td><td className="text-end">{formatCurrency(payroll.gross_pay)}</td></tr>
                </tbody>
              </table>
            </div>

            <h5 className="fw-bold mb-3">Deductions</h5>
            <div className="table-responsive mb-4">
              <table className="table table-bordered">
                <thead className="table-light"><tr><th>Description</th><th className="text-end">Amount</th></tr></thead>
                <tbody>
                  <tr><td>Tax (10%)</td><td className="text-end text-danger">-{formatCurrency(payroll.tax)}</td></tr>
                  {parseFloat(payroll.nasfund || 0) > 0 && <tr><td>NASFUND (6%)</td><td className="text-end text-danger">-{formatCurrency(payroll.nasfund)}</td></tr>}
                  {lateDeduct    > 0 && <tr><td>Late Deduction</td><td className="text-end text-danger">-{formatCurrency(lateDeduct)}</td></tr>}
                  {lwop          > 0 && <tr><td>LWOP — Leave Without Pay ({payroll.days_absent} absent day(s))</td><td className="text-end text-danger">-{formatCurrency(lwop)}</td></tr>}
                  {cashAdvDeduct > 0 && <tr><td>Cash Advance Deduction</td><td className="text-end text-danger">-{formatCurrency(cashAdvDeduct)}</td></tr>}
                  <tr className="table-secondary fw-bold"><td>TOTAL DEDUCTIONS</td><td className="text-end text-danger">-{formatCurrency(payroll.deductions)}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="table-responsive mb-4">
              <table className="table table-bordered">
                <tbody>
                  <tr className="table-success">
                    <td className="fw-bold fs-5">NET PAY</td>
                    <td className="text-end fw-bold fs-4 text-success">{formatCurrency(payslip.net_pay)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h5 className="fw-bold mb-3">Attendance Summary</h5>
            <div className="row mb-4">
              {[
                { label: "Days Worked",        value: payroll.days_worked  || 0 },
                { label: "Days Absent (LWOP)", value: payroll.days_absent  || 0 },
                { label: "Days Late",          value: payroll.days_late    || 0 },
                { label: "Leave Days (Paid)",  value: formatNumber(payroll.leave_days) },
                { label: "Regular Hours",      value: `${formatNumber(payroll.total_hours)} hrs` },
                { label: "Overtime Hours",     value: `${formatNumber(payroll.overtime_hours)} hrs` },
              ].map((item) => (
                <div key={item.label} className="col-md-4 mb-3">
                  <div className="card bg-light">
                    <div className="card-body text-center py-3">
                      <div className="text-muted small">{item.label}</div>
                      <h4 className="fw-bold mb-0">{item.value}</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center text-muted mt-5 pt-4 border-top">
              <p className="mb-1">This is a computer-generated payslip. No signature is required.</p>
              <p className="mb-0 small">Generated on {formatDate(payslip.generated_at)}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}