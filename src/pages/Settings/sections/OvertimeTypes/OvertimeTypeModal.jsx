import { useEffect, useState } from "react";

export default function OvertimeTypeModal({ overtimeType, onClose, onSave }) {
  const [form, setForm] = useState({
    overtime_type: "",
    overtime_code: "",
    multiplier:    1.50,
  });

  useEffect(() => {
    if (overtimeType) {
      setForm({
        overtime_type: overtimeType.overtime_type || "",
        overtime_code: overtimeType.overtime_code || "",
        multiplier:    overtimeType.multiplier    || 1.50,
      });
    }
  }, [overtimeType]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    onSave({ ...overtimeType, ...form });
  };

  return (
    <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {overtimeType ? "Edit Overtime Type" : "Add Overtime Type"}
            </h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Overtime Type Name</label>
              <input
                className="form-control"
                name="overtime_type"
                value={form.overtime_type}
                onChange={handleChange}
                placeholder="e.g. Regular OT"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Overtime Code</label>
              <input
                className="form-control"
                name="overtime_code"
                value={form.overtime_code}
                onChange={handleChange}
                placeholder="e.g. REGOT"
                style={{ textTransform: "uppercase" }}
              />
              <small className="text-muted">Short code used in reports (e.g. REGOT, NSDOT, PHW)</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Pay Multiplier</label>
              <input
                type="number"
                className="form-control"
                name="multiplier"
                value={form.multiplier}
                onChange={handleChange}
                min="0"
                step="0.1"
              />
              <small className="text-muted">
                Rate multiplier applied to base hourly pay (e.g. 1.5 = time-and-a-half, 2.0 = double time)
              </small>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}