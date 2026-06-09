export default function AccountInformationTab({ formData, handleInputChange, handleNext }) {
  const inputStyle = {
    borderRadius: "8px",
    padding: "10px",
    fontSize: "14px",
    width: "100%",
  };

  const labelStyle = {
    fontSize: "14px",
    fontWeight: 600,
  };

  const sectionTitle = {
    fontWeight: 600,
    fontSize: "16px",
    paddingBottom: "8px",
    borderBottom: "2px solid #dee2e6",
    marginBottom: "20px",
  };

  return (
    <div className="tab-content" style={{ maxWidth: "100%", overflowX: "hidden" }}>

      {/* Account Information Header */}
      <h5 style={sectionTitle}>Account Information</h5>

      {/* NASFUND Member Radio + Number */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-6">
          <label className="form-label" style={labelStyle}>NASFUND Member:</label>

          <div className="d-flex align-items-center gap-4">
            {/* Yes */}
            <div className="form-check">
              <input
                type="radio"
                name="nasfund"
                value="1"
                checked={formData.nasfund === true || formData.nasfund === 1 || formData.nasfund === "1"}
                onChange={(e) => {
                  handleInputChange({
                    target: { name: "nasfund", value: 1 }
                  });
                }}
                className="form-check-input"
                id="nasfund-yes"
              />
              <label className="form-check-label" htmlFor="nasfund-yes">Yes</label>
            </div>

            {/* No */}
            <div className="form-check">
              <input
                type="radio"
                name="nasfund"
                value="0"
                checked={formData.nasfund === false || formData.nasfund === 0 || formData.nasfund === "0" || formData.nasfund === null || formData.nasfund === undefined}
                onChange={(e) => {
                  handleInputChange({
                    target: { name: "nasfund", value: 0 }
                  });
                  // Clear nasfund_number when "No" is selected
                  handleInputChange({
                    target: { name: "nasfund_number", value: "" }
                  });
                }}
                className="form-check-input"
                id="nasfund-no"
              />
              <label className="form-check-label" htmlFor="nasfund-no">No</label>
            </div>
          </div>
        </div>

        {/* Nasfund Number */}
        <div className="col-12 col-md-6">
          <label className="form-label" style={labelStyle}>NASFUND Number:</label>
          <input
            type="text"
            name="nasfund_number"
            className="form-control"
            value={formData.nasfund_number || ''}
            onChange={handleInputChange}
            placeholder="Enter NASFUND number"
            style={inputStyle}
            disabled={formData.nasfund !== 1 && formData.nasfund !== true && formData.nasfund !== "1"}
          />
        </div>
      </div>

      {/* Row 1: TIN Number */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-6">
          <label className="form-label" style={labelStyle}>TIN Number:</label>
          <input
            type="text"
            name="tin_number"
            className="form-control"
            value={formData.tin_number || ''}
            onChange={handleInputChange}
            placeholder="TIN Number"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Row 2: Work Permit */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-6">
          <label className="form-label" style={labelStyle}>Work Permit Number:</label>
          <input
            type="text"
            name="work_permit_number"
            className="form-control"
            value={formData.work_permit_number || ''}
            onChange={handleInputChange}
            placeholder="Work Permit Number"
            style={inputStyle}
          />
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label" style={labelStyle}>Work Permit Expiry Date:</label>
          <input
            type="date"
            name="work_permit_expiry"
            className="form-control"
            value={formData.work_permit_expiry || ''}
            onChange={handleInputChange}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Row 3: Visa */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <label className="form-label" style={labelStyle}>Visa Number:</label>
          <input
            type="text"
            name="visa_number"
            className="form-control"
            value={formData.visa_number || ''}
            onChange={handleInputChange}
            placeholder="Visa Number"
            style={inputStyle}
          />
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label" style={labelStyle}>Visa Expiry Date:</label>
          <input
            type="date"
            name="visa_expiry"
            className="form-control"
            value={formData.visa_expiry || ''}
            onChange={handleInputChange}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Bank Information Header */}
      <h5 style={sectionTitle}>Bank Information</h5>

      {/* Row 4: BSB / Bank Name */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-6">
          <label className="form-label" style={labelStyle}>BSB Code:</label>
          <input
            type="text"
            name="bsb_code"
            className="form-control"
            value={formData.bsb_code || ''}
            onChange={handleInputChange}
            placeholder="BSB Code"
            style={inputStyle}
          />
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label" style={labelStyle}>Bank Name:</label>
          <input
            type="text"
            name="bank_name"
            className="form-control"
            value={formData.bank_name || ''}
            onChange={handleInputChange}
            placeholder="Bank Name"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Row 5: Account Number / Account Name */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <label className="form-label" style={labelStyle}>Account Number:</label>
          <input
            type="text"
            name="account_number"
            className="form-control"
            value={formData.account_number || ''}
            onChange={handleInputChange}
            placeholder="Account Number"
            style={inputStyle}
          />
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label" style={labelStyle}>Account Name:</label>
          <input
            type="text"
            name="account_name"
            className="form-control"
            value={formData.account_name || ''}
            onChange={handleInputChange}
            placeholder="Account Name"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Next Button */}
      <div className="d-flex justify-content-end mt-4">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleNext}
          style={{
            padding: "10px 40px",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: "500",
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}