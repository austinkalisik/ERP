import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import baseApi from "../../../../api/baseApi";
import Swal from "sweetalert2";

export default function PayrollConfigSection() {
  const [form,   setForm]   = useState({});
  const [saving, setSaving] = useState(false);

  // ── Payroll config — cached 10 min ────────────────────────────────────────
  // refetch() is exposed so the Reset button re-fetches fresh data from the server
  const { data: config = [], isLoading: loading, refetch } = useQuery({
    queryKey:  ["payroll_config"],
    queryFn:   () => baseApi.get("/api/payroll/settings/config").then((r) => r.data || []),
    staleTime: 10 * 60 * 1000,
  });

  // Sync form state whenever config data arrives or changes
  useEffect(() => {
    if (config.length === 0) return;
    const f = {};
    config.forEach((c) => { f[c.key] = c.value; });
    setForm(f);
  }, [config]);

  const handleSave = async () => {
    const confirm = await Swal.fire({
      title: "Save Configuration?", text: "This will affect all future payroll calculations.",
      icon: "warning", showCancelButton: true, confirmButtonText: "Yes, save", confirmButtonColor: "#0d6efd",
    });
    if (!confirm.isConfirmed) return;
    setSaving(true);
    try {
      await baseApi.put("/api/payroll/settings/config", form);
      Swal.fire("Saved", "Payroll configuration updated successfully", "success");
      refetch(); // refresh cache so Reset also picks up the latest saved values
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to save configuration", "error");
    } finally {
      setSaving(false); }
  };

  // Reset: re-fetch from server and re-sync form via the useEffect above
  const handleReset = () => refetch();

  const isPercentage = (key) => key.endsWith("_rate");

  if (loading) return <div className="p-4">Loading configuration...</div>;

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-1">Payroll Configuration</h3>
          <small className="text-muted">
            These values are used in every payroll calculation. Changes take effect on the next payroll run.
          </small>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {config.map((c) => (
            <div key={c.key} className="mb-4">
              <label className="form-label fw-semibold">{c.label}</label>
              <div className="input-group" style={{ maxWidth: 300 }}>
                <input
                  type="number" className="form-control"
                  value={form[c.key] ?? c.value}
                  onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
                  step={isPercentage(c.key) ? "0.01" : "1"} min="0"
                />
                {isPercentage(c.key) && (
                  <span className="input-group-text">
                    {form[c.key] ? `${(parseFloat(form[c.key]) * 100).toFixed(0)}%` : "—"}
                  </span>
                )}
              </div>
              {c.description && <small className="text-muted d-block mt-1">{c.description}</small>}
            </div>
          ))}

          <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
            <button className="btn btn-outline-secondary" onClick={handleReset} disabled={saving}>Reset</button>
            <button className="btn btn-primary px-4" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}