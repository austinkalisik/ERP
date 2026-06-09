import { useState } from "react";
import { useSettings } from "../../../contexts/SettingsContext";

export default function DeminimisTab({ formData, setFormData, handleSubmit, loading }) {
  const [allowances, setAllowances] = useState([{ type: "", amount: "" }]);
  const { settings } = useSettings();
  const currency = settings.currency || "PGK";

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

  const handleAllowanceChange = (index, field, value) => {
    const updated = [...allowances];
    updated[index][field] = value;
    setAllowances(updated);
  };

  const addAllowance = () => {
    setAllowances([...allowances, { type: "", amount: "" }]);
  };

  const removeAllowance = (index) => {
    if (allowances.length > 1) {
      setAllowances(allowances.filter((_, i) => i !== index));
    }
  };

  const handleSubmitWithAllowances = () => {
    const validAllowances = allowances.filter(
      (a) => a.type.trim() !== "" && a.amount !== ""
    );
    handleSubmit(validAllowances);
  };

  return (
    <div className="tab-content" style={{ maxWidth: "100%", overflowX: "hidden" }}>
      <h5 style={sectionTitle}>De Minimis Benefits</h5>

      <p className="text-muted mb-4" style={{ fontSize: "14px" }}>
        Add different types of allowances for this employee. You can add multiple allowances as needed.
      </p>

      {allowances.map((allowance, index) => (
        <div key={index} className="card mb-3" style={{ border: "1px solid #dee2e6", borderRadius: "8px" }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0" style={{ fontWeight: 600 }}>Allowance #{index + 1}</h6>
              {allowances.length > 1 && (
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => removeAllowance(index)}
                  style={{ borderRadius: "6px" }}
                >
                  Remove
                </button>
              )}
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label" style={labelStyle}>Allowance Type:</label>
                <input
                  type="text"
                  value={allowance.type}
                  onChange={(e) => handleAllowanceChange(index, "type", e.target.value)}
                  className="form-control"
                  placeholder="e.g., Meal Allowance, Transportation"
                  style={inputStyle}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label" style={labelStyle}>Amount ({currency}):</label>
                <input
                  type="number"
                  value={allowance.amount}
                  onChange={(e) => handleAllowanceChange(index, "amount", e.target.value)}
                  className="form-control"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="mb-4">
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={addAllowance}
          style={{ borderRadius: "8px", padding: "10px 30px", fontSize: "14px", fontWeight: "500" }}
        >
          + Add Another Allowance
        </button>
      </div>

      <div className="d-flex justify-content-end mt-4">
        <button
          type="button"
          className="btn btn-success"
          onClick={handleSubmitWithAllowances}
          disabled={loading}
          style={{ padding: "10px 40px", borderRadius: "8px", fontSize: "15px", fontWeight: "500" }}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}