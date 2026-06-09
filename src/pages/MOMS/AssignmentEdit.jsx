import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { MdArrowBack, MdSave, MdAdd, MdDelete, MdSearch, MdClose } from "react-icons/md";
import { Form } from "react-bootstrap";
import Swal from "sweetalert2";

const TIME_CATEGORIES = [
  "Operating Time (OT)", "Operating Delay (OD)", "Operating Standby (OS)",
  "Planned Loss (PL)", "Breakdown Loss (BL)", "Breakdown Loss Other (BLO)",
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

const toDateTimeLocal = (str) => {
  if (!str) return "";
  try {
    const dt = str.includes("T") ? str.split(".")[0] : str.replace(" ", "T");
    return dt.substring(0, 16);
  } catch { return ""; }
};

const emptyEntry = () => ({
  _key: Date.now() + Math.random(), time_category: "", activity: "", start_time: "", end_time: "",
});

// ── Reusable searchable dropdown ─────────────────────────────────────────────
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
        backgroundColor: disabled ? "#e9ecef" : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: "13px", color: selectedLabel ? "#212529" : "#6c757d", userSelect: "none",
      }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {selectedLabel || placeholder}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
          {value && !disabled && <MdClose size={14} color="#9ca3af" onClick={handleClear} style={{ cursor: "pointer" }} />}
          <span style={{ color: "#9ca3af", fontSize: "10px", marginLeft: "2px" }}>▼</span>
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

