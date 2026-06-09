import { useEffect, useState } from "react";

export default function LeaveTypeModal({ leaveType, onClose, onSave }) {
  const [form, setForm] = useState({
    leave_type: "",
    leave_code: "",
    num_hours:  8,
  });

  useEffect(() => {
    if (leaveType) {
      setForm({
        leave_type: leaveType.leave_type || "",
        leave_code: leaveType.leave_code || "",
        num_hours:  leaveType.num_hours  || 8,
      });
    }
  }, [leaveType]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    onSave({ ...leaveType, ...form });
  };

  return (
    <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {leaveType ? "Edit Leave Type" : "Add Leave Type"}
            </h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Leave Type Name</label>
              <input
                className="form-control"
                name="leave_type"
                value={form.leave_type}
                onChange={handleChange}
                placeholder="e.g. Annual Leave"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Leave Code</label>
              <input
                className="form-control"
                name="leave_code"
                value={form.leave_code}
                onChange={handleChange}
                placeholder="e.g. AL"
                style={{ textTransform: "uppercase" }}
              />
              <small className="text-muted">Short code used in reports (e.g. AL, SL, RNR)</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Hours Paid Per Day</label>
              <input
                type="number"
                className="form-control"
                name="num_hours"
                value={form.num_hours}
                onChange={handleChange}
                min="0"
                step="0.5"
              />
              <small className="text-muted">How many hours are paid per leave day (e.g. 8)</small>
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