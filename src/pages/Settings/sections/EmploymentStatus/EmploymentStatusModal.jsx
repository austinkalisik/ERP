import { useState, useEffect } from "react";

export default function EmploymentStatusModal({
  status,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    name: "",
  });

  useEffect(() => {
    if (status) {
      setForm({
        name: status.name,
      });
    }
  }, [status]);

  const handleSubmit = () => {
    if (!form.name) return;
    onSave({ ...status, ...form });
  };

  return (
    <div className="modal d-block" style={{ background: "rgba(0,0,0,.4)" }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {status ? "Edit Employment Status" : "Add Employment Status"}
            </h5>
            <button className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Status Name</label>
              <input
                className="form-control"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
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