export default function AssignmentEdit() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const [saving,      setSaving]      = useState(false);
  const [formData,    setFormData]    = useState(null);
  const [timeEntries, setTimeEntries] = useState([emptyEntry()]);

  // ── Parallel queries — all 4 shared MOMS cache keys ──────────────────────
  const [assignmentQ, machinesQ, operatorsQ, jobSitesQ] = useQueries({
    queries: [
      { queryKey: ["moms_assignment", id],  queryFn: () => baseApi.get(`/api/moms/assignments/${id}`).then((r) => r.data), staleTime: 2 * 60 * 1000, enabled: !!id },
      { queryKey: ["moms_machines"],         queryFn: () => baseApi.get("/api/moms/machines").then((r) => r.data),          staleTime: 5 * 60 * 1000 },
      { queryKey: ["moms_operators"],        queryFn: () => baseApi.get("/api/moms/operators").then((r) => r.data),         staleTime: 5 * 60 * 1000 },
      { queryKey: ["moms_job_sites"],        queryFn: () => baseApi.get("/api/moms/job-sites").then((r) => r.data),         staleTime: 5 * 60 * 1000 },
    ],
  });

  const assignment = assignmentQ.data;
  const machines   = machinesQ.data   || [];
  const operators  = operatorsQ.data  || [];
  const jobSites   = jobSitesQ.data   || [];
  const loading    = assignmentQ.isLoading;

  // Build options for SearchableSelect
  const machineOptions  = machines.map((m)  => ({ value: String(m.id), label: `${m.machine_id} - ${m.category}` }));
  const operatorOptions = operators.map((op) => ({ value: String(op.id), label: op.user_name || `Operator ${op.id}` }));
  const jobSiteOptions  = jobSites.map((s)   => ({ value: s.name, label: s.name }));
  const categoryOptions = TIME_CATEGORIES.map((c) => ({ value: c, label: c }));

  // Pre-fill form once assignment data arrives
  useEffect(() => {
    if (!assignment || formData) return;
    setFormData({
      machine_id:       assignment.machine_id       || "",
      operator_id:      assignment.operator_id      || "",
      job_site:         assignment.job_site         || "",
      reading_start:    assignment.reading_start    ?? "",
      reading_end:      assignment.reading_end      ?? "",
      shift_type:       assignment.shift_type       || "Day",
      start_time:       toDateTimeLocal(assignment.start_time),
      end_time:         toDateTimeLocal(assignment.end_time),
      task_description: assignment.task_description || "",
      status:           assignment.status           || "Pending",
    });
    if (assignment.time_entries?.length > 0) {
      setTimeEntries(assignment.time_entries.map((e) => ({
        _key:          e.id || Date.now() + Math.random(),
        time_category: e.time_category || "",
        activity:      e.activity      || "",
        start_time:    toDateTimeLocal(e.start_time),
        end_time:      toDateTimeLocal(e.end_time),
      })));
    }
  }, [assignment]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEntryChange = (key, field, value) => {
    setTimeEntries((prev) => prev.map((entry) => {
      if (entry._key !== key) return entry;
      if (field === "time_category") return { ...entry, time_category: value, activity: "" };
      return { ...entry, [field]: value };
    }));
  };

  const addEntry    = () => setTimeEntries((prev) => [...prev, emptyEntry()]);
  const removeEntry = (key) => { if (timeEntries.length > 1) setTimeEntries((prev) => prev.filter((e) => e._key !== key)); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const validEntries = timeEntries
        .filter((en) => en.time_category || en.start_time)
        .map(({ _key, ...rest }) => ({ ...rest, end_time: rest.end_time || null }));

      await baseApi.put(`/api/moms/assignments/${id}`, {
        ...formData,
        end_time:      formData.end_time      || null,
        reading_start: formData.reading_start !== "" ? formData.reading_start : null,
        reading_end:   formData.reading_end   !== "" ? formData.reading_end   : null,
        time_entries:  validEntries,
      });

      queryClient.invalidateQueries({ queryKey: ["moms_assignment",  id] });
      queryClient.invalidateQueries({ queryKey: ["moms_assignments"]    });

      Swal.fire({ icon: "success", title: "Updated!", text: "Assignment updated successfully.", confirmButtonColor: "#3b82f6", timer: 2000, showConfirmButton: false });
      setTimeout(() => navigate(`/moms/assignments/${id}`), 2000);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Update Failed", text: err.response?.data?.message || "Failed to update assignment.", confirmButtonColor: "#3b82f6" });
      setSaving(false);
    }
  };

  if (loading || !formData) return <Layout><div className="text-center py-5">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="mb-4">
          <button className="btn btn-link text-decoration-none p-0 mb-2" onClick={() => navigate(`/moms/assignments/${id}`)} style={{ color: "#3b82f6", fontSize: "14px" }}>
            <MdArrowBack className="me-1" /> Back to Assignment
          </button>
          <h1 style={{ fontWeight: "bold", fontSize: "28px", margin: 0 }}>Edit Assignment</h1>
        </div>

        <Form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-12">
              <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
                <div className="card-body" style={{ padding: "28px" }}>

                  <p style={{ fontWeight: "700", fontSize: "14px", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px", borderBottom: "2px solid #e5e7eb", paddingBottom: "8px" }}>
                    Assignment Details
                  </p>

                  <div className="row g-3">
                    {/* Machine — locked, display only */}
                    <div className="col-md-4">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Machine</Form.Label>
                        <SearchableSelect
                          options={machineOptions}
                          value={String(formData.machine_id)}
                          onChange={() => {}}
                          placeholder="Machine"
                          disabled
                        />
                        <Form.Text className="text-muted">Cannot be changed</Form.Text>
                      </Form.Group>
                    </div>

                    {/* Operator — locked, display only */}
                    <div className="col-md-4">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Operator</Form.Label>
                        <SearchableSelect
                          options={operatorOptions}
                          value={String(formData.operator_id)}
                          onChange={() => {}}
                          placeholder="Operator"
                          disabled
                        />
                        <Form.Text className="text-muted">Cannot be changed</Form.Text>
                      </Form.Group>
                    </div>

                    {/* Job Site — searchable and editable */}
                    <div className="col-md-4">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Job Site</Form.Label>
                        <SearchableSelect
                          options={jobSiteOptions}
                          value={formData.job_site}
                          onChange={(v) => setFormData((p) => ({ ...p, job_site: v }))}
                          placeholder="Search job site..."
                        />
                      </Form.Group>
                    </div>

                    <div className="col-md-3">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Shift Type <span style={{ color: "red" }}>*</span></Form.Label>
                        <Form.Select name="shift_type" value={formData.shift_type} onChange={handleInputChange} required>
                          <option value="Day">Day</option>
                          <option value="Night">Night</option>
                          <option value="Full Day">Full Day</option>
                        </Form.Select>
                      </Form.Group>
                    </div>
                    <div className="col-md-3">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Status <span style={{ color: "red" }}>*</span></Form.Label>
                        <Form.Select name="status" value={formData.status} onChange={handleInputChange} required>
                          <option value="Pending">Pending</option>
                          <option value="Active">Active</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </Form.Select>
                      </Form.Group>
                    </div>
                    <div className="col-md-3">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Reading Start (Hrs)</Form.Label>
                        <Form.Control type="number" step="0.01" min="0" name="reading_start" value={formData.reading_start} onChange={handleInputChange} placeholder="e.g. 25652" />
                      </Form.Group>
                    </div>
                    <div className="col-md-3">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Reading End (Hrs)</Form.Label>
                        <Form.Control type="number" step="0.01" min="0" name="reading_end" value={formData.reading_end} onChange={handleInputChange} placeholder="e.g. 25660" />
                      </Form.Group>
                    </div>

                    <div className="col-md-6">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Shift Start <span style={{ color: "red" }}>*</span></Form.Label>
                        <Form.Control type="datetime-local" name="start_time" value={formData.start_time} onChange={handleInputChange} required />
                      </Form.Group>
                    </div>
                    <div className="col-md-6">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Shift End (optional)</Form.Label>
                        <Form.Control type="datetime-local" name="end_time" value={formData.end_time} onChange={handleInputChange} />
                      </Form.Group>
                    </div>

                    <div className="col-12">
                      <Form.Group>
                        <Form.Label style={{ fontWeight: "600", fontSize: "14px" }}>Task Description</Form.Label>
                        <Form.Control as="textarea" rows={2} name="task_description" value={formData.task_description} onChange={handleInputChange} placeholder="Describe the task..." />
                      </Form.Group>
                    </div>
                  </div>

                  {/* Time Entries */}
                  <div className="mt-4">
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

                  <div className="d-flex justify-content-end gap-3 mt-4 pt-4" style={{ borderTop: "1px solid #e5e7eb" }}>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(`/moms/assignments/${id}`)} disabled={saving} style={{ height: "42px", fontSize: "15px", fontWeight: "500", borderRadius: "8px", minWidth: "100px" }}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ height: "42px", fontSize: "15px", fontWeight: "500", borderRadius: "8px", minWidth: "160px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                      <MdSave size={20} />{saving ? "Saving..." : "Update Assignment"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Form>
      </div>
    </Layout>
  );
}