import { useState } from "react";
import Swal from "sweetalert2";
import baseApi from "../../api/baseApi";
import { useSettings } from "../../contexts/SettingsContext";

export default function DeminimisModal({ show, onHide, employeeId, onSuccess }) {
  const [allowances, setAllowances] = useState([{ type: "", amount: "" }]);
  const [loading, setLoading] = useState(false);
  const { settings } = useSettings();
  const currency = settings.currency || "PGK";

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

  const handleSubmit = async () => {
    const validAllowances = allowances.filter(
      (a) => a.type.trim() !== "" && a.amount !== ""
    );

    if (validAllowances.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Valid Allowances",
        text: "Please add at least one allowance with type and amount.",
        confirmButtonColor: "#f39c12",
      });
      return;
    }

    setLoading(true);
    try {
      await baseApi.post("/api/hrms/deminimis", {
        employee_id: employeeId,
        allowances: validAllowances,
      });

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Allowances added successfully.",
        confirmButtonColor: "#28a745",
      });

      onSuccess();
      setAllowances([{ type: "", amount: "" }]);
      onHide();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: err.response?.data?.message || "Failed to save allowances.",
        confirmButtonColor: "#d33",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onHide}
    >
      <div
        className="modal-dialog modal-lg modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content" style={{ borderRadius: "12px" }}>
          <div className="modal-header">
            <h5 className="modal-title fw-bold">Add De Minimis Allowances</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>

          <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
            <p className="text-muted mb-4" style={{ fontSize: "14px" }}>
              Add different types of allowances. You can add multiple allowances as needed.
            </p>

            {allowances.map((allowance, index) => (
              <div key={index} className="card mb-3" style={{ border: "1px solid #dee2e6", borderRadius: "8px" }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0" style={{ fontWeight: 600 }}>Allowance #{index + 1}</h6>
                    {allowances.length > 1 && (
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => removeAllowance(index)}>
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Allowance Type:</label>
                      <input
                        type="text"
                        value={allowance.type}
                        onChange={(e) => handleAllowanceChange(index, "type", e.target.value)}
                        className="form-control"
                        placeholder="e.g., Transportation, Meal, etc."
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Amount ({currency}):</label>
                      <input
                        type="number"
                        value={allowance.amount}
                        onChange={(e) => handleAllowanceChange(index, "amount", e.target.value)}
                        className="form-control"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button type="button" className="btn btn-outline-primary w-100" onClick={addAllowance}>
              + Add Another Allowance
            </button>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide} disabled={loading}>
              Cancel
            </button>
            <button type="button" className="btn btn-success" onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : "Save Allowances"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}