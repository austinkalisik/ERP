import { useState, useRef, useEffect } from "react";
import Layout from "../../components/layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import baseApi from "../../api/baseApi";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../utils/permissions";
import { Modal, Button, Form } from "react-bootstrap";
import { MdAdd, MdDelete, MdSearch, MdClose } from "react-icons/md";
import Swal from "sweetalert2";

// ── Time Category → Activities ──────────────────────────────────────────────
const TIME_CATEGORIES = [
  "Operating Time (OT)",
  "Operating Delay (OD)",
  "Operating Standby (OS)",
  "Planned Loss (PL)",
  "Breakdown Loss (BL)",
  "Breakdown Loss Other (BLO)",
];

const ACTIVITIES_MAP = {
  "Operating Time (OT)": ["OT Production", "OT Rehandle", "OT - Batter Trim"],
  "Operating Delay (OD)": [
    "OD BATTER TRIMMING", "OD CLEAN UP", "OD RE - POSTION", "OD RELOCATE",
    "OD WAIT DIG UNIT", "OD HELD UP", "OD WAIT DUMP", "OD WAIT CRUSHER",
    "OD WEATHER", "OD DISCUSSION", "OD REFILL WATER", "OD TRAVEL FUEL",
    "OD REFUEL / LUBE", "OD SHIFT CHANGE", "OD CRIB", "OD SHORT BREAK",
    "OD OPERATOR SWAP", "OD TOOLBOX / PRESTART", "OD BLASTING",
    "OD RC BATTERY FLAT", "OD SITE CAST",
  ],
  "Operating Standby (OS)": [
    "OS BLAST DELAY", "OS FLY IN/OUT", "OS INCIDENT", "OS MEETING",
    "OS NO DUMP LOCATION", "OS NO OPERATION", "OS NO OPERATOR",
    "OS NO ORE SPOTTER", "OS NO SHOT/PATTERN", "OS NO TRUCKS",
    "OS NOT REQUIRED", "OS OPERATIONAL ERROR", "OS OPS SHUTDOWN",
    "OS RELEASED BY MAINT", "OS TARP", "OS TRAINING", "OS TRAMMING",
    "OS WAIT FOR EQUIPMENT", "OS WAIT FUEL / LUBE / WATER", "OS WET WEATHER",
    "OS NO SHEETING", "OS AWAIT SHEETING MATERIAL", "OS WITH OPERATOR",
    "OS WEATHER - FOG", "OS NO ACCESS",
  ],
  "Planned Loss (PL)": [
    "PL BRAKES PARK BRAKE", "PL BRAKES SERVICE BRAKE", "PL BRAKES EMERG BRAKE",
    "PL BRAKES HOSE", "PL DMC", "PL DRVTRAIN CYLINDER", "PL DRVTRAIN DIFF",
    "PL DRVTRAIN FINAL DRV", "PL DRVTRAIN FRONT HUB", "PL DRVTRAIN HOSES",
    "PL DRVTRAIN OIL SYS", "PL DRVTRAIN TRANNY", "PL DRVTRAIN T-CONVRTR",
    "PL DRVTRAIN U-CARRIAGE", "PL DRVTRAIN UNI JOINTS", "PL ELECT ACCESSORIES",
    "PL ELECT AIRCON", "PL ELECT ALTERNATOR", "PL ELECT BATTERIES",
    "PL ELECT LIGHTS", "PL ELECT RC UNIT", "PL ELECT STARTER MOTOR",
    "PL ELECT WIRE HARNESS", "PL ELECT INTERFACE", "PL HYDSYS CYLINDER",
    "PL HYDSYS HOSE", "PL HYDSYS PUMP", "PL HYDSYS PTO", "PL HYDSYS MOTOR",
    "PL HYDSYS VALVE", "PL HYDSYS TANK", "PL MECH ENGINE", "PL MECH AIR SYSTEM",
    "PL MECH COOLING SYSTEM", "PL MECH EXHAUST SYSTEM", "PL SERVICE 250HRS",
    "PL SERVICE 500HRS", "PL SERVICE 1000HRS", "PL SERVICE", "PL STRUCT TRAY",
    "PL STRUCT CHASSIS", "PL STRUCT BUCKET", "PL STRUCT MAIN STRUCT",
    "PL STRUCT WEAR PACK", "PL TYRE MAINTENANCE", "PL SCHEDULE MAINTENANCE",
    "PL SERVICE 750HRS", "PL INSPECTION", "PL SERVICE 2000HRS",
  ],
  "Breakdown Loss (BL)": [
    "BL WAIT MAINTENANCE", "BL BRAKES SERVICE BRAKE", "BL BRAKES EMERG BRAKE",
    "BL BRAKES LEAKING", "BL BRAKES HOSE", "BL BRAKES PARK BRAKE",
    "BL BRAKES FAIL STALL TEST", "BL DRVTRAIN CYLINDER", "BL DRVTRAIN DIFF",
    "BL DRVTRAIN FINAL DRV", "BL DRVTRAIN FRONT HUB", "BL DRVTRAIN HOSES",
    "BL DRVTRAIN OIL SYS", "BL DRVTRAIN TRANNY", "BL DRVTRAIN T-CONVRTR",
    "BL DRVTRAIN U-CARRIAGE", "BL DRVTRAIN UNI JOINTS", "BL ELECT ACCESSORIES",
    "BL ELECT AIRCON", "BL ELECT ALTERNATOR", "BL ELECT BATTERIES",
    "BL ELECT LIGHTS", "BL ELECT RC UNIT", "BL ELECT STARTER MOTOR",
    "BL ELECT WIRE HARNESS", "BL ELECT INTERFACE", "BL GET", "BL GET STRUCTURAL",
    "BL HYDSYS CYLINDER", "BL HYDSYS HOSE", "BL HYDSYS PUMP", "BL HYDSYS PTO",
    "BL HYDSYS MOTOR", "BL HYDSYS VALVE", "BL HYDSYS TANK", "BL MECH ENGINE",
    "BL MECH AIR SYSTEM", "BL MECH COOLING SYSTEM", "BL MECH EXHAUST SYSTEM",
    "BL MECH FUEL SYSTEM", "BL STRUCT TRAY", "BL STRUCT CHASSIS",
    "BL STRUCT BUCKET", "BL STRUCT MAIN STRUCT", "BL STRUCT WEAR PACK",
    "BL TYRE MAINTENANCE", "BL WARRANTY", "BL WARRANTY BRAKES",
    "BL WARRANTY DRV TRAIN", "BL WARRANTY ELECT", "BL WARRANTY HYD SYS",
    "BL WARRANTY MECH", "BL WARRANTY STRUCT", "BL UNSCHEDULE MAINTENANCE",
    "BL STEERING",
  ],
  "Breakdown Loss Other (BLO)": [
    "BLO ACCIDENT DAMAGE", "BLO TYRE DAMAGE /RETORQUE", "BLO WAIT FREIGHT",
    "BLO WAIT CRANE", "BLO WAIT FLOAT", "BLO WAIT LABOUR", "BLO WAIT PARTS",
    "BLO WAIT WORKSHOP SPACE", "BLO BOGGED", "BLO SAFE MINE", "BLO NO ACCESS",
  ],
};

