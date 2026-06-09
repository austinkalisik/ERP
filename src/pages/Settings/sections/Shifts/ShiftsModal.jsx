import { useEffect, useState } from "react";

export default function ShiftModal({ shift, onClose, onSave }) {
  const [form, setForm] = useState({
  shift_name: "",
  start_time: "",
  end_time: "",
});


  useEffect(() => {
  if (shift) {
    setForm({
      shift_name: shift.shift_name || "",
      start_time: shift.start_time || "",
      end_time: shift.end_time || "",
    });
  }
}, [shift]);


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    onSave({ ...shift, ...form });
  };

  return (
    <div className="modal d-block" style={{ background: "rgba(0,0,0,.5)" }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {shift ? "Edit Shift" : "Add Shift"}
            </h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Shift Name</label>
              <input
  className="form-control"
  name="shift_name"
  value={form.shift_name}
  onChange={handleChange}
/>

            </div>

            <div className="mb-3">
              <label className="form-label">Start Time</label>
              <input
                type="time"
                className="form-control"
                name="start_time"
                value={form.start_time}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">End Time</label>
              <input
                type="time"
                className="form-control"
                name="end_time"
                value={form.end_time}
                onChange={handleChange}
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
