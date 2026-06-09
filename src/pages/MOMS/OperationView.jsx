import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { useAuth } from "../../contexts/AuthContext";
import { useSettings } from "../../contexts/SettingsContext";
import { can } from "../../utils/permissions";
import {
  MdArrowBack, MdToday, MdPerson, MdPrecisionManufacturing,
  MdAccessTime, MdTimer, MdLocalGasStation, MdLocationOn, MdBusiness, MdEdit,
} from "react-icons/md";

const DEPARTMENTS = [
  "Mine Operations", "Civil & Infrastructure", "Plant & Equipment",
  "Drill & Blast", "Logistics & Transport", "Health Safety & Environment",
  "Maintenance", "Administration",
];

const PRODUCTION_UNITS = ["Tons", "BCM", "Trips", "Loads", "km", "Hours", "Other"];

const STATUS_COLORS = {
  "In Progress":      { bg: "#dbeafe", text: "#1e40af" },
  "Completed":        { bg: "#d1fae5", text: "#065f46" },
  "Pending Approval": { bg: "#fef3c7", text: "#92400e" },
  "Approved":         { bg: "#dcfce7", text: "#166534" },
  "Cancelled":        { bg: "#fee2e2", text: "#991b1b" },
};

export default function OperationView() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { permissions } = useAuth();
  const { formatDate, formatDateTime } = useSettings();
  const queryClient  = useQueryClient();
  const canEdit      = can(permissions, "moms.operations.approve");

  const [editMode, setEditMode] = useState(false);
  const [form,     setForm]     = useState({});
  const [formInit, setFormInit] = useState(false);
  const [saving,   setSaving]   = useState(false);

  // ── Single operation — cached 2 min per ID ────────────────────────────────
  const opCacheKey = ["moms_operation", id];
  const { data: rawData, isLoading: loading } = useQuery({
    queryKey:  opCacheKey,
    queryFn:   () => baseApi.get(`/api/moms/operations/${id}`).then((r) => r.data?.operation || r.data?.data || r.data || null),
    staleTime: 2 * 60 * 1000,
    enabled:   !!id,
  });

  const operation = rawData || null;

  // Pre-fill form once (guard prevents overwrite on stale re-renders)
  useEffect(() => {
    if (!operation || formInit) return;
    setFormInit(true);
    initForm(operation);
  }, [operation]);

  const initForm = (op) => {
    setForm({
      machine_asset_no:       op.machine_asset_no        || "",
      machine_description:    op.machine_description     || "",
      operator:               op.operator                || "",
      location:               op.location                || "",
      department:             op.department              || "",
      starting_hour_meter:    op.starting_hour_meter     ?? "",
      ending_hour_meter:      op.ending_hour_meter       ?? "",
      starting_odometer:      op.starting_odometer       ?? "",
      ending_odometer:        op.ending_odometer         ?? "",
      fuel_level_observed:    op.fuel_level_observed     || "",
      estimated_fuel_in_tank: op.estimated_fuel_in_tank  ?? "",
      fuel_consumed:          op.fuel_consumed           ?? "",
      ready_hours:            op.ready_hours             ?? "",
      standby_hours:          op.standby_hours           ?? "",
      breakdown_hours:        op.breakdown_hours         ?? "",
      pm_hours:               op.pm_hours                ?? "",
      delay_reason:           op.delay_reason            || "",
      production_unit:        op.production_unit         || "",
      production_quantity:    op.production_quantity     ?? "",
      tons:                   op.tons                    ?? "",
      trips:                  op.trips                   ?? "",
      operator_remarks:       op.operator_remarks        || "",
      end_shift_notes:        op.end_shift_notes         || "",
      checklist_notes:        op.checklist_notes         || "",
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await baseApi.put(`/api/moms/operations/${id}`, form);
      queryClient.invalidateQueries({ queryKey: opCacheKey });
      queryClient.invalidateQueries({ queryKey: ["moms_daily_ops"] });
      setFormInit(false); // allow re-init from fresh cache data
      setEditMode(false);
    } catch (e) {
      console.error("Save error:", e);
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (operation) initForm(operation);
    setEditMode(false);
  };

  const f   = (k) => form[k] ?? "";
  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const fmt     = (n, d = 2) => (n != null && n !== "" ? parseFloat(n).toFixed(d) : null);
  const fmtDate = (d) => (d ? formatDate(d) : null);
  const fmtDT   = (d) => (d ? formatDateTime(d) : null);

  const InfoRow = ({ label, value }) => (
    <div style={{ marginBottom: "20px" }}>
      <p style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{label}</p>
      <p style={{ fontSize: "15px", fontWeight: "500", marginBottom: 0, color: "#111827" }}>{value ?? <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Not provided</span>}</p>
    </div>
  );

  const EditField = ({ label, fieldKey, type = "text", unit }) => (
    <div style={{ marginBottom: "20px" }}>
      <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>{label}</label>
      <div className="input-group input-group-sm">
        <input type={type} className="form-control" value={f(fieldKey)} onChange={(e) => set(fieldKey, e.target.value)} style={{ borderRadius: unit ? "6px 0 0 6px" : "6px" }} />
        {unit && <span className="input-group-text" style={{ fontSize: "12px" }}>{unit}</span>}
      </div>
    </div>
  );

  const EditSelect = ({ label, fieldKey, options }) => (
    <div style={{ marginBottom: "20px" }}>
      <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>{label}</label>
      <select className="form-select form-select-sm" value={f(fieldKey)} onChange={(e) => set(fieldKey, e.target.value)} style={{ borderRadius: "6px" }}>
        <option value="">— Select —</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const EditTextarea = ({ label, fieldKey, rows = 2 }) => (
    <div style={{ marginBottom: "20px" }}>
      <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>{label}</label>
      <textarea className="form-control form-control-sm" rows={rows} value={f(fieldKey)} onChange={(e) => set(fieldKey, e.target.value)} style={{ borderRadius: "6px" }} />
    </div>
  );

  const DERBox = ({ label, value, unit = "hrs", color }) => (
    <div style={{ background: color === "green" ? "#d1fae5" : color === "red" ? "#fee2e2" : "#f8fafc", borderRadius: "10px", padding: "14px 16px", textAlign: "center" }}>
      <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: color === "green" ? "#065f46" : color === "red" ? "#991b1b" : "#6b7280", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "22px", fontWeight: "bold", color: color === "green" ? "#065f46" : color === "red" ? "#991b1b" : "#1e293b" }}>{value != null ? `${value}` : "—"}</div>
      {unit && value != null && <div style={{ fontSize: "11px", color: color === "green" ? "#065f46" : color === "red" ? "#991b1b" : "#6b7280" }}>{unit}</div>}
    </div>
  );

  if (loading) return <Layout><div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}><div className="spinner-border text-primary" /></div></Layout>;
  if (!operation) return <Layout><div className="container-fluid px-4 py-5 text-center"><p className="text-muted">Operation not found.</p><button className="btn btn-primary mt-2" onClick={() => navigate("/moms/operations/daily-ops")}>Back to Daily Ops</button></div></Layout>;

  const statusStyle    = STATUS_COLORS[operation.status] || { bg: "#f3f4f6", text: "#374151" };
  const operatingHours = operation.ending_hour_meter && operation.starting_hour_meter
    ? fmt(parseFloat(operation.ending_hour_meter) - parseFloat(operation.starting_hour_meter))
    : null;
  const hoursAvailable   = fmt(operation.hours_available);
  const hoursUnavailable = fmt(operation.hours_unavailable);

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        {/* Header */}
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
          <div>
            <button className="btn btn-link p-0 mb-2 text-muted d-inline-flex align-items-center gap-1" style={{ fontSize: "14px", textDecoration: "none" }} onClick={() => navigate("/moms/operations/daily-ops")}>
              <MdArrowBack size={16} /> Back to Daily Ops
            </button>
            <div className="d-flex align-items-center gap-3 mt-1">
              <div style={{ width: "48px", height: "48px", backgroundColor: "#3b82f6", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MdToday size={24} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontWeight: "bold", fontSize: "clamp(18px,4vw,26px)", marginBottom: "4px" }}>Operation #{operation.id}</h1>
                <p className="text-muted mb-0" style={{ fontSize: "14px" }}>{operation.machine_asset_no || "—"} &mdash; {operation.operator || "—"}</p>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 mt-3 mt-md-4 flex-wrap">
            <span style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, padding: "8px 16px", borderRadius: "8px", fontWeight: "600", fontSize: "14px" }}>{operation.status}</span>
            {canEdit && !editMode && (
              <button className="btn btn-sm d-flex align-items-center gap-1" style={{ backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", fontWeight: "500" }} onClick={() => setEditMode(true)}>
                <MdEdit size={16} /> Edit
              </button>
            )}
            {editMode && (
              <>
                <button className="btn btn-sm btn-outline-secondary" style={{ borderRadius: "8px" }} onClick={handleCancel} disabled={saving}>Cancel</button>
                <button className="btn btn-sm d-flex align-items-center gap-1" style={{ backgroundColor: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", fontWeight: "500" }} onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>

        {editMode && (
          <div className="alert alert-warning d-flex align-items-center gap-2 mb-3 py-2" style={{ borderRadius: "8px", fontSize: "13px" }}>
            <MdEdit size={16} /><span>You are in <strong>edit mode</strong>. Make your changes below and click <strong>Save Changes</strong>.</span>
          </div>
        )}

        {/* DER Summary strip */}
        <div className="row g-2 mb-4">
          <div className="col-6 col-md"><DERBox label="Operating Hrs"   value={operatingHours}   unit="hrs" /></div>
          <div className="col-6 col-md"><DERBox label="Hrs Available"   value={hoursAvailable}   unit="hrs" color="green" /></div>
          <div className="col-6 col-md"><DERBox label="Hrs Unavailable" value={hoursUnavailable} unit="hrs" color="red" /></div>
          <div className="col-6 col-md"><DERBox label="Total Tons"      value={fmt(operation.tons, 0)} unit="t" /></div>
          <div className="col-6 col-md"><DERBox label="Fuel Consumed"   value={fmt(operation.fuel_consumed)} unit="L" /></div>
        </div>

        <div className="row g-3">
          {/* Main */}
          <div className="col-12 col-lg-8">
            {/* Operation Details */}
            <div className="card shadow-sm mb-3" style={{ borderRadius: "12px" }}>
              <div className="card-body p-4">
                <h5 style={{ fontWeight: "700", marginBottom: "20px", fontSize: "16px" }}>Operation Details</h5>
                <div className="row">
                  <div className="col-sm-6"><InfoRow label="Date"   value={fmtDate(operation.shift_start_time)} /></div>
                  <div className="col-sm-6"><InfoRow label="Status" value={<span style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, padding: "5px 12px", borderRadius: "6px", fontWeight: "600", fontSize: "13px" }}>{operation.status}</span>} /></div>
                  {editMode ? (
                    <>
                      <div className="col-sm-6"><EditField label="Operator"            fieldKey="operator" /></div>
                      <div className="col-sm-6"><EditField label="Machine (Asset No)"  fieldKey="machine_asset_no" /></div>
                      <div className="col-sm-6"><EditField label="Machine Description" fieldKey="machine_description" /></div>
                      <div className="col-sm-6"><EditField label="Location"            fieldKey="location" /></div>
                      <div className="col-sm-6"><EditSelect label="Department" fieldKey="department" options={DEPARTMENTS} /></div>
                    </>
                  ) : (
                    <>
                      <div className="col-sm-6"><InfoRow label="Operator"            value={operation.operator} /></div>
                      <div className="col-sm-6"><InfoRow label="Machine (Asset No)"  value={<span style={{ color: "#3b82f6", fontWeight: "600" }}>{operation.machine_asset_no || null}</span>} /></div>
                      <div className="col-sm-6"><InfoRow label="Machine Description" value={operation.machine_description} /></div>
                      <div className="col-sm-6"><InfoRow label="Location"            value={operation.location} /></div>
                      <div className="col-sm-6"><InfoRow label="Department"          value={operation.department} /></div>
                    </>
                  )}
                  <div className="col-sm-6"><InfoRow label="Shift Started" value={fmtDT(operation.shift_start_time)} /></div>
                  <div className="col-sm-6"><InfoRow label="Shift Ended"   value={fmtDT(operation.shift_end_time)} /></div>
                  <div className="col-sm-6"><InfoRow label="Assignment"    value={operation.assignment_title || (operation.assignment_id ? `#${operation.assignment_id}` : null)} /></div>
                </div>
              </div>
            </div>

            {/* Hour Meter & Fuel */}
            <div className="card shadow-sm mb-3" style={{ borderRadius: "12px" }}>
              <div className="card-body p-4">
                <h5 style={{ fontWeight: "700", marginBottom: "20px", fontSize: "16px" }}>Hour Meter & Fuel</h5>
                <div className="row">
                  {editMode ? (
                    <>
                      <div className="col-sm-4"><EditField label="Starting Hour Meter" fieldKey="starting_hour_meter" type="number" unit="hrs" /></div>
                      <div className="col-sm-4"><EditField label="Ending Hour Meter"   fieldKey="ending_hour_meter"   type="number" unit="hrs" /></div>
                      <div className="col-sm-4"><InfoRow label="Operating Hours" value={f("ending_hour_meter") && f("starting_hour_meter") ? `${fmt(parseFloat(f("ending_hour_meter")) - parseFloat(f("starting_hour_meter")))} hrs` : null} /></div>
                      <div className="col-sm-4"><EditField label="Starting Odometer"   fieldKey="starting_odometer"   type="number" unit="km" /></div>
                      <div className="col-sm-4"><EditField label="Ending Odometer"     fieldKey="ending_odometer"     type="number" unit="km" /></div>
                      <div className="col-sm-4"><EditField label="Fuel Level Observed" fieldKey="fuel_level_observed" /></div>
                      <div className="col-sm-4"><EditField label="Est. Fuel in Tank"   fieldKey="estimated_fuel_in_tank" type="number" unit="L" /></div>
                      <div className="col-sm-4"><EditField label="Fuel Consumed"       fieldKey="fuel_consumed"       type="number" unit="L" /></div>
                    </>
                  ) : (
                    <>
                      <div className="col-sm-4"><InfoRow label="Starting Hour Meter" value={operation.starting_hour_meter ? `${operation.starting_hour_meter} hrs` : null} /></div>
                      <div className="col-sm-4"><InfoRow label="Ending Hour Meter"   value={operation.ending_hour_meter   ? `${operation.ending_hour_meter} hrs`   : null} /></div>
                      <div className="col-sm-4"><InfoRow label="Operating Hours"     value={operatingHours ? `${operatingHours} hrs` : null} /></div>
                      <div className="col-sm-4"><InfoRow label="Starting Odometer"   value={operation.starting_odometer  ? `${operation.starting_odometer} km` : null} /></div>
                      <div className="col-sm-4"><InfoRow label="Ending Odometer"     value={operation.ending_odometer    ? `${operation.ending_odometer} km`   : null} /></div>
                      <div className="col-sm-4"><InfoRow label="Fuel Level Observed" value={operation.fuel_level_observed} /></div>
                      <div className="col-sm-4"><InfoRow label="Est. Fuel in Tank"   value={operation.estimated_fuel_in_tank ? `${operation.estimated_fuel_in_tank} L` : null} /></div>
                      <div className="col-sm-4"><InfoRow label="Fuel Consumed"       value={operation.fuel_consumed ? `${fmt(operation.fuel_consumed)} L` : null} /></div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Hour Accounting */}
            <div className="card shadow-sm mb-3" style={{ borderRadius: "12px" }}>
              <div className="card-body p-4">
                <h5 style={{ fontWeight: "700", marginBottom: "16px", fontSize: "16px" }}>Hour Accounting</h5>
                {editMode ? (
                  <div className="row">
                    <div className="col-sm-3"><EditField label="Ready Hrs"     fieldKey="ready_hours"     type="number" unit="hrs" /></div>
                    <div className="col-sm-3"><EditField label="Standby Hrs"   fieldKey="standby_hours"   type="number" unit="hrs" /></div>
                    <div className="col-sm-3"><EditField label="Breakdown Hrs" fieldKey="breakdown_hours" type="number" unit="hrs" /></div>
                    <div className="col-sm-3"><EditField label="PM Hrs"        fieldKey="pm_hours"        type="number" unit="hrs" /></div>
                    <div className="col-12"><EditTextarea label="Delay / Breakdown Reason" fieldKey="delay_reason" /></div>
                  </div>
                ) : (
                  <>
                    <div className="row g-2 mb-3">
                      <div className="col-6 col-md-3"><DERBox label="Ready Hrs"     value={fmt(operation.ready_hours)}     unit="hrs" color="green" /></div>
                      <div className="col-6 col-md-3"><DERBox label="Standby Hrs"   value={fmt(operation.standby_hours)}   unit="hrs" color="green" /></div>
                      <div className="col-6 col-md-3"><DERBox label="Breakdown Hrs" value={fmt(operation.breakdown_hours)} unit="hrs" color="red" /></div>
                      <div className="col-6 col-md-3"><DERBox label="PM Hrs"        value={fmt(operation.pm_hours)}        unit="hrs" color="red" /></div>
                    </div>
                    {operation.delay_reason && <InfoRow label="Delay / Breakdown Reason" value={operation.delay_reason} />}
                  </>
                )}
              </div>
            </div>

            {/* Production */}
            <div className="card shadow-sm mb-3" style={{ borderRadius: "12px" }}>
              <div className="card-body p-4">
                <h5 style={{ fontWeight: "700", marginBottom: "20px", fontSize: "16px" }}>Production</h5>
                <div className="row">
                  {editMode ? (
                    <>
                      <div className="col-sm-4"><EditSelect label="Production Unit"     fieldKey="production_unit"     options={PRODUCTION_UNITS} /></div>
                      <div className="col-sm-4"><EditField  label="Production Quantity" fieldKey="production_quantity" type="number" /></div>
                      <div className="col-sm-4"><EditField  label="Tons"               fieldKey="tons"               type="number" unit="t" /></div>
                      <div className="col-sm-4"><EditField  label="Trips"              fieldKey="trips"              type="number" /></div>
                    </>
                  ) : (
                    <>
                      <div className="col-sm-4"><InfoRow label="Production Unit"     value={operation.production_unit} /></div>
                      <div className="col-sm-4"><InfoRow label="Production Quantity" value={operation.production_quantity ? `${fmt(operation.production_quantity)} ${operation.production_unit || ""}` : null} /></div>
                      <div className="col-sm-4"><InfoRow label="Tons"  value={operation.tons  ? `${fmt(operation.tons, 2)} t`   : null} /></div>
                      <div className="col-sm-4"><InfoRow label="Trips" value={operation.trips} /></div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="card shadow-sm mb-3" style={{ borderRadius: "12px" }}>
              <div className="card-body p-4">
                <h5 style={{ fontWeight: "700", marginBottom: "20px", fontSize: "16px" }}>Notes & Remarks</h5>
                {editMode ? (
                  <div className="row">
                    <div className="col-12"><EditTextarea label="Checklist Notes"    fieldKey="checklist_notes"  rows={2} /></div>
                    <div className="col-12"><EditTextarea label="Operator Remarks"   fieldKey="operator_remarks" rows={2} /></div>
                    <div className="col-12"><EditTextarea label="End of Shift Notes" fieldKey="end_shift_notes"  rows={2} /></div>
                  </div>
                ) : (
                  <>
                    {operation.checklist_notes  && <InfoRow label="Checklist Notes"    value={operation.checklist_notes} />}
                    {operation.operator_remarks && <InfoRow label="Operator Remarks"   value={operation.operator_remarks} />}
                    {operation.end_shift_notes  && <InfoRow label="End of Shift Notes" value={operation.end_shift_notes} />}
                    {!operation.checklist_notes && !operation.operator_remarks && !operation.end_shift_notes && (
                      <p className="text-muted" style={{ fontStyle: "italic", fontSize: "14px" }}>No notes recorded.</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Side Summary */}
          <div className="col-12 col-lg-4">
            <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-body p-4">
                <h5 style={{ fontWeight: "700", marginBottom: "20px", fontSize: "16px" }}>Summary</h5>
                {[
                  { icon: <MdToday size={18} color="#3b82f6" />,                 label: "Date",        value: fmtDate(operation.shift_start_time) || "N/A" },
                  { icon: <MdPerson size={18} color="#16a34a" />,                 label: "Operator",    value: operation.operator || "N/A" },
                  { icon: <MdPrecisionManufacturing size={18} color="#0ea5e9" />, label: "Machine",     value: operation.machine_asset_no || "N/A" },
                  { icon: <MdAccessTime size={18} color="#f59e0b" />,             label: "Start Meter", value: operation.starting_hour_meter ? `${operation.starting_hour_meter} hrs` : "N/A" },
                  { icon: <MdTimer size={18} color="#8b5cf6" />,                  label: "Op. Hours",   value: operatingHours ? `${operatingHours} hrs` : "N/A" },
                  { icon: <MdLocalGasStation size={18} color="#ef4444" />,        label: "Fuel",        value: operation.fuel_consumed ? `${fmt(operation.fuel_consumed)} L` : "N/A" },
                  { icon: <MdLocationOn size={18} color="#06b6d4" />,             label: "Location",    value: operation.location || "N/A" },
                  { icon: <MdBusiness size={18} color="#64748b" />,               label: "Department",  value: operation.department || "N/A" },
                ].map((item, i) => (
                  <div key={i} className="d-flex align-items-center gap-3 mb-3">
                    <div style={{ width: "36px", height: "36px", backgroundColor: "#f8fafc", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.icon}</div>
                    <div>
                      <p style={{ fontSize: "11px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", marginBottom: "2px" }}>{item.label}</p>
                      <p style={{ fontSize: "14px", fontWeight: "500", marginBottom: 0 }}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}