const emptyEntry = () => ({
  _key: Date.now() + Math.random(),
  time_category: "", activity: "", start_time: "", end_time: "",
});

const EMPTY_FORM = {
  machine_id: "", operator_id: "", job_site: "", reading_start: "",
  reading_end: "", shift_type: "Day", start_time: "", end_time: "",
  task_description: "", status: "Pending",
};

// ── Reusable searchable dropdown ─────────────────────────────────────────────
// options: [{ value, label }]
// value: currently selected value (string)
// onChange: (value) => void
// placeholder: string
// disabled: bool
function SearchableSelect({ options = [], value, onChange, placeholder = "Search...", disabled = false }) {
  const [query,  setQuery]  = useState("");
  const [open,   setOpen]   = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // When dropdown opens, reset search so user sees all options
  const handleOpen = () => { if (!disabled) { setQuery(""); setOpen(true); } };

  const selectedLabel = options.find((o) => String(o.value) === String(value))?.label || "";

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (opt) => {
    onChange(opt.value);
    setQuery("");
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
  };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      {/* Trigger */}
      <div
        onClick={handleOpen}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: "38px", padding: "0 10px",
          border: "1px solid #ced4da", borderRadius: "6px",
          backgroundColor: disabled ? "#e9ecef" : "#fff",
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: "13px", color: selectedLabel ? "#212529" : "#6c757d",
          userSelect: "none",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {selectedLabel || placeholder}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
          {value && !disabled && (
            <MdClose size={14} color="#9ca3af" onClick={handleClear} style={{ cursor: "pointer" }} />
          )}
          <span style={{ color: "#9ca3af", fontSize: "10px", marginLeft: "2px" }}>▼</span>
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", zIndex: 9999, top: "calc(100% + 4px)", left: 0, right: 0,
          backgroundColor: "#fff", border: "1px solid #ced4da", borderRadius: "8px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden",
        }}>
          {/* Search input */}
          <div style={{ padding: "8px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: "6px" }}>
            <MdSearch size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search..."
              style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", background: "transparent" }}
            />
            {query && <MdClose size={14} color="#9ca3af" style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => setQuery("")} />}
          </div>

          {/* Options list */}
          <div style={{ maxHeight: "220px", overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "12px 14px", fontSize: "13px", color: "#9ca3af", textAlign: "center" }}>No results found</div>
            ) : (
              filtered.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt)}
                  style={{
                    padding: "9px 14px", fontSize: "13px", cursor: "pointer",
                    backgroundColor: String(opt.value) === String(value) ? "#eff6ff" : "transparent",
                    color: String(opt.value) === String(value) ? "#1d4ed8" : "#212529",
                    fontWeight: String(opt.value) === String(value) ? "600" : "400",
                  }}
                  onMouseEnter={(e) => { if (String(opt.value) !== String(value)) e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                  onMouseLeave={(e) => { if (String(opt.value) !== String(value)) e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Assignments() {
  const navigate      = useNavigate();
  const queryClient   = useQueryClient();
  const { permissions } = useAuth();
  const canCreate     = can(permissions, "moms.assignments.create");
  const canComplete   = can(permissions, "moms.assignments.update");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab,       setActiveTab]       = useState("All");
  const [submitting,      setSubmitting]      = useState(false);
  const [formData,        setFormData]        = useState(EMPTY_FORM);
  const [timeEntries,     setTimeEntries]     = useState([emptyEntry()]);

  const tabs = ["All", "Pending", "Active", "Completed", "Cancelled"];

  // ── React Query: all 4 requests fire in parallel ─────────────────────────
  const results = useQueries({
    queries: [
      { queryKey: ["moms_assignments"], queryFn: () => baseApi.get("/api/moms/assignments").then((r) => r.data), staleTime: 30 * 1000 },
      { queryKey: ["moms_machines"],    queryFn: () => baseApi.get("/api/moms/machines").then((r) => r.data?.data || r.data || []),    staleTime: 5 * 60 * 1000 },
      { queryKey: ["moms_operators"],   queryFn: () => baseApi.get("/api/moms/operators").then((r) => r.data),   staleTime: 5 * 60 * 1000 },
      { queryKey: ["moms_job_sites"],   queryFn: () => baseApi.get("/api/moms/job-sites").then((r) => r.data),   staleTime: 5 * 60 * 1000, enabled: canCreate },
    ],
  });

  const [assignmentsQ, machinesQ, operatorsQ, jobSitesQ] = results;

  const rawAssignments = assignmentsQ.data || [];
  const machines       = machinesQ.data    || [];
  const operators      = operatorsQ.data   || [];
  const jobSites       = jobSitesQ.data    || [];
  const loading        = assignmentsQ.isLoading;

  // ── Build option arrays for SearchableSelect ──────────────────────────────
  const machineOptions  = machines.map((m)  => ({ value: String(m.id), label: `${m.machine_id} - ${m.category}` }));
  const operatorOptions = operators.map((op) => ({ value: String(op.id), label: op.user_name || `Operator ${op.id}` }));
  const jobSiteOptions  = jobSites.map((s)   => ({ value: s.name, label: s.name }));
  const categoryOptions = TIME_CATEGORIES.map((c) => ({ value: c, label: c }));

  // ── Form handlers ─────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ── Time entries ──────────────────────────────────────────────────────────
  const handleEntryChange = (key, field, value) => {
    setTimeEntries((prev) =>
      prev.map((entry) => {
        if (entry._key !== key) return entry;
        if (field === "time_category") return { ...entry, time_category: value, activity: "" };
        return { ...entry, [field]: value };
      })
    );
  };

  const addEntry    = () => setTimeEntries((prev) => [...prev, emptyEntry()]);
  const removeEntry = (key) => { if (timeEntries.length > 1) setTimeEntries((prev) => prev.filter((e) => e._key !== key)); };

  const handleCloseModal = () => { setShowCreateModal(false); setFormData(EMPTY_FORM); setTimeEntries([emptyEntry()]); };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const validEntries = timeEntries
        .filter((en) => en.time_category || en.start_time)
        .map(({ _key, ...rest }) => ({ ...rest, end_time: rest.end_time || null }));

      await baseApi.post("/api/moms/assignments", {
        ...formData,
        end_time:      formData.end_time      || null,
        reading_start: formData.reading_start || null,
        reading_end:   formData.reading_end   || null,
        time_entries:  validEntries,
      });

      handleCloseModal();
      queryClient.invalidateQueries({ queryKey: ["moms_assignments"] });

      Swal.fire({
        icon: "success", title: "Assignment Created!",
        text: `Created with ${validEntries.length} time entr${validEntries.length === 1 ? "y" : "ies"}.`,
        confirmButtonColor: "#3b82f6", timer: 2500, showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Creation Failed", text: err.response?.data?.message || "Failed to create assignment.", confirmButtonColor: "#3b82f6" });
    } finally { setSubmitting(false); }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const datePart = dateString.includes("T") ? dateString.split("T")[0] : dateString.split(" ")[0];
      const [year, month, day] = datePart.split("-");
      return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch { return "Invalid Date"; }
  };

  const STATUS_COLORS = {
    Pending:   { bg: "#dbeafe", text: "#1e40af" },
    Active:    { bg: "#d1fae5", text: "#065f46" },
    Completed: { bg: "#e5e7eb", text: "#374151" },
    Cancelled: { bg: "#fee2e2", text: "#991b1b" },
    All:       { bg: "#f3f4f6", text: "#374151" },
  };

  const filteredAssignments = activeTab === "All"
    ? rawAssignments
    : rawAssignments.filter((a) => a.status === activeTab);

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">

        {/* Header */}
        <div className="row mb-3 mb-md-4 align-items-center">
          <div className="col">
            <h1 style={{ fontWeight: "bold", fontSize: "clamp(20px, 5vw, 28px)" }}>Assignments</h1>
          </div>
          {canCreate && (
            <div className="col-auto">
              <button className="btn btn-primary" style={{ height: "42px", fontSize: "15px", fontWeight: "500", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }} onClick={() => setShowCreateModal(true)}>
                <MdAdd size={20} /> New Assignment
              </button>
            </div>
          )}
        </div>

        {/* Status Tabs */}
        <div className="mb-3">
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              const c = STATUS_COLORS[tab] || {};
              return (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", backgroundColor: isActive ? c.bg : "#ffffff", color: isActive ? c.text : "#6b7280", fontWeight: isActive ? "600" : "500", fontSize: "14px", transition: "all 0.2s ease" }}>
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #e9ecef" }}>
                  <tr>
                    {["Machine","Operator","Job Site","Time Entries","Shift Type","Start Date","Status","Actions"].map((h) => (
                      <th key={h} style={{ padding: "16px", fontWeight: "600", color: "#495057", fontSize: "13px", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="8" className="text-center py-4">Loading...</td></tr>
                  ) : filteredAssignments.length === 0 ? (
                    <tr><td colSpan="8" className="text-center py-4 text-muted">No assignments found.</td></tr>
                  ) : filteredAssignments.map((a) => {
                    const sc = STATUS_COLORS[a.status] || { bg: "#e5e7eb", text: "#374151" };
                    return (
                      <tr key={a.id}>
                        <td style={{ padding: "16px" }}>
                          <span style={{ color: "#3b82f6", fontWeight: "500", cursor: "pointer" }} onClick={() => navigate(`/moms/assignments/${a.id}`)}>
                            {a.machine_id_display || a.machine_id}
                          </span>
                        </td>
                        <td style={{ padding: "16px" }}>{a.operator_name || "N/A"}</td>
                        <td style={{ padding: "16px" }}>{a.job_site || "—"}</td>
                        <td style={{ padding: "16px" }}>
                          <span style={{ fontSize: "13px", backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "3px 10px", borderRadius: "4px", fontWeight: "600" }}>
                            {a.time_entries_count ?? 0} {a.time_entries_count === 1 ? "entry" : "entries"}
                          </span>
                        </td>
                        <td style={{ padding: "16px" }}>{a.shift_type}</td>
                        <td style={{ padding: "16px" }}>{formatDate(a.start_time)}</td>
                        <td style={{ padding: "16px" }}>
                          <span className="badge" style={{ backgroundColor: sc.bg, color: sc.text, padding: "6px 12px", borderRadius: "6px", fontWeight: "500", fontSize: "12px" }}>{a.status}</span>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button className="btn btn-sm" style={{ color: "#3b82f6", padding: "4px 12px", fontSize: "13px" }} onClick={() => navigate(`/moms/assignments/${a.id}`)}>View</button>
                            {canComplete && a.status === "Active" && (
                              <button className="btn btn-sm" style={{ color: "#10b981", padding: "4px 12px", fontSize: "13px" }}>Complete</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Create Modal ──────────────────────────────────────────────────── */}
      {canCreate && (
        <Modal show={showCreateModal} onHide={handleCloseModal} centered size="xl">
          <Modal.Header closeButton style={{ borderBottom: "1px solid #e5e7eb" }}>
            <Modal.Title style={{ fontWeight: "600" }}>New Assignment</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body style={{ padding: "24px", maxHeight: "75vh", overflowY: "auto" }}>

              {/* Section 1: Assignment Details */}
              <div style={{ marginBottom: "24px" }}>
                <p style={{ fontWeight: "700", fontSize: "14px", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px", borderBottom: "2px solid #e5e7eb", paddingBottom: "8px" }}>
                  Assignment Details
                </p>
                <div className="row">
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontWeight: "500" }}>Machine <span style={{ color: "red" }}>*</span></Form.Label>
                      <SearchableSelect
                        options={machineOptions}
                        value={formData.machine_id}
                        onChange={(v) => setFormData((p) => ({ ...p, machine_id: v }))}
                        placeholder="Search machine..."
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontWeight: "500" }}>Operator <span style={{ color: "red" }}>*</span></Form.Label>
                      <SearchableSelect
                        options={operatorOptions}
                        value={formData.operator_id}
                        onChange={(v) => setFormData((p) => ({ ...p, operator_id: v }))}
                        placeholder="Search operator..."
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontWeight: "500" }}>Job Site</Form.Label>
                      <SearchableSelect
                        options={jobSiteOptions}
                        value={formData.job_site}
                        onChange={(v) => setFormData((p) => ({ ...p, job_site: v }))}
                        placeholder="Search job site..."
                      />
                    </Form.Group>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-3">
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontWeight: "500" }}>Shift Type <span style={{ color: "red" }}>*</span></Form.Label>
                      <Form.Select name="shift_type" value={formData.shift_type} onChange={handleInputChange} required>
                        <option value="Day">Day</option>
                        <option value="Night">Night</option>
                        <option value="Full Day">Full Day</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  <div className="col-md-3">
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontWeight: "500" }}>Status <span style={{ color: "red" }}>*</span></Form.Label>
                      <Form.Select name="status" value={formData.status} onChange={handleInputChange} required>
                        <option value="Pending">Pending</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  <div className="col-md-3">
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontWeight: "500" }}>Reading Start (Hrs)</Form.Label>
                      <Form.Control type="number" step="0.01" min="0" name="reading_start" value={formData.reading_start} onChange={handleInputChange} placeholder="e.g. 25652" />
                    </Form.Group>
                  </div>
                  <div className="col-md-3">
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontWeight: "500" }}>Reading End (Hrs)</Form.Label>
                      <Form.Control type="number" step="0.01" min="0" name="reading_end" value={formData.reading_end} onChange={handleInputChange} placeholder="e.g. 25660" />
                    </Form.Group>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontWeight: "500" }}>Shift Start <span style={{ color: "red" }}>*</span></Form.Label>
                      <Form.Control type="datetime-local" name="start_time" value={formData.start_time} onChange={handleInputChange} required />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label style={{ fontWeight: "500" }}>Shift End (optional)</Form.Label>
                      <Form.Control type="datetime-local" name="end_time" value={formData.end_time} onChange={handleInputChange} />
                    </Form.Group>
                  </div>
                </div>

                <Form.Group className="mb-0">
                  <Form.Label style={{ fontWeight: "500" }}>Task Description</Form.Label>
                  <Form.Control as="textarea" rows={2} name="task_description" value={formData.task_description} onChange={handleInputChange} placeholder="Describe the task or project details..." />
                </Form.Group>
              </div>

              {/* Section 2: Time Entries */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #e5e7eb", paddingBottom: "8px", marginBottom: "16px" }}>
                  <p style={{ fontWeight: "700", fontSize: "14px", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                    Time Entries
                    <span style={{ marginLeft: "8px", fontSize: "12px", backgroundColor: "#dbeafe", color: "#1e40af", borderRadius: "10px", padding: "2px 8px", fontWeight: "600" }}>
                      {timeEntries.length}
                    </span>
                  </p>
                  <button type="button" onClick={addEntry} style={{ backgroundColor: "#0ea5e9", color: "white", border: "none", borderRadius: "6px", padding: "6px 14px", fontSize: "13px", fontWeight: "500", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                    <MdAdd size={16} /> Add Time
                  </button>
                </div>

                {/* Column headers */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 180px 180px 36px", gap: "8px", marginBottom: "8px", padding: "0 4px" }}>
                  {["Time Category", "Activity", "Start Date & Time", "End Date & Time", ""].map((h, i) => (
                    <p key={i} style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>{h}</p>
                  ))}
                </div>

                {/* Entry rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {timeEntries.map((entry, idx) => {
                    const activityOptions = (ACTIVITIES_MAP[entry.time_category] || []).map((a) => ({ value: a, label: a }));
                    return (
                      <div key={entry._key} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 180px 180px 36px", gap: "8px", alignItems: "center", backgroundColor: idx % 2 === 0 ? "#f8fafc" : "#ffffff", borderRadius: "8px", padding: "10px", border: "1px solid #e5e7eb" }}>

                        {/* Time Category — searchable */}
                        <SearchableSelect
                          options={categoryOptions}
                          value={entry.time_category}
                          onChange={(v) => handleEntryChange(entry._key, "time_category", v)}
                          placeholder="Select category..."
                        />

                        {/* Activity — searchable, disabled until category chosen */}
                        <SearchableSelect
                          options={activityOptions}
                          value={entry.activity}
                          onChange={(v) => handleEntryChange(entry._key, "activity", v)}
                          placeholder={entry.time_category ? "Search activity..." : "— Select category first —"}
                          disabled={!entry.time_category}
                        />

                        <Form.Control type="datetime-local" value={entry.start_time} onChange={(e) => handleEntryChange(entry._key, "start_time", e.target.value)} style={{ fontSize: "13px" }} />
                        <Form.Control type="datetime-local" value={entry.end_time}   onChange={(e) => handleEntryChange(entry._key, "end_time",   e.target.value)} style={{ fontSize: "13px" }} />

                        <button type="button" onClick={() => removeEntry(entry._key)} disabled={timeEntries.length === 1}
                          style={{ background: "none", border: "none", cursor: timeEntries.length === 1 ? "not-allowed" : "pointer", color: timeEntries.length === 1 ? "#d1d5db" : "#ef4444", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <MdDelete size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button type="button" onClick={addEntry} style={{ marginTop: "12px", width: "100%", border: "2px dashed #d1d5db", borderRadius: "8px", backgroundColor: "transparent", padding: "10px", fontSize: "13px", color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: "500" }}>
                  <MdAdd size={16} /> Add Time Entry
                </button>
              </div>

            </Modal.Body>
            <Modal.Footer style={{ borderTop: "1px solid #e5e7eb", gap: "8px" }}>
              <Button variant="secondary" onClick={handleCloseModal} style={{ borderRadius: "6px" }} disabled={submitting}>Cancel</Button>
              <Button variant="primary" type="submit" style={{ borderRadius: "6px" }} disabled={submitting}>
                {submitting ? "Creating..." : "Create Assignment"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}
    </Layout>
  );
} 