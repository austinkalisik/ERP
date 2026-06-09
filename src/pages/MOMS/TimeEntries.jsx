import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";
import { MdAccessTime, MdFilterList, MdOpenInNew, MdDelete, MdRefresh, MdAdd, MdClose, MdSearch } from "react-icons/md";

const TIME_CATEGORIES = [
  "Operating Time (OT)",
  "Operating Delay (OD)",
  "Operating Standby (OS)",
  "Planned Loss (PL)",
  "Breakdown Loss (BL)",
  "Breakdown Loss Other (BLO)",
];

const ACTIVITIES_MAP = {
  "Operating Time (OT)":        ["OT Production", "OT Rehandle", "OT - Batter Trim"],
  "Operating Delay (OD)":       ["OD BATTER TRIMMING","OD CLEAN UP","OD RE - POSTION","OD RELOCATE","OD WAIT DIG UNIT","OD HELD UP","OD WAIT DUMP","OD WAIT CRUSHER","OD WEATHER","OD DISCUSSION","OD REFILL WATER","OD TRAVEL FUEL","OD REFUEL / LUBE","OD SHIFT CHANGE","OD CRIB","OD SHORT BREAK","OD OPERATOR SWAP","OD TOOLBOX / PRESTART","OD BLASTING","OD RC BATTERY FLAT","OD SITE CAST"],
  "Operating Standby (OS)":     ["OS BLAST DELAY","OS FLY IN/OUT","OS INCIDENT","OS MEETING","OS NO DUMP LOCATION","OS NO OPERATION","OS NO OPERATOR","OS NO ORE SPOTTER","OS NO SHOT/PATTERN","OS NO TRUCKS","OS NOT REQUIRED","OS OPERATIONAL ERROR","OS OPS SHUTDOWN","OS RELEASED BY MAINT","OS TARP","OS TRAINING","OS TRAMMING","OS WAIT FOR EQUIPMENT","OS WAIT FUEL / LUBE / WATER","OS WET WEATHER","OS NO SHEETING","OS AWAIT SHEETING MATERIAL","OS WITH OPERATOR","OS WEATHER - FOG","OS NO ACCESS"],
  "Planned Loss (PL)":          ["PL BRAKES PARK BRAKE","PL BRAKES SERVICE BRAKE","PL SERVICE 250HRS","PL SERVICE 500HRS","PL SERVICE 1000HRS","PL SERVICE","PL SERVICE 750HRS","PL INSPECTION","PL SERVICE 2000HRS","PL SCHEDULE MAINTENANCE","PL TYRE MAINTENANCE"],
  "Breakdown Loss (BL)":        ["BL WAIT MAINTENANCE","BL BRAKES SERVICE BRAKE","BL BRAKES EMERG BRAKE","BL BRAKES LEAKING","BL BRAKES HOSE","BL BRAKES PARK BRAKE","BL BRAKES FAIL STALL TEST","BL GET","BL GET STRUCTURAL","BL HYDSYS CYLINDER","BL HYDSYS HOSE","BL HYDSYS PUMP","BL HYDSYS MOTOR","BL HYDSYS VALVE","BL HYDSYS TANK","BL MECH ENGINE","BL UNSCHEDULE MAINTENANCE","BL STEERING"],
  "Breakdown Loss Other (BLO)": ["BLO ACCIDENT DAMAGE","BLO TYRE DAMAGE /RETORQUE","BLO WAIT FREIGHT","BLO WAIT CRANE","BLO WAIT FLOAT","BLO WAIT LABOUR","BLO WAIT PARTS","BLO WAIT WORKSHOP SPACE","BLO BOGGED","BLO SAFE MINE","BLO NO ACCESS"],
};

