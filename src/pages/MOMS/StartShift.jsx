import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { Form, Alert } from "react-bootstrap";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";
import { MdSearch, MdClose } from "react-icons/md";

const DEPARTMENTS = [
  "Mine Operations", "Civil & Infrastructure", "Plant & Equipment",
  "Drill & Blast", "Logistics & Transport", "Health, Safety & Environment",
  "Maintenance", "Administration",
];

const FUEL_LEVELS = ["Full", "3/4", "1/2", "1/4", "Empty"];

function SearchableSelect({ options = [], value, onChange, placeholder = "Search...", disabled = false }) {
  const [query, setQuery] = useState("");
  const [open,  setOpen]  = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedLabel = options.find((o) => String(o.value) === String(value))?.label || "";
  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  const handleOpen   = () => { if (!disabled) { setQuery(""); setOpen(true); } };
  const handleSelect = (opt) => { onChange(opt.value); setQuery(""); setOpen(false); };
  const handleClear  = (e) => { e.stopPropagation(); onChange(""); setQuery(""); };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div onClick={handleOpen} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: "38px", padding: "0 10px",
        border: "1px solid #ced4da", borderRadius: "6px",
        backgroundColor: disabled ? "#f1f5f9" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: "14px", color: selectedLabel ? "#212529" : "#6c757d", userSelect: "none",
      }}>
        {disabled && <span style={{ color: "#16a34a", marginRight: "6px" }}>🔒</span>}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {selectedLabel || placeholder}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
          {value && !disabled && <MdClose size={14} color="#9ca3af" onClick={handleClear} style={{ cursor: "pointer" }} />}
          {!disabled && <span style={{ color: "#9ca3af", fontSize: "10px", marginLeft: "2px" }}>▼</span>}
        </div>
      </div>

      {open && (
        <div style={{ position: "absolute", zIndex: 9999, top: "calc(100% + 4px)", left: 0, right: 0, backgroundColor: "#fff", border: "1px solid #ced4da", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden" }}>
          <div style={{ padding: "8px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: "6px" }}>
            <MdSearch size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type to search..."
              style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", background: "transparent" }} />
            {query && <MdClose size={14} color="#9ca3af" style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => setQuery("")} />}
          </div>
          <div style={{ maxHeight: "220px", overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "12px 14px", fontSize: "13px", color: "#9ca3af", textAlign: "center" }}>No results found</div>
            ) : filtered.map((opt) => (
              <div key={opt.value} onClick={() => handleSelect(opt)}
                style={{ padding: "9px 14px", fontSize: "13px", cursor: "pointer", backgroundColor: String(opt.value) === String(value) ? "#eff6ff" : "transparent", color: String(opt.value) === String(value) ? "#1d4ed8" : "#212529", fontWeight: String(opt.value) === String(value) ? "600" : "400" }}
                onMouseEnter={(e) => { if (String(opt.value) !== String(value)) e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                onMouseLeave={(e) => { if (String(opt.value) !== String(value)) e.currentTarget.style.backgroundColor = "transparent"; }}>
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StartShift() {
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const isOperator = user?.role === "moms_operator";

  const [saving,           setSaving]           = useState(false);
  const [checklistItems,   setChecklistItems]   = useState([]);
  const [checklistAnswers, setChecklistAnswers] = useState({});
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [formData, setFormData] = useState({
    operator_id:           "",
    machine_id:            "",
    starting_hour_meter:   "",
    starting_odometer:     "",
    fuel_level_observed:   "",
    estimated_fuel_in_tank:"",
    location:              "",
    department:            "",
    checklist_notes:       "",
    operator_remarks:      "",
  });

  const { data: operatorsRaw = [], isLoading: opsLoading } = useQuery({
    queryKey: ["moms_operators"],
    queryFn:  () => baseApi.get("/api/moms/operators").then((r) => r.data?.data || r.data || []),
    staleTime: 5 * 60 * 1000,
  });

  const { data: machinesRaw = [], isLoading: machLoading } = useQuery({
    queryKey: ["moms_machines"],
    queryFn:  () => baseApi.get("/api/moms/machines").then((r) => r.data?.data || r.data),
    staleTime: 5 * 60 * 1000,
  });

  const operators = Array.isArray(operatorsRaw) ? operatorsRaw : [];
  const machines  = Array.isArray(machinesRaw)  ? machinesRaw  : [];
  const loading   = opsLoading || machLoading;

  const linkedOperator = isOperator && user?.id
    ? operators.find((op) => op.user_id === user.id) || null
    : null;

  const operatorId = isOperator && linkedOperator ? linkedOperator.id : formData.operator_id;

  const getOperatorName = (op) => op.user_name || op.user?.name || op.name || `Operator ${op.id}`;
  const getMachineName  = (m)  => `${m.machine_id || `Machine ${m.id}`} ${m.make || ""} ${m.model || ""}`.trim();

  const operatorOptions = operators.map((op) => ({ value: String(op.id), label: getOperatorName(op) }));
  const machineOptions  = machines.map((m)   => ({ value: String(m.id), label: getMachineName(m) }));

  const handleMachineChange = async (machineId) => {
    setFormData((prev) => ({ ...prev, machine_id: machineId }));
    if (!machineId) { setChecklistItems([]); setChecklistAnswers({}); setSelectedCategory(""); return; }
    const machine = machines.find((m) => String(m.id) === String(machineId));
    if (!machine?.category) return;
    const category = machine.category;
    setSelectedCategory(category); setChecklistItems([]); setChecklistAnswers({});
    setChecklistLoading(true);
    try {
      const res   = await baseApi.get(`/api/moms/checklist-templates/by-category/${encodeURIComponent(category)}`);
      const items = res.data?.items || [];
      setChecklistItems(items);
      const init = {};
      items.forEach((item) => { init[item.id] = null; });
      setChecklistAnswers(init);
    } catch {
      Swal.fire("Warning", `Could not load checklist for ${category}. Please try again.`, "warning");
    } finally { setChecklistLoading(false); }
  };

  const handleInputChange     = (e) => { const { name, value } = e.target; setFormData((prev) => ({ ...prev, [name]: value })); };
  const handleChecklistAnswer = (itemId, value) => setChecklistAnswers((prev) => ({ ...prev, [itemId]: value }));

  const allAnswered   = checklistItems.length > 0 && checklistItems.every((item) => checklistAnswers[item.id] !== null);
  const failedItems   = checklistItems.filter((item) => checklistAnswers[item.id] === "Fail");
  const hasFailed     = failedItems.length > 0;
  const answeredCount = Object.values(checklistAnswers).filter((v) => v !== null).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isOperator && !linkedOperator) {
      Swal.fire({ icon: "error", title: "No Operator Profile", text: "Your account is not linked to an operator profile. Please contact your manager.", confirmButtonColor: "#3b82f6" });
      return;
    }
    if (!formData.machine_id)          { Swal.fire("Missing Field", "Please select a machine.", "warning"); return; }
    if (!formData.starting_hour_meter) { Swal.fire("Missing Field", "Starting hour meter is required.", "warning"); return; }
    if (!formData.fuel_level_observed) { Swal.fire("Missing Field", "Fuel level observed is required.", "warning"); return; }
    if (checklistItems.length > 0 && !allAnswered) {
      Swal.fire({ icon: "warning", title: "Incomplete Checklist", text: `Please complete all safety checklist items. (${answeredCount}/${checklistItems.length} answered)`, confirmButtonColor: "#3b82f6" });
      return;
    }
    if (hasFailed) {
      const confirm = await Swal.fire({
        icon: "warning", title: "Failed Safety Items",
        html: `The following items failed inspection:<br><br><strong>${failedItems.map((i) => i.item_text).join("<br>")}</strong><br><br>Do you still want to proceed?`,
        showCancelButton: true, confirmButtonColor: "#16a34a", cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, proceed", cancelButtonText: "Go back",
      });
      if (!confirm.isConfirmed) return;
    }

    const checklistPayload = checklistItems.map((item) => ({
      item_id: item.id, item_number: item.item_number, item_text: item.item_text, answer: checklistAnswers[item.id],
    }));

    try {
      setSaving(true);
      const res = await baseApi.post("/api/moms/operations/start-shift", {
        ...formData,
        operator_id: isOperator ? operatorId : formData.operator_id,
        checklist:   checklistPayload,
      });
      await Swal.fire({ icon: "success", title: "Shift Started!", text: "Your shift has been started successfully.", confirmButtonColor: "#16a34a", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      navigate(`/moms/operations/${res.data.operation?.id || ""}`);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed to Start Shift", text: err.response?.data?.message || "Something went wrong.", confirmButtonColor: "#3b82f6" });
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container-fluid px-3 px-md-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
            <p className="mt-3 text-muted">Loading shift form...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">

        {/* Header */}
        <div className="row mb-3 mb-md-4 align-items-center">
          <div className="col">
            <h1 style={{ fontWeight: "bold", fontSize: "clamp(20px, 5vw, 28px)" }}>Start Shift</h1>
          </div>
          <div className="col-auto">
            <button className="btn btn-primary"
              style={{ height: "42px", fontSize: "15px", fontWeight: "500", borderRadius: "8px" }}
              onClick={() => navigate("/moms/operations/daily-ops")}>
              View Operations History
            </button>
          </div>
        </div>

        <Alert variant="info" className="mb-4">
          <strong>💡 Tip:</strong> Once you start your shift, a floating widget will appear in the bottom-right corner showing your active shift status.
        </Alert>

        {isOperator && !linkedOperator && (
          <Alert variant="danger" className="mb-4">
            <strong>⚠️ No Operator Profile Found.</strong> Your account is not linked to an operator profile. Please contact your manager.
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>

          {/* Card 1: Pre-Start Info */}
          <div className="card shadow-sm mb-4" style={{ borderRadius: "12px" }}>
            <div className="card-body p-4">
              <h5 style={{ fontWeight: "600", marginBottom: "8px" }}>Pre-Start Shift Checklist</h5>
              <p className="text-muted mb-4">Complete this form to begin your shift</p>

              <div className="row">
                {/* Operator */}
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: "500" }}>Operator <span style={{ color: "red" }}>*</span></Form.Label>
                    {isOperator ? (
                      <>
                        <Form.Text className="d-block text-muted mb-2">Logged in as operator</Form.Text>
                        <SearchableSelect
                          options={operatorOptions}
                          value={linkedOperator ? String(linkedOperator.id) : ""}
                          onChange={() => {}}
                          placeholder="No operator profile linked"
                          disabled
                        />
                      </>
                    ) : (
                      <>
                        <Form.Text className="d-block text-muted mb-2">Select the operator for this shift</Form.Text>
                        <SearchableSelect
                          options={operatorOptions}
                          value={formData.operator_id}
                          onChange={(v) => setFormData((p) => ({ ...p, operator_id: v }))}
                          placeholder="Search operator..."
                        />
                        {operators.length === 0 && <Form.Text className="text-warning">No operators available.</Form.Text>}
                      </>
                    )}
                  </Form.Group>
                </div>

                {/* Machine */}
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: "500" }}>Select Machine <span style={{ color: "red" }}>*</span></Form.Label>
                    <SearchableSelect
                      options={machineOptions}
                      value={formData.machine_id}
                      onChange={handleMachineChange}
                      placeholder="Search machine..."
                    />
                    {machines.length === 0 && <Form.Text className="text-warning">No machines available.</Form.Text>}
                    {selectedCategory && <Form.Text className="text-success fw-semibold">✓ {selectedCategory} checklist loaded</Form.Text>}
                  </Form.Group>
                </div>
              </div>

              {/* Location & Department */}
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: "500" }}>Work Location</Form.Label>
                    <Form.Control type="text" name="location" value={formData.location}
                      onChange={handleInputChange} placeholder="e.g. Mt Bini South, Pit 3..."
                      style={{ fontSize: "14px" }} />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: "500" }}>Department</Form.Label>
                    <Form.Select name="department" value={formData.department}
                      onChange={handleInputChange} style={{ fontSize: "14px", color: "#000" }}>
                      <option value="">-- Select Department --</option>
                      {DEPARTMENTS.map((d) => <option key={d} value={d} style={{ color: "#000" }}>{d}</option>)}
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>

              {/* Initial Readings */}
              <h6 style={{ fontWeight: "600", marginBottom: "16px", marginTop: "8px" }}>Initial Readings</h6>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: "500" }}>Starting Hour Meter (hours) <span style={{ color: "red" }}>*</span></Form.Label>
                    <Form.Control type="number" step="0.1" name="starting_hour_meter"
                      value={formData.starting_hour_meter} onChange={handleInputChange}
                      required placeholder="e.g. 4215.5" />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: "500" }}>Starting Odometer (km) — Optional</Form.Label>
                    <Form.Control type="number" step="0.1" name="starting_odometer"
                      value={formData.starting_odometer} onChange={handleInputChange} />
                  </Form.Group>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: "500" }}>Fuel Level Observed <span style={{ color: "red" }}>*</span></Form.Label>
                    <Form.Select name="fuel_level_observed" value={formData.fuel_level_observed}
                      onChange={handleInputChange} required style={{ color: "#000" }}>
                      <option value="">-- Select Level --</option>
                      {FUEL_LEVELS.map((level) => <option key={level} value={level} style={{ color: "#000" }}>{level}</option>)}
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: "500" }}>Estimated Fuel in Tank (liters)</Form.Label>
                    <Form.Control type="number" step="0.1" name="estimated_fuel_in_tank"
                      value={formData.estimated_fuel_in_tank} onChange={handleInputChange} />
                  </Form.Group>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Safety Checklist */}
          <div className="card shadow-sm mb-4" style={{ borderRadius: "12px" }}>
            <div className="card-body p-4">
              <h6 style={{ fontWeight: "600", marginBottom: "4px" }}>
                Pre-Start Safety Checklist
                {selectedCategory && (
                  <span className="ms-2 badge bg-primary" style={{ fontSize: "12px", fontWeight: "500" }}>
                    {selectedCategory}
                  </span>
                )}
              </h6>
              <p className="text-muted mb-3" style={{ fontSize: "13px" }}>
                {!formData.machine_id       ? "Select a machine above to load the checklist"
                  : checklistLoading        ? "Loading checklist..."
                  : checklistItems.length === 0 ? "No checklist found for this machine type"
                  : `${answeredCount} of ${checklistItems.length} items answered`}
              </p>

              {!formData.machine_id && (
                <div className="text-center py-4 mb-2" style={{ backgroundColor: "#f8fafc", borderRadius: "8px", border: "2px dashed #e2e8f0" }}>
                  <p className="text-muted mb-0" style={{ fontSize: "14px" }}>🔧 Select a machine above to load the pre-start checklist</p>
                </div>
              )}

              {checklistLoading && (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                  <span className="text-muted" style={{ fontSize: "14px" }}>Loading {selectedCategory} checklist...</span>
                </div>
              )}

              {hasFailed && (
                <Alert variant="warning" className="mb-3">
                  ⚠️ One or more items have <strong>FAILED</strong>. You can still submit, but a supervisor will be notified.
                </Alert>
              )}

              {!checklistLoading && checklistItems.map((item) => (
                <div key={item.id} className="mb-3">
                  <div className="d-flex align-items-center gap-4">
                    <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: "600", minWidth: "28px", textAlign: "right", flexShrink: 0 }}>
                      {item.item_number}.
                    </span>
                    <Form.Check type="radio" label="Pass" name={`checklist_item_${item.id}`}
                      checked={checklistAnswers[item.id] === "Pass"}
                      onChange={() => handleChecklistAnswer(item.id, "Pass")}
                      style={{ color: "#16a34a" }} />
                    <Form.Check type="radio" label="Fail" name={`checklist_item_${item.id}`}
                      checked={checklistAnswers[item.id] === "Fail"}
                      onChange={() => handleChecklistAnswer(item.id, "Fail")}
                      style={{ color: "#dc2626" }} />
                    <span style={{ fontWeight: "500" }}>{item.item_text}</span>
                  </div>
                </div>
              ))}

              {checklistItems.length > 0 && (
                <>
                  <Form.Group className="mb-3 mt-4">
                    <Form.Label style={{ fontWeight: "500" }}>
                      Checklist Notes {hasFailed && <span style={{ color: "red" }}>*</span>}
                    </Form.Label>
                    <Form.Control as="textarea" rows={3} name="checklist_notes"
                      value={formData.checklist_notes} onChange={handleInputChange}
                      placeholder={hasFailed ? "Describe the failed items..." : "Describe any issues found..."} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: "500" }}>Operator Remarks (optional)</Form.Label>
                    <Form.Control as="textarea" rows={3} name="operator_remarks"
                      value={formData.operator_remarks} onChange={handleInputChange}
                      placeholder="Any additional notes..." />
                  </Form.Group>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex justify-content-end gap-3 mb-4">
            <button type="button" className="btn btn-secondary"
              style={{ height: "42px", fontSize: "15px", fontWeight: "500", borderRadius: "8px", minWidth: "120px" }}
              onClick={() => navigate("/moms")} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn"
              disabled={saving || (isOperator && !linkedOperator)}
              style={{
                height: "42px", fontSize: "15px", fontWeight: "500", borderRadius: "8px", minWidth: "120px",
                backgroundColor: (isOperator && !linkedOperator) ? "#9ca3af" : "#16a34a",
                color: "white", border: "none",
                cursor: (isOperator && !linkedOperator) ? "not-allowed" : "pointer",
              }}>
              {saving ? "Starting..." : "Start Shift"}
            </button>
          </div>
        </Form>
      </div>
    </Layout>
  );
}