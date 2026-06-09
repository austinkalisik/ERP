import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import baseApi from "../../api/baseApi";
import Layout from "../../components/layouts/DashboardLayout";
import EmployeeEditModal      from "../../components/modals/EmployeeEditModal";
import PersonalInfoEditModal  from "../../components/modals/PersonalInfoEditModal";
import AddLeaveCreditModal    from "../../components/modals/AddLeaveCreditModal";
import DeminimisModal         from "../../components/modals/DeminimisModal";
import Swal from "sweetalert2";
import AttendanceTab          from "./EmployeeAttendance";
import ApplicationFormsTab    from "./EmployeeApplicationForm";
import EmployeePayslips       from "./EmployeePayslips";
import EmployeeCashAdvances   from "./EmployeeCashAdvances";
import { useAuth }            from "../../contexts/AuthContext";
import { can }                from "../../utils/permissions";
import { useSettings }        from "../../contexts/SettingsContext";

import { FaUserCircle }  from "react-icons/fa";
import { MdBusiness, MdPerson, MdGroup, MdLocationOn, MdEmail, MdPhone } from "react-icons/md";

export default function EmployeeDetails() {
  const { biometric_id }   = useParams();
  const navigate           = useNavigate();
  const queryClient        = useQueryClient();
  const { permissions }    = useAuth();
  const { formatCurrency } = useSettings();

  const [activeTab,           setActiveTab]           = useState("employment");
  const [benefitsTab,         setBenefitsTab]         = useState("leave");
  const [showEditModal,       setShowEditModal]       = useState(false);
  const [showPersonalModal,   setShowPersonalModal]   = useState(false);
  const [showAddCreditModal,  setShowAddCreditModal]  = useState(false);
  const [showDeminimisModal,  setShowDeminimisModal]  = useState(false);

  // ── Employee data — cached 5 min per biometric_id ─────────────────────────
  // onError removed (deprecated in RQ v5) — error handled via .catch in queryFn
  const { data: employee, isLoading } = useQuery({
    queryKey:  ["hrms_employee", biometric_id],
    queryFn:   () =>
      baseApi.get(`/api/hrms/employee/${biometric_id}`)
        .then((r) => r.data)
        .catch(() => {
          Swal.fire({ icon: "error", title: "Error", text: "Failed to load employee details", confirmButtonColor: "#d33" });
          return null;
        }),
    staleTime: 5 * 60 * 1000,
    enabled:   !!biometric_id,
  });

  // ── Leave credits — cached 2 min ─────────────────────────────────────────
  const leaveCacheKey = ["hrms_employee_leave_credits", biometric_id];
  const { data: leaveCredits = [] } = useQuery({
    queryKey:  leaveCacheKey,
    queryFn:   () => baseApi.get(`/api/hrms/employee/${biometric_id}/leave-credits`).then((r) => r.data || []),
    staleTime: 2 * 60 * 1000,
    enabled:   !!biometric_id,
  });

  // ── Deminimis — cached 5 min, only when employee.id is known ─────────────
  const deminimisCacheKey = ["hrms_deminimis", employee?.id];
  const { data: deminimisAllowances = [] } = useQuery({
    queryKey:  deminimisCacheKey,
    queryFn:   () => baseApi.get(`/api/hrms/deminimis/employee/${employee.id}`).then((r) => r.data || []),
    staleTime: 5 * 60 * 1000,
    enabled:   !!employee?.id,
  });

  const refetchEmployee  = () => queryClient.invalidateQueries({ queryKey: ["hrms_employee",              biometric_id] });
  const refetchLeave     = () => queryClient.invalidateQueries({ queryKey: leaveCacheKey });
  const refetchDeminimis = () => queryClient.invalidateQueries({ queryKey: deminimisCacheKey });

  // ── Save handlers ─────────────────────────────────────────────────────────
  const handleSaveEmployee = async (formData) => {
    try {
      await baseApi.post(`/api/hrms/employee/${biometric_id}/update-profile`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      refetchEmployee();
      setShowEditModal(false);
      Swal.fire({ icon: "success", title: "Success!", text: "Employee information updated!", confirmButtonColor: "#28a745" });
    } catch {
      Swal.fire({ icon: "error", title: "Update Failed", text: "Failed to update employee information.", confirmButtonColor: "#d33" });
    }
  };

  const handleSavePersonalInfo = async (formData) => {
    const personalInfoId = employee?.personal_info?.id;
    if (!personalInfoId) {
      Swal.fire({ icon: "error", title: "Missing Information", text: "Cannot update personal info — ID is missing.", confirmButtonColor: "#d33" });
      return;
    }
    try {
      await baseApi.put(`/api/hrms/personal/${personalInfoId}`, formData);
      refetchEmployee();
      setShowPersonalModal(false);
      Swal.fire({ icon: "success", title: "Success!", text: "Personal information updated!", confirmButtonColor: "#28a745" });
    } catch {
      Swal.fire({ icon: "error", title: "Update Failed", text: "Failed to update personal information.", confirmButtonColor: "#d33" });
    }
  };

  const handleDeleteDeminimis = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Allowance?", text: "This action cannot be undone.", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#0d6efd", cancelButtonColor: "#dc3545", confirmButtonText: "Yes, delete",
    });
    if (!confirm.isConfirmed) return;
    try {
      await baseApi.delete(`/api/hrms/deminimis/${id}`);
      Swal.fire("Deleted!", "Allowance removed successfully.", "success");
      refetchDeminimis();
    } catch {
      Swal.fire("Error", "Failed to delete allowance.", "error");
    }
  };

  const handleExportCV = () => {
    window.open(`${import.meta.env.VITE_API_URL}/api/hrms/employee/${biometric_id}/export-cv`, "_blank");
  };

  const formatDate = (date) => { if (!date) return "N/A"; return date.split("T")[0]; };

  if (isLoading || !employee) {
    return (
      <Layout>
        <div className="text-center py-5">
          <div className="spinner-border text-dark" role="status"><span className="visually-hidden">Loading...</span></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold mb-0">List of Employees</h3>
        <button className="btn-close" onClick={() => navigate("/hrms/employee-overview")}></button>
      </div>

      <ul className="nav nav-tabs mb-4">
        <TabButton label="Employment Info"   active={activeTab === "employment"}    onClick={() => setActiveTab("employment")} />
        <TabButton label="Personal Info"     active={activeTab === "personal"}      onClick={() => setActiveTab("personal")} />
        <TabButton label="Attendance"        active={activeTab === "attendance"}    onClick={() => setActiveTab("attendance")} />
        <TabButton label="Application Forms" active={activeTab === "applications"}  onClick={() => setActiveTab("applications")} />
        <TabButton label="Payslips"          active={activeTab === "payslips"}      onClick={() => setActiveTab("payslips")} />
        <TabButton label="Cash Advances"     active={activeTab === "cash_advances"} onClick={() => setActiveTab("cash_advances")} />
      </ul>

      {/* ── Employment Info ─────────────────────────────────────────────────── */}
      {activeTab === "employment" && (
        <div className="row g-4">
          <div className="col-12 d-flex justify-content-end mb-2">
            <button className="btn btn-primary px-4 py-2" style={{ fontSize: "15px", fontWeight: 600, borderRadius: "8px" }} onClick={handleExportCV}>Export CV</button>
          </div>

          <div className="col-lg-5">
            <div className="card mb-4" style={{ borderRadius: "12px", borderTop: "3px solid #ffe680", backgroundColor: "white" }}>
              <div className="card-body text-center py-5">
                <div style={{ width: "120px", height: "120px", borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", backgroundColor: "#e0e0e0" }}>
                  {employee.profile_picture ? <img src={employee.profile_picture} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <FaUserCircle size={100} color="#555" />}
                </div>
                <h3 className="mt-4 mb-2">{employee.fullname}</h3>
                <p className="text-muted" style={{ fontSize: "14px" }}>{employee.biometric_id}</p>
              </div>
            </div>
            <div className="card" style={{ borderRadius: "12px", backgroundColor: "white", overflow: "hidden" }}>
              <div style={{ backgroundColor: "#0d6efd", padding: "12px 20px" }}>
                <h5 className="mb-0 fw-bold text-white">Details</h5>
              </div>
              <div className="card-body p-4">
                <DetailItem icon={<MdBusiness size={18} color="#0d6efd" />}   label="Department"           value={employee.department} />
                <DetailItem icon={<MdPerson size={18} color="#0d6efd" />}     label="Department Head"      value={employee.department_head} />
                <DetailItem icon={<MdGroup size={18} color="#0d6efd" />}      label="Immediate Supervisor" value={employee.supervisor} />
                <DetailItem icon={<MdLocationOn size={18} color="#0d6efd" />} label="Job Location"         value={employee.job_location} />
                <DetailItem icon={<MdEmail size={18} color="#0d6efd" />}      label="Company Email"        value={employee.company_email} />
                <DetailItem icon={<MdPhone size={18} color="#0d6efd" />}      label="Contact Number"       value={employee.mobile_number} />
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="card mb-4" style={{ borderRadius: "12px", backgroundColor: "white", borderTop: "3px solid #ffe680" }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0 fw-bold">Employment Information</h5>
                  {can(permissions, "employee.update") && (
                    <button className="btn btn-warning btn-sm px-3" style={{ color: "white" }} onClick={() => setShowEditModal(true)}>Edit</button>
                  )}
                </div>
                <div className="row g-3 mb-4">
                  <InfoField label="Employment Status:" value={employee.employment_classification || "N/A"} />
                  <InfoField label="Salary Type:"       value={employee.rate_type} />
                  <InfoField label="Rate:"              value={formatCurrency(employee.rate)} />
                  <InfoField label="Date Started:"      value={formatDate(employee.date_started)} />
                  <InfoField label="Date Ended:"        value={formatDate(employee.date_ended)} />
                  <InfoField label="Shift:"             value={employee.shift?.shift_name || "N/A"} />
                </div>
                <hr />
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0 fw-bold">Account Information</h5>
                </div>
                <div className="row g-3 mb-4">
                  <InfoField label="Nasfund Number:"          value={employee.nasfund_number || "N/A"} />
                  <InfoField label="TIN Number:"              value={employee.tin_number || "N/A"} />
                  <InfoField label="Work Permit Number:"      value={employee.work_permit_number || "N/A"} />
                  <InfoField label="Work Permit Expiry Date:" value={formatDate(employee.work_permit_expiry)} />
                  <InfoField label="Visa Number:"             value={employee.visa_number || "N/A"} />
                  <InfoField label="Visa Expiry Date:"        value={formatDate(employee.visa_expiry)} />
                </div>
                <hr />
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0 fw-bold">Bank Information</h5>
                </div>
                <div className="row g-3">
                  <InfoField label="Account Number:" value={employee.account_number || "N/A"} />
                  <InfoField label="Bank Name:"      value={employee.bank_name || "N/A"} />
                  <InfoField label="Account Name:"   value={employee.account_name || "N/A"} />
                  <InfoField label="Branch:"         value={employee.bsb_code || "N/A"} />
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="card" style={{ borderRadius: "12px", backgroundColor: "white", borderTop: "3px solid #ffe680" }}>
              <div className="card-body p-4">
                <h5 className="mb-4 fw-bold">Benefits Information</h5>
                <div className="d-flex mb-4">
                  <BenefitsTabButton label="Leave Credits" active={benefitsTab === "leave"}     onClick={() => setBenefitsTab("leave")} />
                  <BenefitsTabButton label="Deminimis"     active={benefitsTab === "deminimis"} onClick={() => setBenefitsTab("deminimis")} />
                </div>

                {benefitsTab === "leave" && (
                  <>
                    {can(permissions, "leave.manage") && (
                      <div className="d-flex justify-content-end mb-3">
                        <button className="btn btn-success btn-sm px-4" onClick={() => setShowAddCreditModal(true)}>Add Credit</button>
                      </div>
                    )}
                    <div className="table-responsive">
                      <table className="table table-bordered bg-white">
                        <thead className="bg-light">
                          <tr>
                            <th>Leave Type</th><th>Year</th><th>Total Credits</th><th>Used</th><th>Remaining</th>
                            {can(permissions, "leave.manage") && <th>Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {leaveCredits.length === 0 ? (
                            <tr><td colSpan={can(permissions, "leave.manage") ? "6" : "5"} className="text-center text-muted">No leave credits found</td></tr>
                          ) : leaveCredits.map((credit) => (
                            <tr key={credit.id}>
                              <td><span className="badge bg-primary me-2" style={{ fontSize: 11 }}>{credit.leave_code}</span>{credit.leave_type}</td>
                              <td>{credit.year || "—"}</td>
                              <td>{parseFloat(credit.total_days).toFixed(2)}</td>
                              <td>{parseFloat(credit.used_days).toFixed(2)}</td>
                              <td>{parseFloat(credit.remaining_days).toFixed(2)}</td>
                              {can(permissions, "leave.manage") && (
                                <td><button className="btn btn-sm btn-warning px-3" style={{ color: "white" }} onClick={() => setShowAddCreditModal(true)}>Edit</button></td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {benefitsTab === "deminimis" && (
                  <>
                    {can(permissions, "leave.manage") && (
                      <div className="d-flex justify-content-end mb-3">
                        <button className="btn btn-success btn-sm px-4" onClick={() => setShowDeminimisModal(true)}>Add Allowance</button>
                      </div>
                    )}
                    <div className="table-responsive">
                      <table className="table table-bordered bg-white">
                        <thead className="bg-light">
                          <tr>
                            <th>Allowance Type</th><th>Amount</th>
                            {can(permissions, "leave.manage") && <th>Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {deminimisAllowances.length === 0 ? (
                            <tr><td colSpan={can(permissions, "leave.manage") ? "3" : "2"} className="text-center text-muted">No allowances found</td></tr>
                          ) : deminimisAllowances.map((allowance) => (
                            <tr key={allowance.id}>
                              <td>{allowance.type}</td>
                              <td>{formatCurrency(allowance.amount)}</td>
                              {can(permissions, "leave.manage") && (
                                <td><button className="btn btn-sm btn-danger px-3" onClick={() => handleDeleteDeminimis(allowance.id)}>Delete</button></td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Personal Info ───────────────────────────────────────────────────── */}
      {activeTab === "personal" && (
        <div className="card" style={{ borderRadius: "12px", backgroundColor: "white", borderTop: "3px solid #ffe680" }}>
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0 fw-bold">Personal Information</h5>
              {can(permissions, "employee.update") && (
                <button className="btn btn-warning btn-sm px-3" style={{ color: "white" }} onClick={() => setShowPersonalModal(true)}>Edit</button>
              )}
            </div>
            <div className="row g-3 mb-4">
              <InfoField label="Birthdate:"             value={formatDate(employee.birthdate)} />
              <InfoField label="Age:"                   value={employee.age || "N/A"} />
              <InfoField label="Birth Place:"           value={employee.birthplace || "N/A"} />
              <InfoField label="Nationality:"           value={employee.nationality || "N/A"} />
              <InfoField label="Civil Status:"          value={employee.civil_status || "N/A"} />
              <InfoField label="Religion:"              value={employee.religion || "N/A"} />
              <InfoField label="Gender:"                value={employee.gender || "N/A"} />
              <InfoField label="Email:"                 value={employee.email_address || "N/A"} />
              <InfoField label="Mobile:"                value={employee.mobile_number || "N/A"} />
              <InfoField label="Dependents:"            value={employee.dependents ?? "0"} />
              {/* Tax Declaration Type — used for payroll withholding tax bracket lookup */}
              <InfoField
                label="Tax Declaration Type:"
                value={employee.tax_type || employee.personal_info?.tax_type || "No Declaration"}
              />
              <InfoField label="Lodged:"                value={employee.lodged || "N/A"} />
            </div>
            <h6 className="fw-bold mb-3">Address Information</h6>
            <div className="row g-3 mb-4">
              <div className="col-12">
                <div className="text-muted" style={{ fontSize: "13px" }}>Present Address:</div>
                <div style={{ fontSize: "14px" }}>{employee.present_address || "N/A"}</div>
              </div>
              <div className="col-12">
                <div className="text-muted" style={{ fontSize: "13px" }}>Home Address:</div>
                <div style={{ fontSize: "14px" }}>{employee.home_address || "N/A"}</div>
              </div>
            </div>
            <h6 className="fw-bold mb-3">Emergency Contact</h6>
            <div className="row g-3">
              <InfoField label="Contact Person:" value={employee.emergency_contact || "N/A"} />
              <InfoField label="Contact Number:" value={employee.emergency_number  || "N/A"} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "attendance"    && <AttendanceTab       employee={employee} permissions={permissions} />}
      {activeTab === "applications"  && <ApplicationFormsTab employee={employee} onApplicationUpdated={refetchLeave} />}
      {activeTab === "payslips"      && employee?.biometric_id && <EmployeePayslips employee={employee} />}
      {activeTab === "cash_advances" && <EmployeeCashAdvances employee={employee} permissions={permissions} />}

      <EmployeeEditModal     show={showEditModal}      onHide={() => setShowEditModal(false)}      employee={employee}        onSave={handleSaveEmployee} />
      <PersonalInfoEditModal show={showPersonalModal}  onHide={() => setShowPersonalModal(false)}  employee={employee}        onSave={handleSavePersonalInfo} />
      <AddLeaveCreditModal   show={showAddCreditModal} onHide={() => setShowAddCreditModal(false)} biometricId={biometric_id} onSuccess={refetchLeave} />
      <DeminimisModal        show={showDeminimisModal} onHide={() => setShowDeminimisModal(false)} employeeId={employee?.id}  onSuccess={refetchDeminimis} />
    </Layout>
  );
}

function TabButton({ label, active, onClick }) {
  return (
    <li className="nav-item">
      <button className="nav-link" onClick={onClick} style={{ backgroundColor: "#ffffff", color: active ? "#0d6efd" : "#6c757d", border: "none", borderBottom: active ? "3px solid #0d6efd" : "3px solid transparent", padding: "12px 24px", fontWeight: active ? "600" : "500", borderRadius: 0 }}>
        {label}
      </button>
    </li>
  );
}

function BenefitsTabButton({ label, active, onClick }) {
  return (
    <button className="btn" onClick={onClick} style={{ color: active ? "#0d6efd" : "#6c757d", borderBottom: active ? "3px solid #0d6efd" : "none", borderRadius: 0, padding: "10px 20px", fontWeight: active ? "600" : "normal" }}>
      {label}
    </button>
  );
}

function InfoField({ label, value }) {
  return (
    <div className="col-6 mb-3">
      <div className="text-muted" style={{ fontSize: "13px" }}>{label}</div>
      <div style={{ fontSize: "14px" }}>{value}</div>
    </div>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <div className="mb-3 pb-3 border-bottom">
      <div className="d-flex align-items-center mb-2">
        <span className="me-2">{icon}</span>
        <span className="text-muted" style={{ fontSize: "13px" }}>{label}</span>
      </div>
      <div style={{ fontSize: "14px", paddingLeft: "28px" }}>{value || "N/A"}</div>
    </div>
  );
}