import { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import Swal from "sweetalert2";

const TAX_TYPES = ["W/ Declaration", "No Declaration", "Non-Resident"];

export default function PersonalInfoEditModal({ show, onHide, employee, onSave }) {
    const [formData, setFormData] = useState({
        birthdate:         "",
        age:               "",
        birthplace:        "",
        nationality:       "",
        civil_status:      "",
        religion:          "",
        gender:            "",
        present_address:   "",
        home_address:      "",
        same_as_present:   false,
        email_address:     "",
        mobile_number:     "",
        dependents:        "",
        tax_type:          "No Declaration",
        lodged:            "",
        emergency_contact: "",
        emergency_number:  "",
    });

    const formatDate = (dateString) => {
        if (!dateString || dateString === "N/A" || dateString === "null") return "";
        return dateString.split("T")[0];
    };

    useEffect(() => {
        if (employee && show) {
            const personalInfo = employee.personal_info || employee.personalInformation || {};

            setFormData({
                birthdate:         formatDate(employee.birthdate       || personalInfo.birthdate),
                age:               employee.age               || personalInfo.age               || "",
                birthplace:        employee.birthplace         || personalInfo.birthplace         || "",
                nationality:       employee.nationality        || personalInfo.nationality        || "",
                civil_status:      employee.civil_status       || personalInfo.civil_status       || "",
                religion:          employee.religion           || personalInfo.religion           || "",
                gender:            employee.gender             || personalInfo.gender             || "",
                present_address:   employee.present_address    || personalInfo.present_address    || "",
                home_address:      employee.home_address       || personalInfo.home_address       || "",
                same_as_present:   false,
                email_address:     employee.email_address      || personalInfo.email_address      || "",
                mobile_number:     employee.mobile_number      || personalInfo.mobile_number      || "",
                dependents:        employee.dependents         || personalInfo.dependents         || "",
                // Pre-fill tax_type from DB — default "No Declaration" if not yet set
                tax_type:          employee.tax_type           || personalInfo.tax_type           || "No Declaration",
                lodged:            employee.lodged             || personalInfo.lodged             || "",
                emergency_contact: employee.emergency_contact  || personalInfo.emergency_contact  || "",
                emergency_number:  employee.emergency_number   || personalInfo.emergency_number   || "",
            });
        }
    }, [employee, show]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === "checkbox") {
            setFormData((prev) => ({ ...prev, [name]: checked }));
            if (name === "same_as_present" && checked) {
                setFormData((prev) => ({ ...prev, home_address: prev.present_address }));
            }
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async () => {
        const result = await Swal.fire({
            title: "Confirm Update",
            text: "Are you sure you want to save these personal information changes?",
            icon: "question", showCancelButton: true,
            confirmButtonColor: "#198754", cancelButtonColor: "#dc3545",
            confirmButtonText: "Yes, Save", cancelButtonText: "Cancel",
        });
        if (!result.isConfirmed) return;

        const { same_as_present, ...dataToSave } = formData;
        onSave(dataToSave);
    };

    return (
        <Modal show={show} onHide={onHide} size="xl" centered backdrop="static">
            <Modal.Header style={{ backgroundColor: "#ffcc00", border: "none", padding: "12px 20px" }}>
                <Modal.Title style={{ fontSize: "18px", fontWeight: "700" }}>Personal Information</Modal.Title>
                <button className="btn-close" onClick={onHide}></button>
            </Modal.Header>

            <Modal.Body style={{ padding: "30px", maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>

                {/* Row 1: Birthdate, Age, Birth Place */}
                <div className="row g-3 mb-3">
                    <div className="col-md-4">
                        <DateField  label="Birthdate:"   name="birthdate"  value={formData.birthdate}  onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                        <InputField label="Age:"         name="age"        type="number" value={formData.age}        onChange={handleChange} placeholder="Age" />
                    </div>
                    <div className="col-md-4">
                        <InputField label="Birth Place:" name="birthplace" value={formData.birthplace} onChange={handleChange} placeholder="Birth Place" />
                    </div>
                </div>

                {/* Row 2: Nationality, Civil Status, Religion */}
                <div className="row g-3 mb-3">
                    <div className="col-md-4">
                        <InputField  label="Nationality:"  name="nationality"  value={formData.nationality}  onChange={handleChange} placeholder="Nationality" />
                    </div>
                    <div className="col-md-4">
                        <SelectField label="Civil Status:" name="civil_status" value={formData.civil_status} onChange={handleChange} options={["Single", "Married", "Widowed", "Separated"]} />
                    </div>
                    <div className="col-md-4">
                        <InputField  label="Religion:"     name="religion"     value={formData.religion}     onChange={handleChange} placeholder="Religion" />
                    </div>
                </div>

                {/* Gender */}
                <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ fontSize: "14px", fontWeight: "600" }}>Gender:</label>
                    <div style={{ display: "flex", gap: "25px", paddingTop: "8px" }}>
                        <div className="form-check">
                            <input type="radio" name="gender" value="Male" checked={formData.gender === "Male"} onChange={handleChange} className="form-check-input" id="editGenderMale" />
                            <label className="form-check-label" htmlFor="editGenderMale" style={{ fontSize: "14px" }}>Male</label>
                        </div>
                        <div className="form-check">
                            <input type="radio" name="gender" value="Female" checked={formData.gender === "Female"} onChange={handleChange} className="form-check-input" id="editGenderFemale" />
                            <label className="form-check-label" htmlFor="editGenderFemale" style={{ fontSize: "14px" }}>Female</label>
                        </div>
                    </div>
                </div>

                {/* Present Address */}
                <div className="mb-3">
                    <InputField label="Present Address:" name="present_address" value={formData.present_address} onChange={handleChange} placeholder="Present Address" />
                </div>

                {/* Home Address */}
                <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label fw-semibold mb-0" style={{ fontSize: "14px", fontWeight: "600" }}>Home Address:</label>
                        <div className="form-check">
                            <input type="checkbox" name="same_as_present" checked={formData.same_as_present} onChange={handleChange} className="form-check-input" id="editSameAsPresent" />
                            <label className="form-check-label" htmlFor="editSameAsPresent" style={{ fontSize: "13px", color: "#0d6efd" }}>Same as Present</label>
                        </div>
                    </div>
                    <input
                        type="text" name="home_address" className="form-control"
                        value={formData.home_address} onChange={handleChange}
                        disabled={formData.same_as_present} placeholder="Home Address"
                        style={{ borderRadius: "8px", padding: "10px", fontSize: "14px" }}
                    />
                </div>

                {/* Email + Mobile */}
                <div className="row g-3 mb-3">
                    <div className="col-md-6">
                        <InputField label="Email Address:" name="email_address" type="email" value={formData.email_address} onChange={handleChange} placeholder="Email Address" />
                    </div>
                    <div className="col-md-6">
                        <InputField label="Mobile Number:" name="mobile_number" value={formData.mobile_number} onChange={handleChange} placeholder="Mobile Number" />
                    </div>
                </div>

                {/* Dependents + Tax Type + Lodged */}
                <div className="row g-3 mb-4">
                    <div className="col-md-4">
                        <InputField label="No. of Dependents:" name="dependents" type="number" value={formData.dependents} onChange={handleChange} placeholder="No. of Dependents" />
                    </div>
                    <div className="col-md-4">
                        <div className="mb-2">
                            <label className="form-label mb-1" style={{ fontSize: "14px", fontWeight: "600", color: "#555" }}>
                                Tax Declaration Type:
                                <span className="ms-1 text-muted fw-normal" style={{ fontSize: "12px" }}>(payroll)</span>
                            </label>
                            <select
                                name="tax_type" className="form-select"
                                value={formData.tax_type} onChange={handleChange}
                                style={{ borderRadius: "8px", padding: "10px", fontSize: "14px" }}
                            >
                                {TAX_TYPES.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <small className="text-muted">Affects withholding tax bracket in payroll</small>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <SelectField label="Declaration of Lodged:" name="lodged" value={formData.lodged} onChange={handleChange} options={["Yes", "No"]} />
                    </div>
                </div>

                {/* Emergency Contact */}
                <div className="mb-4">
                    <h6 style={{ fontWeight: "600", fontSize: "15px", borderBottom: "2px solid #dee2e6", paddingBottom: "10px", marginBottom: "15px" }}>
                        In Case of Emergency
                    </h6>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <InputField label="Contact Person:" name="emergency_contact" value={formData.emergency_contact} onChange={handleChange} placeholder="Contact Person" />
                        </div>
                        <div className="col-md-6">
                            <InputField label="Contact Number:" name="emergency_number" value={formData.emergency_number} onChange={handleChange} placeholder="Contact Number" />
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

/* ── Helper components ──────────────────────────────────────────────────────── */
function InputField({ label, name, value, onChange, type = "text", placeholder = "", disabled = false }) {
    return (
        <div className="mb-2">
            <label className="form-label mb-1" style={{ fontSize: "14px", fontWeight: "600", color: "#555" }}>{label}</label>
            <input type={type} className="form-control" name={name} value={value} onChange={onChange}
                placeholder={placeholder} disabled={disabled}
                style={{ borderRadius: "8px", padding: "10px", fontSize: "14px" }} />
        </div>
    );
}

function SelectField({ label, name, value, onChange, options }) {
    return (
        <div className="mb-2">
            <label className="form-label mb-1" style={{ fontSize: "14px", fontWeight: "600", color: "#555" }}>{label}</label>
            <select className="form-select" name={name} value={value} onChange={onChange}
                style={{ borderRadius: "8px", padding: "10px", fontSize: "14px" }}>
                <option value="">Select...</option>
                {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    );
}

function DateField({ label, name, value, onChange }) {
    return (
        <div className="mb-2">
            <label className="form-label mb-1" style={{ fontSize: "14px", fontWeight: "600", color: "#555" }}>{label}</label>
            <input type="date" className="form-control" name={name} value={value} onChange={onChange}
                style={{ borderRadius: "8px", padding: "10px", fontSize: "14px" }} />
        </div>
    );
}