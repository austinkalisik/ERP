import { useState } from "react";
import { MdAdd, MdDelete } from "react-icons/md";
import Swal from "sweetalert2";
import { useSettings } from "../../../contexts/SettingsContext";

// Placeholder types — swap this useQuery call once the backend endpoint is ready:
//
//   const { data: contributionTypes = PLACEHOLDER_TYPES } = useQuery({
//     queryKey:  ["hrms_contribution_types"],
//     queryFn:   () => baseApi.get("/api/hrms/contribution-types").then((r) => r.data || []),
//     staleTime: 30 * 60 * 1000,
//   });
//
const CONTRIBUTION_TYPES = [
  "NASFUND",
  "Income Tax",
  "Union Fee",
  "Health Insurance",
  "Life Insurance",
  "Other",
];

const currentYear = new Date().getFullYear();

const emptyRow = () => ({
  _key:              Date.now() + Math.random(),
  year:              String(currentYear),
  contribution_type: "",
  value_type:        "percentage",  // "percentage" | "amount"
  value:             "",
});

export default function ContributionsTab({ employeeId, onSubmit, onSkip, loading }) {
  const { formatCurrency } = useSettings();
  const [rows, setRows]    = useState([emptyRow()]);

  const addRow    = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (key) => { if (rows.length > 1) setRows((prev) => prev.filter((r) => r._key !== key)); };
  const updateRow = (key, field, value) =>
    setRows((prev) => prev.map((r) => (r._key === key ? { ...r, [field]: value } : r)));

  const handleSave = () => {
    const filledRows = rows.filter((r) => r.contribution_type || r.value);

    if (filledRows.length === 0) {
      Swal.fire({ icon: "warning", title: "No Contributions", text: "Please add at least one contribution or click Skip.", confirmButtonColor: "#f39c12" });
      return;
    }

    const invalid = filledRows.find((r) => !r.contribution_type || !r.value || !r.year);
    if (invalid) {
      Swal.fire({ icon: "warning", title: "Incomplete Row", text: "Each row must have a Year, Contribution Type, and Value.", confirmButtonColor: "#f39c12" });
      return;
    }

    const badPct = filledRows.find((r) => r.value_type === "percentage" && (parseFloat(r.value) < 0 || parseFloat(r.value) > 100));
    if (badPct) {
      Swal.fire({ icon: "warning", title: "Invalid Percentage", text: "Percentage must be between 0 and 100.", confirmButtonColor: "#f39c12" });
      return;
    }

    const payload = filledRows.map(({ _key, ...rest }) => ({
      year:              Number(rest.year),
      contribution_type: rest.contribution_type,
      value_type:        rest.value_type,
      // Store percentage as decimal (6% → 0.06) matching PayrollConfigSection convention
      value: rest.value_type === "percentage"
        ? parseFloat(rest.value) / 100
        : parseFloat(rest.value),
    }));

    onSubmit(payload);
  };

  const handleSkip = () => {
    Swal.fire({
      icon: "question", title: "Skip Contributions?",
      text: "You can add contributions later from the employee profile.",
      showCancelButton: true, confirmButtonText: "Yes, skip",
      confirmButtonColor: "#6c757d", cancelButtonColor: "#0d6efd",
    }).then((r) => { if (r.isConfirmed) onSkip(); });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h5 className="fw-bold mb-1">Contributions</h5>
          <p className="text-muted mb-0" style={{ fontSize: "13px" }}>
            Use <strong>%</strong> for rate-based contributions (e.g. NASFUND 6% of gross) or <strong>Fixed</strong> for flat amounts.
          </p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={addRow} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <MdAdd size={16} /> Add Row
        </button>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-bordered align-middle mb-2">
          <thead className="table-light">
            <tr>
              <th style={{ width: "110px", fontSize: "13px" }}>Year <span className="text-danger">*</span></th>
              <th style={{ fontSize: "13px" }}>Contribution Type <span className="text-danger">*</span></th>
              <th style={{ width: "120px", fontSize: "13px", textAlign: "center" }}>Type</th>
              <th style={{ width: "200px", fontSize: "13px" }}>Value <span className="text-danger">*</span></th>
              <th style={{ width: "52px" }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isPct    = row.value_type === "percentage";
              const numVal   = parseFloat(row.value);
              const hasValue = row.value !== "" && !isNaN(numVal);

              return (
                <tr key={row._key} style={{ backgroundColor: idx % 2 === 0 ? "#f8fafc" : "#fff" }}>

                  {/* Year */}
                  <td>
                    <input
                      type="number" className="form-control form-control-sm"
                      value={row.year} min="2000" max={currentYear + 5}
                      onChange={(e) => updateRow(row._key, "year", e.target.value)}
                      placeholder={String(currentYear)}
                    />
                  </td>

                  {/* Contribution Type */}
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={row.contribution_type}
                      onChange={(e) => updateRow(row._key, "contribution_type", e.target.value)}
                    >
                      <option value="">Select type...</option>
                      {CONTRIBUTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>

                  {/* % / Fixed toggle */}
                  <td style={{ textAlign: "center" }}>
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        type="button"
                        className={`btn ${isPct ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => updateRow(row._key, "value_type", "percentage")}
                        title="Percentage of gross pay"
                        style={{ fontSize: "12px", padding: "3px 10px" }}
                      >
                        %
                      </button>
                      <button
                        type="button"
                        className={`btn ${!isPct ? "btn-primary" : "btn-outline-secondary"}`}
                        onClick={() => updateRow(row._key, "value_type", "amount")}
                        title="Fixed amount"
                        style={{ fontSize: "12px", padding: "3px 10px" }}
                      >
                        Fixed
                      </button>
                    </div>
                  </td>

                  {/* Value input + live preview */}
                  <td>
                    <div className="input-group input-group-sm">
                      <input
                        type="number" className="form-control"
                        value={row.value}
                        min="0"
                        max={isPct ? 100 : undefined}
                        step="0.01"
                        onChange={(e) => updateRow(row._key, "value", e.target.value)}
                        placeholder={isPct ? "e.g. 6" : "e.g. 150.00"}
                      />
                      {/* Suffix badge — % or currency symbol from settings */}
                      <span className="input-group-text" style={{ fontSize: "12px", minWidth: "42px", justifyContent: "center" }}>
                        {isPct ? "%" : formatCurrency(0).replace(/[\d.,\s]/g, "").trim() || "$"}
                      </span>
                    </div>

                    {/* Live preview — mirrors Payroll Config display style */}
                    {hasValue && (
                      <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "3px", paddingLeft: "2px" }}>
                        {isPct
                          ? `${numVal.toFixed(2)}% of gross pay (e.g. 0.${String(Math.round(numVal * 100)).padStart(2, "0")})`
                          : `Fixed: ${formatCurrency(numVal)} per payroll`
                        }
                      </div>
                    )}
                  </td>

                  {/* Remove */}
                  <td className="text-center">
                    <button
                      type="button" className="btn btn-sm btn-outline-danger"
                      onClick={() => removeRow(row._key)}
                      disabled={rows.length === 1}
                      title="Remove row"
                    >
                      <MdDelete size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Dashed add button */}
      <button
        type="button" onClick={addRow}
        style={{ width: "100%", border: "2px dashed #d1d5db", borderRadius: "8px", backgroundColor: "transparent", padding: "10px", fontSize: "13px", color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: "500", marginBottom: "20px" }}
      >
        <MdAdd size={16} /> Add Another Row
      </button>

      {/* Tip */}
      <div className="alert alert-info py-2 mb-4" style={{ fontSize: "13px" }}>
        <strong>Tip:</strong> Percentage contributions (e.g. NASFUND 6%) are calculated against gross pay each payroll run. Fixed amounts are deducted as a flat value regardless of salary.
      </div>

      {/* Actions */}
      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-outline-secondary" onClick={handleSkip} disabled={loading}>
          Skip
        </button>
        <button
          type="button" className="btn btn-primary" onClick={handleSave} disabled={loading}
          style={{ padding: "10px 40px", borderRadius: "8px", fontSize: "15px", fontWeight: "500" }}
        >
          {loading ? "Saving..." : "Save & Finish"}
        </button>
      </div>
    </div>
  );
}