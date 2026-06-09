import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";
import { useSettings } from "../../contexts/SettingsContext";
import { MdSearch, MdArrowBack, MdArrowForward, MdCheckCircle, MdAssignment, MdPending, MdAttachMoney } from "react-icons/md";

export default function RunPayroll() {
  const navigate           = useNavigate();
  const { formatCurrency } = useSettings();
  const queryClient        = useQueryClient();

  const [step,              setStep]              = useState(1);
  const [loading,           setLoading]           = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [searchTerm,        setSearchTerm]        = useState("");
  const [formData,          setFormData]          = useState({
    pay_period_start: "",
    pay_period_end:   "",
    payment_date:     "",
    pay_type:         "Monthly",
  });

  // ── Employees — reuses hrms_all_employees shared cache ───────────────────
  const { data: employeeList = [], isLoading: loadingEmps } = useQuery({
    queryKey:  ["hrms_all_employees"],
    queryFn:   () => baseApi.get("/api/hrms/employees").then((r) => {
      const data = r.data?.data || (Array.isArray(r.data) ? r.data : []);
      return data;
    }),
    staleTime: 5 * 60 * 1000,
  });

  // Auto-select all employees once on first load — replaces deprecated onSuccess
  // Guard: only runs when employeeList first populates AND nothing is selected yet
  useEffect(() => {
    if (employeeList.length > 0 && selectedEmployees.length === 0) {
      setSelectedEmployees(employeeList.map((emp) => emp.biometric_id));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeList]);
  // Note: selectedEmployees intentionally excluded from deps —
  // we only want this to fire on the first load, not every time the user
  // toggles a checkbox (which would re-select all employees)

  // ── Payroll stats — reuses payroll_stats cache shared with Payroll.jsx ───
  const { data: statsData } = useQuery({
    queryKey:  ["payroll_stats"],
    queryFn:   () => baseApi.get("/api/payroll/dashboard-stats").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const stats = {
    totalRuns:       statsData?.totalRuns       || 0,
    pendingRuns:     statsData?.pendingRuns     || 0,
    completedAmount: statsData?.completedAmount || 0,
  };

  const filteredEmployees = employeeList.filter((emp) => {
    const name = emp.fullname || `${emp.first_name ?? ""} ${emp.last_name ?? ""}`;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleToggleEmployee = (biometric_id) => {
    setSelectedEmployees((prev) =>
      prev.includes(biometric_id) ? prev.filter((id) => id !== biometric_id) : [...prev, biometric_id]
    );
  };

  const handleSelectAll = () => {
    setSelectedEmployees(
      selectedEmployees.length === filteredEmployees.length
        ? []
        : filteredEmployees.map((emp) => emp.biometric_id)
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.pay_period_start || !formData.pay_period_end || !formData.payment_date) {
        Swal.fire({ icon: "warning", title: "Missing Information", text: "Please fill in all date fields", confirmButtonColor: "#ffc107" });
        return;
      }
      if (formData.pay_period_start > formData.pay_period_end) {
        Swal.fire({ icon: "warning", title: "Invalid Dates", text: "End date must be after start date", confirmButtonColor: "#ffc107" });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (selectedEmployees.length === 0) {
        Swal.fire({ icon: "warning", title: "No Employees Selected", text: "Please select at least one employee", confirmButtonColor: "#ffc107" });
        return;
      }
      setStep(3);
    }
  };

  const handleRunPayroll = async () => {
    try {
      setLoading(true);
      const res = await baseApi.post("/api/payroll/run", {
        pay_period_start: formData.pay_period_start,
        pay_period_end:   formData.pay_period_end,
        payment_date:     formData.payment_date,
        pay_type:         formData.pay_type,
        employee_ids:     selectedEmployees,
      });

      if (!res.data || res.data.records === 0) {
        const errorList = res.data?.errors || [];
        Swal.fire({
          icon: "warning", title: "No Payroll Created",
          html: `<pre style="text-align: left; font-size: 12px;">${errorList.join("\n") || "No payroll records were generated."}</pre>`,
          confirmButtonColor: "#f57c00",
        });
        return;
      }

      if (res.data.errors?.length > 0) {
        await Swal.fire({
          icon: "info", title: "Payroll Created with Warnings",
          html: `<strong>${res.data.records} records created</strong><br/><br/><pre style="text-align: left; font-size: 12px;">${res.data.errors.join("\n")}</pre>`,
          confirmButtonColor: "#28a745",
        });
      } else {
        await Swal.fire({
          icon: "success", title: "Success!",
          text: `${res.data.records} payroll records created successfully!`,
          confirmButtonColor: "#28a745",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["payroll_stats"] });
      navigate("/payroll");
    } catch (err) {
      let errorMessage = "Failed to process payroll.";
      if (err.response?.data) {
        if (err.response.data.errors)       errorMessage = Object.values(err.response.data.errors).flat().join("\n");
        else if (err.response.data.message) errorMessage = err.response.data.message;
        else if (err.response.data.error)   errorMessage = err.response.data.error;
      }
      Swal.fire({
        icon: "error", title: "Failed",
        html: `<pre style="text-align: left; font-size: 12px; white-space: pre-wrap;">${errorMessage}</pre>`,
        confirmButtonColor: "#d33",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 style={{ fontWeight: "bold", fontSize: "clamp(20px, 5vw, 28px)", marginBottom: "8px" }}>Run Payroll</h1>
            <p className="text-muted mb-0">Step {step} of 3</p>
          </div>
          <button className="btn btn-outline-danger" onClick={() => navigate("/payroll")}>
            <MdArrowBack className="me-2" />Back to Payroll
          </button>
        </div>

        {/* Stats */}
        <div className="row g-3 mb-4">
          {[
            { label: "Total Payroll Runs", value: stats.totalRuns,                    bg: "#e3f2fd", color: "#1976d2", icon: <MdAssignment size={24} color="#1976d2" /> },
            { label: "Pending Runs",       value: stats.pendingRuns,                  bg: "#fff3e0", color: "#f57c00", icon: <MdPending    size={24} color="#f57c00" /> },
            { label: "Completed Amount",   value: formatCurrency(stats.completedAmount), bg: "#e8f5e9", color: "#388e3c", icon: <MdAttachMoney size={24} color="#388e3c" /> },
          ].map((c) => (
            <div key={c.label} className="col-md-4">
              <div className="card" style={{ borderRadius: "12px" }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle p-3 me-3" style={{ backgroundColor: c.bg }}>{c.icon}</div>
                    <div>
                      <div className="text-muted small">{c.label}</div>
                      <h3 className="mb-0 fw-bold">{c.value}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="card mb-4" style={{ borderRadius: "12px" }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center">
              <StepIndicator number={1} label="Pay Period"       active={step === 1} completed={step > 1} />
              <div style={{ flex: 1, height: "2px", backgroundColor: step > 1 ? "#28a745" : "#dee2e6", margin: "0 20px" }} />
              <StepIndicator number={2} label="Select Employees" active={step === 2} completed={step > 2} />
              <div style={{ flex: 1, height: "2px", backgroundColor: step > 2 ? "#28a745" : "#dee2e6", margin: "0 20px" }} />
              <StepIndicator number={3} label="Review & Confirm" active={step === 3} completed={false} />
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="row">
          <div className="col-12">

            {/* Step 1 */}
            {step === 1 && (
              <div className="card" style={{ borderRadius: "12px" }}>
                <div className="card-body p-4 p-md-5">
                  <h4 className="mb-4 fw-bold">Select Pay Period</h4>
                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <label className="form-label fw-semibold">Pay Type</label>
                      <select className="form-select form-select-lg" name="pay_type" value={formData.pay_type} onChange={handleChange}>
                        <option value="Monthly">Monthly</option>
                        <option value="Semi-Monthly">Semi-Monthly</option>
                        <option value="Bi-Weekly">Bi-Weekly</option>
                        <option value="Weekly">Weekly</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <label className="form-label fw-semibold">Pay Period Start Date</label>
                      <input type="date" className="form-control form-control-lg" name="pay_period_start" value={formData.pay_period_start} onChange={handleChange} />
                    </div>
                    <div className="col-md-6 mb-4">
                      <label className="form-label fw-semibold">Pay Period End Date</label>
                      <input type="date" className="form-control form-control-lg" name="pay_period_end" value={formData.pay_period_end} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <label className="form-label fw-semibold">Payment Date</label>
                      <input type="date" className="form-control form-control-lg" name="payment_date" value={formData.payment_date} onChange={handleChange} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="card" style={{ borderRadius: "12px" }}>
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="mb-0 fw-bold">Select Employees</h4>
                    <button className="btn btn-outline-primary" onClick={handleSelectAll}>
                      {selectedEmployees.length === filteredEmployees.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="position-relative mb-4">
                    <MdSearch style={{ position: "absolute", top: "50%", left: "12px", transform: "translateY(-50%)", color: "#6c757d", fontSize: "20px" }} />
                    <input type="text" className="form-control form-control-lg ps-5" placeholder="Search employees by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  {loadingEmps ? (
                    <div className="text-center py-4"><div className="spinner-border text-primary" role="status" /></div>
                  ) : (
                    <div className="row g-3" style={{ maxHeight: "500px", overflowY: "auto" }}>
                      {filteredEmployees.map((emp) => (
                        <div key={emp.biometric_id} className="col-md-6 col-lg-4">
                          <div
                            className="card h-100"
                            style={{ cursor: "pointer", borderColor: selectedEmployees.includes(emp.biometric_id) ? "#0d6efd" : "#dee2e6", backgroundColor: selectedEmployees.includes(emp.biometric_id) ? "#e7f3ff" : "white", transition: "all 0.2s" }}
                            onClick={() => handleToggleEmployee(emp.biometric_id)}
                          >
                            <div className="card-body">
                              <div className="form-check">
                                <input className="form-check-input" type="checkbox" readOnly checked={selectedEmployees.includes(emp.biometric_id)} />
                                <label className="form-check-label ms-2">
                                  <strong>{emp.fullname || `${emp.first_name} ${emp.last_name}`}</strong>
                                  <div style={{ fontSize: "13px", color: "#6c757d" }}>{emp.biometric_id}</div>
                                  <div style={{ fontSize: "13px", color: "#6c757d" }}>{emp.department || "N/A"}</div>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 p-3 bg-light rounded">
                    <strong>Selected:</strong> {selectedEmployees.length} / {filteredEmployees.length} employees
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="row g-4">
                <div className="col-lg-6">
                  <div className="card h-100" style={{ borderRadius: "12px" }}>
                    <div className="card-header bg-primary text-white"><h5 className="mb-0">Payroll Details</h5></div>
                    <div className="card-body p-4">
                      <div className="mb-3"><small className="text-muted">Pay Type</small><div className="fs-5 fw-semibold">{formData.pay_type}</div></div>
                      <div className="mb-3"><small className="text-muted">Pay Period</small><div className="fs-5 fw-semibold">{formData.pay_period_start} to {formData.pay_period_end}</div></div>
                      <div className="mb-3"><small className="text-muted">Payment Date</small><div className="fs-5 fw-semibold">{formData.payment_date}</div></div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="card h-100" style={{ borderRadius: "12px" }}>
                    <div className="card-header bg-success text-white"><h5 className="mb-0">Selected Employees ({selectedEmployees.length})</h5></div>
                    <div className="card-body p-4" style={{ maxHeight: "400px", overflowY: "auto" }}>
                      {employeeList
                        .filter((emp) => selectedEmployees.includes(emp.biometric_id))
                        .map((emp) => (
                          <div key={emp.biometric_id} className="d-flex justify-content-between p-3 mb-2 border-bottom">
                            <div>
                              <div className="fw-semibold">{emp.fullname || `${emp.first_name} ${emp.last_name}`}</div>
                              <small className="text-muted">{emp.biometric_id}</small>
                            </div>
                            <div className="text-end"><small className="text-muted">{emp.department}</small></div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="alert alert-warning">
                    <strong>⚠️ Important:</strong> This will generate payroll records for all selected employees. Make sure all attendance records and deductions are up to date.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="d-flex justify-content-between mt-4 mb-5">
          <button
            className="btn btn-lg btn-outline-danger"
            onClick={step === 1 ? () => navigate("/payroll") : () => setStep((p) => p - 1)}
            disabled={loading}
          >
            <MdArrowBack className="me-2" />{step === 1 ? "Cancel" : "Back"}
          </button>
          {step < 3 ? (
            <button className="btn btn-lg btn-primary" onClick={handleNext} disabled={loading} style={{ minWidth: "150px" }}>
              Next <MdArrowForward className="ms-2" />
            </button>
          ) : (
            <button className="btn btn-lg btn-success" onClick={handleRunPayroll} disabled={loading} style={{ minWidth: "150px" }}>
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2" />Processing...</>
                : <><MdCheckCircle className="me-2" />Run Payroll</>
              }
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}

function StepIndicator({ number, label, active, completed }) {
  return (
    <div className="d-flex flex-column align-items-center" style={{ minWidth: "120px" }}>
      <div style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: completed ? "#28a745" : active ? "#0d6efd" : "#dee2e6", color: completed || active ? "white" : "#6c757d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "bold", marginBottom: "10px" }}>
        {completed ? <MdCheckCircle size={30} /> : number}
      </div>
      <div style={{ fontSize: "14px", fontWeight: active ? "600" : "normal", color: active ? "#0d6efd" : "#6c757d", textAlign: "center" }}>{label}</div>
    </div>
  );
}