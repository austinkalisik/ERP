import { useState, useEffect } from "react";

export default function DepartmentModal({ department, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    prefix: "",
  });

  useEffect(() => {
    if (department) {
      setForm({
        name: department.name,
        prefix: department.prefix,
      });
    }
  }, [department]);

  const handleSubmit = () => {
    if (!form.name || !form.prefix) return;
    onSave({ ...department, ...form });
  };

  return (
    <div className="modal d-block" style={{ background: "rgba(0,0,0,.4)" }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {department ? "Edit Department" : "Add Department"}
            </h5>
            <button className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Department Name</label>
              <input
                className="form-control"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Prefix</label>
              <input
                className="form-control"
                value={form.prefix}
                onChange={(e) =>
                  setForm({ ...form, prefix: e.target.value })
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