const CAT_COLORS = {
  "Operating Time (OT)":        { bg: "#d1fae5", text: "#065f46", code: "OT" },
  "Operating Delay (OD)":       { bg: "#fef3c7", text: "#92400e", code: "OD" },
  "Operating Standby (OS)":     { bg: "#dbeafe", text: "#1e40af", code: "OS" },
  "Planned Loss (PL)":          { bg: "#ede9fe", text: "#5b21b6", code: "PL" },
  "Breakdown Loss (BL)":        { bg: "#fee2e2", text: "#991b1b", code: "BL" },
  "Breakdown Loss Other (BLO)": { bg: "#fce7f3", text: "#9d174d", code: "BLO" },
};

const CODE_COLORS = {
  OT:  { bg: "#92d050", text: "#000" },
  OD:  { bg: "#ffff00", text: "#000" },
  OS:  { bg: "#00b0f0", text: "#fff" },
  PL:  { bg: "#7030a0", text: "#fff" },
  BL:  { bg: "#cc0000", text: "#fff" },
  BLO: { bg: "#cc0000", text: "#fff" },
};

const emptyRow = () => ({
  _key:          Date.now() + Math.random(),
  time_category: "",
  activity:      "",
  start_time:    "",
  end_time:      "",
});

function SearchableSelect({ options = [], value, onChange, placeholder = "Search...", disabled = false }) {
  const [query, setQuery] = useState("");
  const [open,  setOpen]  = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selectedLabel = options.find((o) => String(o.value) === String(value))?.label || "";
  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div onClick={() => { if (!disabled) { setQuery(""); setOpen(true); } }}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "34px", padding: "0 8px", border: "1px solid #ced4da", borderRadius: "6px", backgroundColor: disabled ? "#e9ecef" : "#fff", cursor: disabled ? "not-allowed" : "pointer", fontSize: "12px", color: selectedLabel ? "#212529" : "#6c757d", userSelect: "none" }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{selectedLabel || placeholder}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
          {value && !disabled && <MdClose size={12} color="#9ca3af" onClick={(e) => { e.stopPropagation(); onChange(""); }} style={{ cursor: "pointer" }} />}
          {!disabled && <span style={{ color: "#9ca3af", fontSize: "9px" }}>▼</span>}
        </div>
      </div>
      {open && (
        <div style={{ position: "absolute", zIndex: 9999, top: "calc(100% + 2px)", left: 0, right: 0, backgroundColor: "#fff", border: "1px solid #ced4da", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden" }}>
          <div style={{ padding: "6px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: "4px" }}>
            <MdSearch size={14} color="#9ca3af" />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type to search..."
              style={{ border: "none", outline: "none", fontSize: "12px", width: "100%", background: "transparent" }} />
          </div>
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {filtered.length === 0
              ? <div style={{ padding: "10px", fontSize: "12px", color: "#9ca3af", textAlign: "center" }}>No results</div>
              : filtered.map((opt) => (
                <div key={opt.value} onClick={() => { onChange(opt.value); setQuery(""); setOpen(false); }}
                  style={{ padding: "8px 12px", fontSize: "12px", cursor: "pointer", backgroundColor: String(opt.value) === String(value) ? "#eff6ff" : "transparent", color: String(opt.value) === String(value) ? "#1d4ed8" : "#212529", fontWeight: String(opt.value) === String(value) ? "600" : "400" }}
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

const formatDateTime = (str) => {
  if (!str) return "—";
  try {
    const s = str.includes("T") ? str : str.replace(" ", "T");
    const d = new Date(s);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      + " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch { return str; }
};

const calcHours = (start, end) => {
  if (!start || !end) return null;
  try {
    const diff = (new Date(end.replace(" ", "T")) - new Date(start.replace(" ", "T"))) / 3600000;
    return diff > 0 ? diff.toFixed(2) : null;
  } catch { return null; }
};

export default function TimeEntries() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const { user }    = useAuth();

  const isOperator   = user?.role === "moms_operator";
  const isPrivileged = ["system_admin", "moms_manager", "moms_supervisor"].includes(user?.role);

  const [dateFrom,    setDateFrom]    = useState("");
  const [dateTo,      setDateTo]      = useState("");
  const [catFilter,   setCatFilter]   = useState("All");
  const [machFilter,  setMachFilter]  = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [showAddModal,  setShowAddModal]  = useState(false);
  const [addAssignment, setAddAssignment] = useState("");
  const [addRows,       setAddRows]       = useState([emptyRow()]);
  const [saving,        setSaving]        = useState(false);

  // ── Time entries ──────────────────────────────────────────────────────────
  const { data: entries = [], isLoading, refetch } = useQuery({
    queryKey:  ["moms_time_entries"],
    queryFn:   () => baseApi.get("/api/moms/time-entries").then((r) => r.data || []),
    staleTime: 30 * 1000,
  });

  // ── Operations — source for the "Select Shift" dropdown in Add modal.
  // StartShift posts to /api/moms/operations/start-shift which creates an
  // Operation record (not an Assignment). So we fetch operations here,
  // filtered to In Progress + Completed so operators can log time entries
  // against their actual shifts.
  const { data: operations = [], isLoading: operationsLoading } = useQuery({
    queryKey:       ["moms_operations_list"],
    queryFn:        () => baseApi.get("/api/moms/operations").then((r) => {
      const raw = r.data;
      return Array.isArray(raw) ? raw : (raw?.data || []);
    }),
    staleTime:      30 * 1000,   // 30s — operations change frequently
    refetchOnMount: true,
  });

  const machines = useMemo(() => {
    const set = new Set();
    entries.forEach((e) => { if (e.machine_id) set.add(e.machine_id); });
    return Array.from(set).sort();
  }, [entries]);

  const filtered = useMemo(() => entries.filter((e) => {
    if (catFilter  !== "All" && e.time_category !== catFilter)  return false;
    if (machFilter !== "All" && e.machine_id    !== machFilter) return false;
    if (dateFrom && e.start_time && e.start_time < dateFrom)    return false;
    if (dateTo   && e.start_time && e.start_time.slice(0,10) > dateTo) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (e.machine_id    || "").toLowerCase().includes(q) ||
             (e.operator_name || "").toLowerCase().includes(q) ||
             (e.activity      || "").toLowerCase().includes(q) ||
             (e.job_site      || "").toLowerCase().includes(q);
    }
    return true;
  }), [entries, catFilter, machFilter, dateFrom, dateTo, searchQuery]);

  const totals = useMemo(() => {
    const sum = { OT: 0, OD: 0, OS: 0, PL: 0, BL: 0, BLO: 0 };
    filtered.forEach((e) => {
      const code = CAT_COLORS[e.time_category]?.code;
      const hrs  = parseFloat(e.duration_hours || calcHours(e.start_time, e.end_time) || 0);
      if (code) sum[code] += hrs;
    });
    return sum;
  }, [filtered]);

  const totalHrs = Object.values(totals).reduce((a, b) => a + b, 0);
  const hasActiveFilters = dateFrom || dateTo || catFilter !== "All" || machFilter !== "All" || searchQuery;

  const clearFilters = () => {
    setDateFrom(""); setDateTo(""); setCatFilter("All"); setMachFilter("All"); setSearchQuery("");
  };

  const handleDelete = async (entry) => {
    const result = await Swal.fire({
      title: "Delete Time Entry?",
      html: `<p><strong>${entry.time_category}</strong></p><p>${entry.activity || "—"}</p><p class="text-danger mt-2"><strong>⚠️ Cannot be undone</strong></p>`,
      icon: "warning", showCancelButton: true,
      confirmButtonText: "Yes, delete", confirmButtonColor: "#dc2626", cancelButtonColor: "#6c757d",
    });
    if (!result.isConfirmed) return;
    try {
      await baseApi.delete(`/api/moms/time-entries/${entry.id}`);
      queryClient.invalidateQueries({ queryKey: ["moms_time_entries"] });
      Swal.fire({ icon: "success", title: "Deleted!", timer: 1500, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed", text: err.response?.data?.message || "Could not delete.", confirmButtonColor: "#d33" });
    }
  };

  const updateRow = (key, field, value) => {
    setAddRows((prev) => prev.map((r) => {
      if (r._key !== key) return r;
      if (field === "time_category") return { ...r, time_category: value, activity: "" };
      return { ...r, [field]: value };
    }));
  };

  const addRow    = () => setAddRows((prev) => [...prev, emptyRow()]);
  const removeRow = (key) => { if (addRows.length > 1) setAddRows((prev) => prev.filter((r) => r._key !== key)); };

  const openAddModal = () => {
    setAddAssignment("");
    setAddRows([emptyRow()]);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!addAssignment) { Swal.fire({ icon: "warning", title: "Select an assignment", confirmButtonColor: "#f59e0b" }); return; }
    const valid = addRows.filter((r) => r.time_category && r.start_time);
    if (valid.length === 0) { Swal.fire({ icon: "warning", title: "Fill at least one complete row", text: "Time category and start time are required.", confirmButtonColor: "#f59e0b" }); return; }

    setSaving(true);
    try {
      await Promise.all(valid.map((r) =>
        baseApi.post("/api/moms/time-entries", {
          operation_id: addAssignment,   // operations.id from StartShift
          time_category: r.time_category,
          activity:      r.activity || null,
          start_time:    r.start_time,
          end_time:      r.end_time || null,
        })
      ));
      queryClient.invalidateQueries({ queryKey: ["moms_time_entries"] });
      setShowAddModal(false);
      Swal.fire({ icon: "success", title: `${valid.length} entr${valid.length === 1 ? "y" : "ies"} added!`, timer: 1800, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed", text: err.response?.data?.message || "Could not save entries.", confirmButtonColor: "#d33" });
    } finally { setSaving(false); }
  };

  // Build shift dropdown options from Operations
  // Each operation has: machine_name/machine_id, operator_name, status, started_at/created_at, location
  const assignmentOptions = operations.map((op) => {
    const machine  = op.machine_id || op.machine?.machine_id || "Machine";
    const operator = op.operator_name || op.operator?.user?.name || "Operator";
    const date     = (op.started_at || op.created_at || "").slice(0, 10) || "?";
    const status   = op.status ? ` [${op.status}]` : "";
    const location = op.location ? ` · ${op.location}` : "";
    return {
      value: String(op.id),
      label: `${machine} — ${operator} (${date}${status})${location}`,
    };
  });

  const categoryOptions = TIME_CATEGORIES.map((c) => ({ value: c, label: c }));

  return (
    <Layout>
      <div className="container-fluid px-2 px-md-3 py-3">

        {/* Header */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div>
            <h4 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ fontSize: "clamp(18px,4vw,24px)" }}>
              <MdAccessTime style={{ color: "#0ea5e9" }} />
              Time Entries
            </h4>
            <small className="text-muted">
              {isOperator ? "Your recorded time entries" : "All shift time category records"}
            </small>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              style={{ borderRadius: "7px", height: "36px" }} onClick={() => refetch()}>
              <MdRefresh size={16} /> Refresh
            </button>
            <button className="btn btn-sm d-flex align-items-center gap-1"
              style={{ borderRadius: "7px", height: "36px", backgroundColor: showFilters ? "#0ea5e9" : "#f1f5f9", color: showFilters ? "#fff" : "#374151", border: "none", fontWeight: 500 }}
              onClick={() => setShowFilters(!showFilters)}>
              <MdFilterList size={16} />
              Filters {hasActiveFilters && <span style={{ backgroundColor: "#dc2626", color: "#fff", borderRadius: "999px", fontSize: "10px", padding: "1px 5px", fontWeight: 700 }}>!</span>}
            </button>
            <button className="btn btn-sm btn-primary d-flex align-items-center gap-1"
              style={{ borderRadius: "7px", height: "36px", fontWeight: 500 }}
              onClick={openAddModal}>
              <MdAdd size={16} /> Add Time Entries
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row g-2 mb-3">
          {[
            { label: "Total Entries", value: filtered.length,     bg: "#f8fafc", tc: "#374151" },
            { label: "Total Hours",   value: totalHrs.toFixed(2), bg: "#f0f9ff", tc: "#0369a1" },
            ...Object.entries(totals).filter(([,v]) => v > 0).map(([code, val]) => ({
              label: code, value: val.toFixed(2) + " hrs",
              bg: CODE_COLORS[code]?.bg, tc: CODE_COLORS[code]?.text,
            })),
          ].map((s, i) => (
            <div className="col-6 col-md-4 col-lg-2" key={i}>
              <div className="p-2 rounded-3 text-center h-100" style={{ backgroundColor: s.bg, border: "1px solid rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: s.tc, marginBottom: "2px" }}>{s.label}</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: s.tc }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: "10px", backgroundColor: "#f8fafc" }}>
            <div className="card-body p-3">
              <div className="row g-2 align-items-end">
                <div className="col-md-3">
                  <label className="form-label fw-semibold mb-1" style={{ fontSize: "12px" }}>Search</label>
                  <input type="text" className="form-control form-control-sm" placeholder="Machine, operator, activity..."
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ borderRadius: "7px", fontSize: "13px" }} />
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-semibold mb-1" style={{ fontSize: "12px" }}>Date From</label>
                  <input type="date" className="form-control form-control-sm" value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)} style={{ borderRadius: "7px", fontSize: "13px" }} />
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-semibold mb-1" style={{ fontSize: "12px" }}>Date To</label>
                  <input type="date" className="form-control form-control-sm" value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)} style={{ borderRadius: "7px", fontSize: "13px" }} />
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-semibold mb-1" style={{ fontSize: "12px" }}>Category</label>
                  <select className="form-select form-select-sm" value={catFilter}
                    onChange={(e) => setCatFilter(e.target.value)} style={{ borderRadius: "7px", fontSize: "13px" }}>
                    <option value="All">All Categories</option>
                    {TIME_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-semibold mb-1" style={{ fontSize: "12px" }}>Machine</label>
                  <select className="form-select form-select-sm" value={machFilter}
                    onChange={(e) => setMachFilter(e.target.value)} style={{ borderRadius: "7px", fontSize: "13px" }}>
                    <option value="All">All Machines</option>
                    {machines.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="col-md-1">
                  <button className="btn btn-sm btn-outline-danger w-100"
                    style={{ borderRadius: "7px", fontSize: "12px", height: "31px" }}
                    onClick={clearFilters} disabled={!hasActiveFilters}>Clear</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
          <div className="card-body p-0">
            {isLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-3 text-muted">Loading time entries...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-5">
                <MdAccessTime size={40} color="#d1d5db" />
                <p className="text-muted mt-2 mb-1">No time entries found</p>
                {hasActiveFilters
                  ? <button className="btn btn-sm btn-link mt-1" onClick={clearFilters}>Clear filters</button>
                  : <button className="btn btn-sm btn-primary mt-2" onClick={openAddModal}><MdAdd size={14} className="me-1" />Add First Entry</button>
                }
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover table-sm align-middle mb-0" style={{ fontSize: "12.5px", whiteSpace: "nowrap", minWidth: "900px" }}>
                  <thead style={{ backgroundColor: "#f8fafc", fontSize: "11px" }}>
                    <tr>
                      <th style={th()}>#</th>
                      <th style={th()}>Machine</th>
                      <th style={th()}>Operator</th>
                      <th style={th()}>Job Site</th>
                      <th style={th()}>Time Category</th>
                      <th style={th()}>Activity</th>
                      <th style={th()}>Start</th>
                      <th style={th()}>End</th>
                      <th style={th()}>Duration</th>
                      <th style={{ ...th(), textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((entry, idx) => {
                      const catColor = CAT_COLORS[entry.time_category] || { bg: "#f3f4f6", text: "#374151", code: "?" };
                      const hrs      = entry.duration_hours || calcHours(entry.start_time, entry.end_time);
                      return (
                        <tr key={entry.id}>
                          <td style={td()}><span style={{ color: "#9ca3af", fontWeight: 600 }}>{idx + 1}</span></td>
                          <td style={td()}>
                            <span style={{ fontWeight: 600, color: "#3b82f6", cursor: "pointer" }}
                              onClick={() => navigate(`/moms/operations/${entry.operation_id || entry.assignment_id}`)}>
                              {entry.machine_id || "—"}
                            </span>
                          </td>
                          <td style={td()}>{entry.operator_name || "—"}</td>
                          <td style={td()}>{entry.job_site || "—"}</td>
                          <td style={td()}>
                            <span style={{ backgroundColor: catColor.bg, color: catColor.text, padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 600 }}>
                              {catColor.code}
                            </span>
                            <span className="ms-1" style={{ fontSize: "11px", color: "#6b7280" }}>
                              {entry.time_category?.replace(/\s*\(.*\)/, "") || "—"}
                            </span>
                          </td>
                          <td style={td()}>{entry.activity || <span style={{ color: "#9ca3af" }}>—</span>}</td>
                          <td style={td()}>{formatDateTime(entry.start_time)}</td>
                          <td style={td()}>{entry.end_time ? formatDateTime(entry.end_time) : <span style={{ color: "#9ca3af" }}>—</span>}</td>
                          <td style={td()}>
                            {hrs
                              ? <span style={{ fontWeight: 700, color: "#0ea5e9" }}>{parseFloat(hrs).toFixed(2)} hrs</span>
                              : <span style={{ color: "#9ca3af" }}>—</span>}
                          </td>
                          <td style={{ ...td(), textAlign: "center" }}>
                            <div className="d-flex gap-1 justify-content-center">
                              <button className="btn btn-sm"
                                style={{ backgroundColor: "#eff6ff", color: "#3b82f6", border: "none", fontSize: "11px", padding: "3px 8px", borderRadius: "5px", display: "flex", alignItems: "center", gap: "3px" }}
                                onClick={() => navigate(`/moms/operations/${entry.operation_id || entry.assignment_id}`)}>
                                <MdOpenInNew size={12} /> View
                              </button>
                              {isPrivileged && (
                                <button className="btn btn-sm"
                                  style={{ backgroundColor: "#fee2e2", color: "#dc2626", border: "none", fontSize: "11px", padding: "3px 8px", borderRadius: "5px", display: "flex", alignItems: "center", gap: "3px" }}
                                  onClick={() => handleDelete(entry)}>
                                  <MdDelete size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {filtered.length > 1 && (
                    <tfoot>
                      <tr style={{ backgroundColor: "#f8fafc", borderTop: "2px solid #e2e8f0" }}>
                        <td colSpan="8" style={{ padding: "8px 12px", fontWeight: 700, textAlign: "right", color: "#374151", fontSize: "12px" }}>
                          TOTAL ({filtered.length} entries)
                        </td>
                        <td style={{ padding: "8px 12px", fontWeight: 700, color: "#0ea5e9", fontSize: "12px" }}>
                          {totalHrs.toFixed(2)} hrs
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>
        </div>

        {!isLoading && filtered.length > 0 && (
          <div className="mt-2 text-muted" style={{ fontSize: "12px" }}>
            Showing {filtered.length} of {entries.length} entries
            {hasActiveFilters && <button className="btn btn-link btn-sm p-0 ms-2" style={{ fontSize: "12px" }} onClick={clearFilters}>Clear filters</button>}
          </div>
        )}
      </div>

      {/* Add Time Entries Modal */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }} onClick={() => !saving && setShowAddModal(false)}>
          <div className="modal-dialog modal-dialog-centered modal-xl" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "92vw" }}>
            <div className="modal-content" style={{ borderRadius: "12px" }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <MdAccessTime color="#0ea5e9" /> Add Time Entries
                </h5>
                <button className="btn-close" onClick={() => !saving && setShowAddModal(false)} />
              </div>
              <div className="modal-body px-4" style={{ maxHeight: "75vh", overflowY: "auto" }}>

                {/* Assignment selector */}
                <div className="mb-4 p-3 rounded-3" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <label className="form-label fw-semibold mb-2" style={{ fontSize: "13px" }}>
                    Select Shift <span style={{ color: "red" }}>*</span>
                  </label>
                  {operationsLoading ? (
                    <div style={{ padding: "8px", fontSize: "13px", color: "#6b7280" }}>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Loading assignments...
                    </div>
                  ) : (
                    <SearchableSelect
                      options={assignmentOptions}
                      value={addAssignment}
                      onChange={setAddAssignment}
                      placeholder={assignmentOptions.length === 0 ? "No shifts found — start a shift first via Operations → Start Shift" : "Search by machine, operator or date..."}
                    />
                  )}
                  <small className="text-muted mt-1 d-block">All time entries below will be logged against this shift.</small>
                </div>

                {/* Column headers */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 200px 200px 36px", gap: "8px", marginBottom: "8px", padding: "0 4px" }}>
                  {["Time Category *", "Activity", "Start Date & Time *", "End Date & Time", ""].map((h, i) => (
                    <div key={i} style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.3px" }}>{h}</div>
                  ))}
                </div>

                {/* Entry rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {addRows.map((row, idx) => {
                    const activityOptions = (ACTIVITIES_MAP[row.time_category] || []).map((a) => ({ value: a, label: a }));
                    return (
                      <div key={row._key} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 200px 200px 36px", gap: "8px", alignItems: "center", backgroundColor: idx % 2 === 0 ? "#f8fafc" : "#fff", borderRadius: "8px", padding: "10px", border: "1px solid #e5e7eb" }}>
                        <SearchableSelect
                          options={categoryOptions}
                          value={row.time_category}
                          onChange={(v) => updateRow(row._key, "time_category", v)}
                          placeholder="Select category..."
                        />
                        <SearchableSelect
                          options={activityOptions}
                          value={row.activity}
                          onChange={(v) => updateRow(row._key, "activity", v)}
                          placeholder={row.time_category ? "Search activity..." : "— Select category first —"}
                          disabled={!row.time_category}
                        />
                        <input type="datetime-local" className="form-control form-control-sm"
                          value={row.start_time} onChange={(e) => updateRow(row._key, "start_time", e.target.value)}
                          style={{ fontSize: "12px", borderRadius: "6px" }} />
                        <input type="datetime-local" className="form-control form-control-sm"
                          value={row.end_time} onChange={(e) => updateRow(row._key, "end_time", e.target.value)}
                          style={{ fontSize: "12px", borderRadius: "6px" }} />
                        <button type="button" onClick={() => removeRow(row._key)} disabled={addRows.length === 1}
                          style={{ background: "none", border: "none", cursor: addRows.length === 1 ? "not-allowed" : "pointer", color: addRows.length === 1 ? "#d1d5db" : "#ef4444", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <MdDelete size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button type="button" onClick={addRow}
                  style={{ marginTop: "10px", width: "100%", border: "2px dashed #d1d5db", borderRadius: "8px", backgroundColor: "transparent", padding: "9px", fontSize: "13px", color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: 500 }}>
                  <MdAdd size={16} /> Add Another Row
                </button>
              </div>

              <div className="modal-footer border-0 pt-0">
                <button className="btn btn-secondary" onClick={() => setShowAddModal(false)} disabled={saving}
                  style={{ borderRadius: "6px", fontWeight: 500 }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving || !addAssignment}
                  style={{ borderRadius: "6px", fontWeight: 500, minWidth: "140px" }}>
                  {saving
                    ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                    : <><MdAdd size={16} className="me-1" />Save {addRows.filter(r => r.time_category && r.start_time).length || ""} Entr{addRows.filter(r => r.time_category && r.start_time).length === 1 ? "y" : "ies"}</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

const th = () => ({ padding: "10px 12px", fontWeight: 600, fontSize: "11px", borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.3px", color: "#6b7280" });
const td = () => ({ padding: "9px 12px" });