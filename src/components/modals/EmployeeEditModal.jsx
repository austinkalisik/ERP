import { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { useQuery } from "@tanstack/react-query";
import { FaUserCircle } from "react-icons/fa";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";
import SearchableSelect from "../SearchableSelect";

export default function EmployeeEditModal({ show, onHide, employee, onSave }) {

  // ── Shared cached lookups — same keys as EmploymentInfoTab ────────────────
  const { data: departments     = [] } = useQuery({ queryKey: ["hrms_departments"],    queryFn: () => baseApi.get("/api/hrms/departments").then((r)                   => r.data?.data || r.data || []),  staleTime: 30 * 60 * 1000 });
  const { data: shifts          = [] } = useQuery({ queryKey: ["hrms_shifts"],          queryFn: () => baseApi.get("/api/hrms/shifts").then((r)                          => r.data || []),                  staleTime: 30 * 60 * 1000 });
  const { data: classifications = [] } = useQuery({ queryKey: ["hrms_classifications"], queryFn: () => baseApi.get("/api/hrms/employment-classifications").then((r)       => r.data?.data || r.data || []), staleTime: 30 * 60 * 1000 });

  // Build options for SearchableSelect
  const departmentOptions     = departments.map((d)     => ({ value: String(d.id),  label: d.name }));
  const shiftOptions          = shifts.map((s)          => ({ value: String(s.id),  label: `${s.shift_name} (${s.start_time} - ${s.end_time})` }));
  const classificationOptions = classifications.map((c) => ({ value: String(c.id),  label: c.name }));

  const [formData, setFormData] = useState({
    biometric_id: "", first_name: "", middle_name: "", last_name: "",
    department_id: "", shift_id: "", job_location: "", department_head: "",
    supervisor: "", position: "", company_email: "", employment_classification: "",
    employee_type: "", rate_type: "", rate: "", date_started: "", date_ended: "",
    nasfund: 0, nasfund_number: "", tin_number: "", work_permit_number: "",
    work_permit_expiry: "", visa_number: "", visa_expiry: "", bsb_code: "",
    bank_name: "", account_number: "", account_name: "", profile_picture: null,
  });

  const [imagePreview, setImagePreview] = useState(null);

  const formatDate = (d) => {
    if (!d || d === "N/A" || d === "null") return "";
    return d.split("T")[0];
  };

  // Pre-fill form when employee prop changes or modal opens
  useEffect(() => {
    if (!employee) return;
    const nasfundMember = employee.account_information?.nasfund === true || employee.account_information?.nasfund === 1;
    setFormData({
      biometric_id:              employee.biometric_id || "",
      first_name:                employee.first_name   || "",
      middle_name:               employee.middle_name  || "",
      last_name:                 employee.last_name    || "",
      department_id:             employee.employment_information?.department_id ? String(employee.employment_information.department_id) : "",
      shift_id:                  employee.shift?.shift_id ? String(employee.shift.shift_id) : "",
      job_location:              employee.job_location              || "",
      department_head:           employee.department_head           || "",
      supervisor:                employee.supervisor                || "",
      position:                  employee.position                  || "",
      company_email:             employee.company_email             || "",
      employment_classification: employee.employment_classification_id ? String(employee.employment_classification_id) : "",
      employee_type:             employee.employee_type             || "",
      rate_type:                 employee.rate_type                 || "",
      rate:                      employee.rate                      || "",
      date_started:              formatDate(employee.date_started),
      date_ended:                formatDate(employee.date_ended),
      nasfund:                   nasfundMember ? 1 : 0,
      nasfund_number:            employee.account_information?.nasfund_number || "",
      tin_number:                employee.account_information?.tin_number     || "",
      work_permit_number:        employee.work_permit_number        || "",
      work_permit_expiry:        formatDate(employee.work_permit_expiry),
      visa_number:               employee.visa_number               || "",
      visa_expiry:               formatDate(employee.visa_expiry),
      bsb_code:                  employee.bsb_code                  || "",
      bank_name:                 employee.bank_name                 || "",
      account_number:            employee.account_number            || "",
      account_name:              employee.account_name              || "",
      profile_picture:           null,
    });

    if (employee.profile_picture) {
      const imageUrl = employee.profile_picture.startsWith("http")
        ? employee.profile_picture
        : `${import.meta.env.VITE_API_URL}/storage/${employee.profile_picture}`;
      setImagePreview(imageUrl);
    } else {
      setImagePreview(null);
    }
  }, [employee]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { Swal.fire({ icon: "error", title: "Invalid File Type", text: "Please select an image file", confirmButtonColor: "#d33" }); return; }
    if (file.size > 2 * 1024 * 1024)    { Swal.fire({ icon: "error", title: "File Too Large", text: "Image must be smaller than 2MB", confirmButtonColor: "#d33" }); return; }
    setFormData((prev) => ({ ...prev, profile_picture: file }));
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "nasfund") {
      const nasfundValue = parseInt(value);
      setFormData((prev) => ({ ...prev, nasfund: nasfundValue, nasfund_number: nasfundValue === 0 ? "" : prev.nasfund_number }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const result = await Swal.fire({
      title: "Confirm Update", text: "Are you sure you want to save these changes?",
      icon: "question", showCancelButton: true,
      confirmButtonColor: "#198754", cancelButtonColor: "#dc3545",
      confirmButtonText: "Yes, Save", cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    onSave({ ...formData, date_started: formData.date_started || null, date_ended: formData.date_ended || null });
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered backdrop="static">
      <Modal.Header style={{ backgroundColor: "#ffcc00", border: "none", padding: "12px 20px" }}>
        <Modal.Title style={{ fontSize: "18px", fontWeight: "700" }}>Employee Information</Modal.Title>
        <button className="btn-close" onClick={onHide}></button>
      </Modal.Header>

      <Modal.Body style={{ padding: "20px", maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
        <div className="row">
          {/* LEFT COLUMN */}
          <div className="col-md-5" style={{ borderRight: "1px solid #e0e0e0", paddingRight: "20px" }}>
            <div className="text-center mb-3" style={{ border: "2px solid #ddd", borderRadius: "8px", padding: "16px", backgroundColor: "#f9f9f9" }}>
              <input type="file" id="profile-picture-upload" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
              <label htmlFor="profile-picture-upload" style={{ cursor: "pointer", display: "inline-block" }}>
                <div style={{ backgroundColor: "#e0e0e0", width: "90px", height: "90px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", overflow: "hidden", border: "2px solid #ddd" }}>
                  {imagePreview ? <img src={imagePreview} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <FaUserCircle size={70} color="#4aa3df" />}
                </div>
                <div style={{ fontSize: "11px", color: "#0d6efd", marginTop: "5px" }}>Click to upload photo</div>
              </label>
            </div>

            <InputField label="Emp No." name="biometric_id" value={formData.biometric_id} disabled />

            <div className="row g-2">
              <div className="col-4"><InputField label="First Name"  name="first_name"  value={formData.first_name}  onChange={handleChange} /></div>
              <div className="col-4"><InputField label="Middle Name" name="middle_name" value={formData.middle_name} onChange={handleChange} /></div>
              <div className="col-4"><InputField label="Last Name"   name="last_name"   value={formData.last_name}   onChange={handleChange} /></div>
            </div>

            <div className="row g-2">
              {/* Department — SearchableSelect replaces SelectField */}
              <div className="col-6">
                <SearchableLabel label="Department:" />
                <SearchableSelect
                  options={departmentOptions}
                  value={formData.department_id}
                  onChange={(v) => setFormData((p) => ({ ...p, department_id: v }))}
                  placeholder="Search department..."
                />
              </div>
              {/* Shift — SearchableSelect replaces SelectField */}
              <div className="col-6">
                <SearchableLabel label="Shift:" />
                <SearchableSelect
                  options={shiftOptions}
                  value={formData.shift_id}
                  onChange={(v) => setFormData((p) => ({ ...p, shift_id: v }))}
                  placeholder="Search shift..."
                />
              </div>
            </div>

            <div className="row g-2">
              <div className="col-6"><InputField label="Job Location:"    name="job_location"  value={formData.job_location}  onChange={handleChange} /></div>
            </div>
            <div className="row g-2">
              <div className="col-6"><InputField label="Department Head:" name="department_head" value={formData.department_head} onChange={handleChange} /></div>
              <div className="col-6"><InputField label="Supervisor:"      name="supervisor"      value={formData.supervisor}      onChange={handleChange} /></div>
            </div>
            <InputField label="Position:"      name="position"      value={formData.position}      onChange={handleChange} />
            <InputField label="Company Email:" name="company_email" value={formData.company_email} onChange={handleChange} />
          </div>

          {/* RIGHT COLUMN */}
          <div className="col-md-7" style={{ paddingLeft: "20px" }}>
            <h6 className="fw-bold mb-3" style={{ fontSize: "15px" }}>Employee Information</h6>
            <div className="row g-2">
              {/* Classification — SearchableSelect replaces SelectField */}
              <div className="col-md-6">
                <SearchableLabel label="Employee Classification:" />
                <SearchableSelect
                  options={classificationOptions}
                  value={formData.employment_classification}
                  onChange={(v) => setFormData((p) => ({ ...p, employment_classification: v }))}
                  placeholder="Search classification..."
                />
              </div>
              {/* Employee Type — 2 options, keep as SelectField */}
              <div className="col-md-6">
                <SelectField label="Employee Type:" name="employee_type" value={formData.employee_type} onChange={handleChange} options={["Local", "Expat"]} />
              </div>
              {/* Rate Type — 4 options, keep as SelectField */}
              <div className="col-md-6">
                <SelectField label="Rate Type:" name="rate_type" value={formData.rate_type} onChange={handleChange} options={["Annual", "Monthly", "Daily", "Hourly"]} />
              </div>
              <div className="col-md-6">
                <InputField label="Rate:" name="rate" type="number" value={formData.rate} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <DateField label="Date Started:" name="date_started" value={formData.date_started} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <DateField label="Date Ended:" name="date_ended" value={formData.date_ended} onChange={handleChange} />
              </div>
            </div>

            <h6 className="fw-bold mb-3 mt-3" style={{ fontSize: "15px" }}>Account Information</h6>
            <div className="row g-2">
              <div className="col-md-6">
                <label className="form-label mb-1" style={{ fontSize: "12px", fontWeight: "500", color: "#555" }}>NASFUND Member:</label>
                <div className="d-flex gap-3 align-items-center">
                  <div className="form-check">
                    <input type="radio" name="nasfund" value="1" checked={formData.nasfund === 1 || formData.nasfund === true} onChange={handleChange} className="form-check-input" id="nasfund-yes-edit" />
                    <label className="form-check-label" htmlFor="nasfund-yes-edit" style={{ fontSize: "13px" }}>Yes</label>
                  </div>
                  <div className="form-check">
                    <input type="radio" name="nasfund" value="0" checked={formData.nasfund === 0 || formData.nasfund === false} onChange={handleChange} className="form-check-input" id="nasfund-no-edit" />
                    <label className="form-check-label" htmlFor="nasfund-no-edit" style={{ fontSize: "13px" }}>No</label>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <InputField label="NASFUND Number:" name="nasfund_number" value={formData.nasfund_number} onChange={handleChange} disabled={formData.nasfund !== 1 && formData.nasfund !== true} />
              </div>
              <div className="col-md-12">
                <InputField label="TIN Number:" name="tin_number" value={formData.tin_number} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <InputField label="Work Permit Number:" name="work_permit_number" value={formData.work_permit_number} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <DateField label="Work Permit Expiry:" name="work_permit_expiry" value={formData.work_permit_expiry} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <InputField label="Visa Number:" name="visa_number" value={formData.visa_number} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <DateField label="Visa Expiry:" name="visa_expiry" value={formData.visa_expiry} onChange={handleChange} />
              </div>
            </div>

            <h6 className="fw-bold mb-3 mt-3" style={{ fontSize: "15px" }}>Bank Information</h6>
            <div className="row g-2">
              <div className="col-md-6"><InputField label="BSB Code:"            name="bsb_code"       value={formData.bsb_code}       onChange={handleChange} /></div>
              <div className="col-md-6"><InputField label="Bank Name:"           name="bank_name"      value={formData.bank_name}      onChange={handleChange} /></div>
              <div className="col-md-6"><InputField label="Bank Account Number:" name="account_number" value={formData.account_number} onChange={handleChange} /></div>
              <div className="col-md-6"><InputField label="Account Name:"        name="account_name"   value={formData.account_name}   onChange={handleChange} /></div>
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer style={{ backgroundColor: "#ffcc00", border: "none", padding: "12px 20px", justifyContent: "flex-end" }}>
        <button className="btn btn-success px-4 fw-semibold" onClick={handleSubmit}>Save</button>
      </Modal.Footer>
    </Modal>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

// Small label styled to match SelectField label
function SearchableLabel({ label }) {
  return <label className="form-label mb-1" style={{ fontSize: "12px", fontWeight: "500", color: "#555" }}>{label}</label>;
}

function InputField({ label, name, value, onChange, type = "text", disabled = false }) {
  return (
    <div className="mb-2">
      <label className="form-label mb-1" style={{ fontSize: "12px", fontWeight: "500", color: "#555" }}>{label}</label>
      <input type={type} className="form-control form-control-sm" name={name} value={value} disabled={disabled} onChange={onChange}
        style={{ fontSize: "13px", backgroundColor: disabled ? "#e9ecef" : "white", cursor: disabled ? "not-allowed" : "text" }} />
    </div>
  );
}

// Kept for Employee Type (Local/Expat) and Rate Type (Annual/Monthly/Daily/Hourly) — short fixed lists
function SelectField({ label, name, value, onChange, options, isObjectOptions = false }) {
  return (
    <div className="mb-2">
      <label className="form-label mb-1" style={{ fontSize: "12px", fontWeight: "500", color: "#555" }}>{label}</label>
      <select className="form-select form-select-sm" name={name} value={value} onChange={onChange} style={{ fontSize: "13px" }}>
        <option value="">Select...</option>
        {isObjectOptions
          ? options.map((opt) => <option key={opt.id} value={String(opt.id)}>{opt.name}</option>)
          : options.map((opt) => <option key={opt} value={opt}>{opt}</option>)
        }
      </select>
    </div>
  );
}

function DateField({ label, name, value, onChange }) {
  return (
    <div className="mb-2">
      <label className="form-label mb-1" style={{ fontSize: "12px", fontWeight: "500", color: "#555" }}>{label}</label>
      <input type="date" className="form-control form-control-sm" name={name} value={value} onChange={onChange} style={{ fontSize: "13px" }} />
    </div>
  );
}