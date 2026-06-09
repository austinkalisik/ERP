export default function PersonalInfoTab({ formData, handleInputChange, handleNext }) {
  const handleSameAsPresent = (e) => {
    const checked = e.target.checked;

    handleInputChange({
      target: { name: "same_as_present", type: "checkbox", checked }
    });

    if (checked) {
      handleInputChange({
        target: { name: "home_address", value: formData.present_address || "" }
      });
    }
  };

  const baseInputStyle = {
    borderRadius: "8px",
    padding: "10px",
    fontSize: "14px",
    width: "100%"
  };

  const labelStyle = {
    fontSize: "14px",
    fontWeight: 600
  };

  return (
    <div className="tab-content" style={{ maxWidth: "100%", overflowX: "hidden" }}>

      {/* Row 1 */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-sm-6 col-md-4">
          <label className="form-label fw-semibold" style={labelStyle}>Birthdate:</label>
          <input
            type="date" name="birthdate" className="form-control"
            value={formData.birthdate || ""} onChange={handleInputChange} style={baseInputStyle}
          />
        </div>
        <div className="col-12 col-sm-6 col-md-4">
          <label className="form-label fw-semibold" style={labelStyle}>Age:</label>
          <input
            type="number" name="age" className="form-control"
            value={formData.age || ""} onChange={handleInputChange}
            placeholder="Age" style={baseInputStyle}
          />
        </div>
        <div className="col-12 col-sm-6 col-md-4">
          <label className="form-label fw-semibold" style={labelStyle}>Birth Place:</label>
          <input
            type="text" name="birthplace" className="form-control"
            value={formData.birthplace || ""} onChange={handleInputChange}
            placeholder="Birth Place" style={baseInputStyle}
          />
        </div>
      </div>

      {/* Row 2 */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-sm-6 col-md-4">
          <label className="form-label fw-semibold" style={labelStyle}>Nationality:</label>
          <input
            type="text" name="nationality" className="form-control"
            value={formData.nationality || ""} onChange={handleInputChange}
            placeholder="Nationality" style={baseInputStyle}
          />
        </div>
        <div className="col-12 col-sm-6 col-md-4">
          <label className="form-label fw-semibold" style={labelStyle}>Civil Status:</label>
          <select
            name="civil_status" className="form-select"
            value={formData.civil_status || ""} onChange={handleInputChange} style={baseInputStyle}
          >
            <option value="">Select</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Widowed">Widowed</option>
            <option value="Separated">Separated</option>
          </select>
        </div>
        <div className="col-12 col-sm-6 col-md-4">
          <label className="form-label fw-semibold" style={labelStyle}>Religion:</label>
          <input
            type="text" name="religion" className="form-control"
            value={formData.religion || ""} onChange={handleInputChange}
            placeholder="Religion" style={baseInputStyle}
          />
        </div>
      </div>

      {/* Row 3: Gender */}
      <div className="row g-3 mb-3">
        <div className="col-12">
          <label className="form-label fw-semibold" style={labelStyle}>Gender:</label>
          <div style={{ display: "flex", gap: "25px", paddingTop: "8px" }}>
            <div className="form-check">
              <input type="radio" name="gender" value="Male" checked={formData.gender === "Male"} onChange={handleInputChange} className="form-check-input" id="genderMale" />
              <label className="form-check-label" htmlFor="genderMale" style={{ fontSize: "14px" }}>Male</label>
            </div>
            <div className="form-check">
              <input type="radio" name="gender" value="Female" checked={formData.gender === "Female"} onChange={handleInputChange} className="form-check-input" id="genderFemale" />
              <label className="form-check-label" htmlFor="genderFemale" style={{ fontSize: "14px" }}>Female</label>
            </div>
          </div>
        </div>
      </div>

      {/* Present Address */}
      <div className="mb-3">
        <label className="form-label fw-semibold" style={labelStyle}>Present Address:</label>
        <input
          type="text" name="present_address" className="form-control"
          value={formData.present_address || ""} onChange={handleInputChange}
          placeholder="Present Address" style={baseInputStyle}
        />
      </div>

      {/* Home Address */}
      <div className="mb-3">
        <div className="d-flex justify-content-between mb-1">
          <label className="form-label fw-semibold" style={labelStyle}>Home Address:</label>
          <div className="form-check">
            <input
              type="checkbox" name="same_as_present"
              checked={formData.same_as_present || false} onChange={handleSameAsPresent}
              className="form-check-input" id="sameAsPresent"
            />
            <label className="form-check-label" htmlFor="sameAsPresent" style={{ fontSize: "14px", color: "#007bff" }}>
              Same as Present
            </label>
          </div>
        </div>
        <input
          type="text" name="home_address" className="form-control"
          value={formData.home_address || ""} onChange={handleInputChange}
          disabled={formData.same_as_present}
          placeholder="Home Address" style={baseInputStyle}
        />
      </div>

      {/* Email + Mobile */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold" style={labelStyle}>Email Address:</label>
          <input
            type="email" name="email_address" className="form-control"
            value={formData.email_address || ""} onChange={handleInputChange}
            placeholder="Enter Email or N/A" style={baseInputStyle}
          />
        </div>
        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold" style={labelStyle}>Mobile Number:</label>
          <input
            type="text" name="mobile_number" className="form-control"
            value={formData.mobile_number || ""} onChange={handleInputChange}
            placeholder="Mobile Number" style={baseInputStyle}
          />
        </div>
      </div>

      {/* Dependents + Tax Type + Lodged */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <label className="form-label fw-semibold" style={labelStyle}>No. of Dependents:</label>
          <input
            type="number" name="dependents" className="form-control"
            value={formData.dependents || ""} onChange={handleInputChange}
            placeholder="No. of Dependents" style={baseInputStyle}
          />
        </div>

        {/* Tax Type — used for withholding tax bracket lookup in payroll */}
        <div className="col-12 col-md-4">
          <label className="form-label fw-semibold" style={labelStyle}>
            Tax Declaration Type:
            <span className="ms-1 text-muted fw-normal" style={{ fontSize: "12px" }}>(for payroll)</span>
          </label>
          <select
            name="tax_type" className="form-select"
            value={formData.tax_type || "No Declaration"} onChange={handleInputChange}
            style={baseInputStyle}
          >
            <option value="W/ Declaration">W/ Declaration</option>
            <option value="No Declaration">No Declaration</option>
            <option value="Non-Resident">Non-Resident</option>
          </select>
          <small className="text-muted">Determines withholding tax bracket in payroll calculation</small>
        </div>

        <div className="col-12 col-md-4">
          <label className="form-label fw-semibold" style={labelStyle}>Declaration of Lodged:</label>
          <select
            name="lodged" className="form-select"
            value={formData.lodged || ""} onChange={handleInputChange} style={baseInputStyle}
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="mb-4">
        <h5 style={{ fontWeight: 600, fontSize: "15px", borderBottom: "2px solid #dee2e6", paddingBottom: "10px" }}>
          In Case of Emergency
        </h5>
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold" style={labelStyle}>Contact Person:</label>
            <input
              type="text" name="emergency_contact" className="form-control"
              value={formData.emergency_contact || ""} onChange={handleInputChange}
              placeholder="Contact Person" style={baseInputStyle}
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold" style={labelStyle}>Contact Number:</label>
            <input
              type="text" name="emergency_number" className="form-control"
              value={formData.emergency_number || ""} onChange={handleInputChange}
              placeholder="Contact Number" style={baseInputStyle}
            />
          </div>
        </div>
      </div>

      {/* Next Button */}
      <div className="d-flex justify-content-end mt-4">
        <button
          type="button" className="btn btn-primary" onClick={handleNext}
          style={{ padding: "10px 40px", borderRadius: "8px", fontSize: "15px", fontWeight: "500" }}
        >
          Next
        </button>
      </div>
    </div>
  );
}