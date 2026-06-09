import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { Modal, Button, Form } from "react-bootstrap";
import { MdAdd, MdFilterList, MdCalendarToday, MdSearch, MdDelete } from "react-icons/md";
import Swal from "sweetalert2";
import { useSettings } from "../../contexts/SettingsContext";

const maintenanceTypes = ["Preventive", "Corrective", "Predictive", "Emergency", "Routine Check"];
const statuses         = ["Scheduled", "In Progress", "Completed", "Cancelled"];
const EMPTY_FORM       = { machine_id: "", maintenance_schedule_id: "", maintenance_type: "", status: "", start_time: "", end_time: "", cost: "", description: "" };

export default function MaintenanceLogs() {
  const navigate    = useNavigate();
  const { formatCurrency } = useSettings();
  const queryClient = useQueryClient();
  const partSearchRef = useRef(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery,     setSearchQuery]     = useState("");
  const [formData,        setFormData]        = useState(EMPTY_FORM);
  const [partSearch,      setPartSearch]      = useState("");
  const [showPartSearch,  setShowPartSearch]  = useState(false);
  const [selectedParts,   setSelectedParts]   = useState([]);

  useEffect(() => {
    const handler = (e) => {
      if (partSearchRef.current && !partSearchRef.current.contains(e.target)) setShowPartSearch(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Maintenance logs — cached 2 min ──────────────────────────────────────
  const logsCacheKey = ["moms_maintenance_logs"];
  const { data: logs = [], isLoading: loading } = useQuery({
    queryKey:  logsCacheKey,
    queryFn:   () => baseApi.get("/api/moms/maintenance/logs").then((r) => r.data || []),
    staleTime: 2 * 60 * 1000,
  });

  // ── Stats — cached 5 min ─────────────────────────────────────────────────
  const statsCacheKey = ["moms_maintenance_stats"];
  const { data: stats = { totalLogs: 0, critical: 0, pending: 0, schedules: 0 } } = useQuery({
    queryKey:  statsCacheKey,
    queryFn:   () => baseApi.get("/api/moms/maintenance/stats").then((r) => r.data || {}),
    staleTime: 5 * 60 * 1000,
  });

  // ── Machines — reuses shared moms_machines cache ──────────────────────────
  const { data: machines = [] } = useQuery({
    queryKey:  ["moms_machines"],
   queryFn: () => baseApi.get("/api/moms/machines").then((r) => r.data?.data || r.data || []),
    staleTime: 5 * 60 * 1000,
  });

  // ── Schedules — reuses shared moms_maintenance_schedules cache ───────────
  const { data: schedules = [] } = useQuery({
    queryKey:  ["moms_maintenance_schedules"],
    queryFn:   () => baseApi.get("/api/moms/maintenance/schedules").then((r) => r.data || []),
    staleTime: 5 * 60 * 1000,
  });

  // ── AIMS items — cached 10 min ────────────────────────────────────────────
  const { data: aimsRaw = [] } = useQuery({
    queryKey:  ["aims_items_for_moms"],
    queryFn:   () => baseApi.get("/api/aims/items-for-moms").then((r) => r.data?.data || r.data),
    staleTime: 10 * 60 * 1000,
  });
  const aimsItems = Array.isArray(aimsRaw) ? aimsRaw : [];

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: logsCacheKey });
    queryClient.invalidateQueries({ queryKey: statsCacheKey });
  };

  const filteredAimsItems = useMemo(() => {
    const q = partSearch.toLowerCase();
    return aimsItems.filter((item) =>
      item.name?.toLowerCase().includes(q) ||
      item.sku?.toLowerCase().includes(q)  ||
      item.category?.toLowerCase().includes(q)
    );
  }, [aimsItems, partSearch]);

  const round2 = (n) => Math.round(n * 100) / 100;

  const addPart = (item) => {
    const already = selectedParts.find((p) => p.item_id === item.id);
    if (already) { updatePartQty(item.id, already.qty + 1); }
    else {
      const unitCost = parseFloat(item.cost_price) || 0;
      setSelectedParts((prev) => [...prev, { item_id: item.id, name: item.name, sku: item.sku, unit: item.unit, unit_cost: unitCost, qty: 1, total: unitCost }]);
    }
    setPartSearch(""); setShowPartSearch(false);
  };
  const updatePartQty = (itemId, newQty) => {
    if (newQty < 1) return;
    setSelectedParts((prev) => prev.map((p) => p.item_id === itemId ? { ...p, qty: newQty, total: round2(newQty * p.unit_cost) } : p));
  };
  const removePart     = (itemId) => setSelectedParts((prev) => prev.filter((p) => p.item_id !== itemId));
  const partsTotalCost = selectedParts.reduce((sum, p) => sum + p.total, 0);

  const handleInputChange = (e) => { const { name, value } = e.target; setFormData((prev) => ({ ...prev, [name]: value })); };

  const resetModal = () => { setFormData(EMPTY_FORM); setSelectedParts([]); setPartSearch(""); setShowPartSearch(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await baseApi.post("/api/moms/maintenance/logs", {
        ...formData,
        parts_used: selectedParts.map((p) => ({ item_id: p.item_id, qty: p.qty })),
        cost: formData.cost || (selectedParts.length > 0 ? partsTotalCost : null),
      });
      setShowCreateModal(false); resetModal(); refetch();
      Swal.fire({ icon: "success", title: "Log Created!", text: "Maintenance log has been created successfully.", confirmButtonColor: "#0ea5e9", timer: 2000, timerProgressBar: true, showConfirmButton: false });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Failed to Create", text: error.response?.data?.message || "Failed to create maintenance log.", confirmButtonColor: "#3b82f6" });
    }
  };

  // Client-side filter — zero network requests
  const filteredLogs = useMemo(() =>
    logs.filter((log) => log.machine?.machine_id?.toLowerCase().includes(searchQuery.toLowerCase())),
    [logs, searchQuery]
  );

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        {/* Header */}
        <div className="row mb-3 mb-md-4">
          <div className="col-12 col-md-6">
            <div className="d-flex align-items-center gap-3">
              <div style={{ width: "48px", height: "48px", backgroundColor: "#0ea5e9", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}><MdCalendarToday size={24} color="#fff" /></div>
              <div>
                <h1 style={{ fontWeight: "bold", fontSize: "clamp(20px, 5vw, 28px)", marginBottom: "4px" }}>Maintenance Management</h1>
                <p className="text-muted mb-0" style={{ fontSize: "14px" }}>Track and schedule machine maintenance</p>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6 mt-3 mt-md-0 text-md-end">
            <button className="btn" style={{ height: "42px", fontSize: "15px", fontWeight: "500", borderRadius: "8px", display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "#0ea5e9", color: "white", border: "none" }} onClick={() => { resetModal(); setShowCreateModal(true); }}>
              <MdAdd size={20} /> New Maintenance Log
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="row g-2 g-md-3 mb-3 mb-md-4">
          {[
            { label: "Total Logs", value: stats.totalLogs, bg: "#0891b2" },
            { label: "Critical",   value: stats.critical,  bg: "#dc2626", sub: "Overdue" },
            { label: "Pending",    value: stats.pending,   bg: "#ca8a04" },
            { label: "Schedules",  value: stats.schedules, bg: "#16a34a" },
          ].map((card) => (
            <div key={card.label} className="col-6 col-lg-3">
              <div className="card shadow-sm" style={{ borderRadius: "12px", backgroundColor: card.bg, color: "white", border: "none" }}>
                <div className="card-body p-3">
                  <p className="mb-1" style={{ fontSize: "14px", opacity: 0.9 }}>{card.label}</p>
                  <h2 className="mb-0" style={{ fontWeight: "bold" }}>{card.value}</h2>
                  {card.sub && <p className="mb-0" style={{ fontSize: "12px", opacity: 0.8 }}>{card.sub}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="row g-2 mb-3">
          <div className="col-12 col-md-8">
            <input type="text" className="form-control" placeholder="Search machine..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ height: "42px", borderRadius: "8px", border: "1px solid #e5e7eb" }} />
          </div>
          <div className="col-6 col-md-2">
            <button className="btn btn-outline-primary w-100" style={{ height: "42px", borderRadius: "8px" }}><MdFilterList size={18} className="me-2" /> Filter</button>
          </div>
          <div className="col-6 col-md-2">
            <button className="btn w-100" style={{ height: "42px", borderRadius: "8px", backgroundColor: "#8b5cf6", color: "white", border: "none" }} onClick={() => navigate("/moms/maintenance/schedules")}>
              <MdCalendarToday size={18} className="me-2" /> Schedule
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                  <tr>{["Date","Machine","Type","Performed By","Parts Cost","Cost","Status","Actions"].map((h) => <th key={h} style={{ padding: "16px", fontWeight: "600", fontSize: "13px", color: "#666" }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="8" className="text-center py-5">Loading...</td></tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr><td colSpan="8" className="text-center py-5"><div style={{ opacity: 0.5 }}><MdCalendarToday size={48} color="#9ca3af" /><p className="text-muted mt-2 mb-0">No maintenance logs found</p></div></td></tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ padding: "16px" }}>{new Date(log.start_time).toLocaleDateString()}</td>
                        <td style={{ padding: "16px" }}>{log.machine?.machine_id || "N/A"}</td>
                        <td style={{ padding: "16px" }}>{log.maintenance_type}</td>
                        <td style={{ padding: "16px" }}>{log.performed_by || "N/A"}</td>
                        <td style={{ padding: "16px" }}>{log.parts_cost > 0 ? <span style={{ color: "#0ea5e9", fontWeight: "600" }}>{formatCurrency(log.parts_cost)}</span> : <span style={{ color: "#9ca3af" }}>—</span>}</td>
                        <td style={{ padding: "16px" }}>{log.cost ? formatCurrency(log.cost) : "N/A"}</td>
                        <td style={{ padding: "16px" }}>
                          <span className="badge" style={{
                            backgroundColor: log.status === "Completed" ? "#d1fae5" : log.status === "In Progress" ? "#dbeafe" : log.status === "Scheduled" ? "#fef3c7" : "#fee2e2",
                            color:           log.status === "Completed" ? "#065f46" : log.status === "In Progress" ? "#1e40af" : log.status === "Scheduled" ? "#92400e" : "#991b1b",
                            padding: "6px 12px", borderRadius: "6px", fontWeight: "500",
                          }}>{log.status}</span>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <button className="btn btn-sm btn-link" style={{ color: "#3b82f6", fontSize: "13px" }} onClick={() => navigate(`/moms/maintenance/logs/${log.id}`)}>View</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Create Modal ── */}
      <Modal show={showCreateModal} onHide={() => { setShowCreateModal(false); resetModal(); }} centered size="lg">
        <Modal.Header closeButton style={{ borderBottom: "1px solid #e5e7eb" }}>
          <Modal.Title style={{ fontWeight: "600" }}>Create Maintenance Log</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ padding: "24px" }}>
            <div className="row">
              <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Machine <span style={{ color: "red" }}>*</span></Form.Label><Form.Select name="machine_id" value={formData.machine_id} onChange={handleInputChange} required><option value="">Select Machine</option>{machines.map((m) => <option key={m.id} value={m.id}>{m.machine_id}</option>)}</Form.Select></Form.Group></div>
              <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Maintenance Schedule (Optional)</Form.Label><Form.Select name="maintenance_schedule_id" value={formData.maintenance_schedule_id} onChange={handleInputChange}><option value="">-- Select Schedule --</option>{schedules.map((s) => <option key={s.id} value={s.id}>{s.title || `Schedule ${s.id}`}</option>)}</Form.Select></Form.Group></div>
            </div>
            <div className="row">
              <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Maintenance Type <span style={{ color: "red" }}>*</span></Form.Label><Form.Select name="maintenance_type" value={formData.maintenance_type} onChange={handleInputChange} required><option value="">-- Select Type --</option>{maintenanceTypes.map((t) => <option key={t} value={t}>{t}</option>)}</Form.Select></Form.Group></div>
              <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Status <span style={{ color: "red" }}>*</span></Form.Label><Form.Select name="status" value={formData.status} onChange={handleInputChange} required><option value="">-- Select Status --</option>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</Form.Select></Form.Group></div>
            </div>
            <div className="row">
              <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Start Time <span style={{ color: "red" }}>*</span></Form.Label><Form.Control type="datetime-local" name="start_time" value={formData.start_time} onChange={handleInputChange} required /></Form.Group></div>
              <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>End Time (Optional)</Form.Label><Form.Control type="datetime-local" name="end_time" value={formData.end_time} onChange={handleInputChange} /></Form.Group></div>
            </div>
            <Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Description <span style={{ color: "red" }}>*</span></Form.Label><Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleInputChange} required /></Form.Group>

            {/* Parts picker */}
            <div className="mb-3">
              <Form.Label style={{ fontWeight: "500" }}>Parts Used (from AIMS Inventory)</Form.Label>
              <div ref={partSearchRef} style={{ position: "relative", marginBottom: "8px" }}>
                <div className="input-group">
                  <span className="input-group-text" style={{ backgroundColor: "#f8fafc" }}><MdSearch size={18} color="#6b7280" /></span>
                  <input type="text" className="form-control" placeholder="Search AIMS parts by name, SKU, or category..." value={partSearch}
                    onChange={(e) => { setPartSearch(e.target.value); setShowPartSearch(true); }}
                    onFocus={() => setShowPartSearch(true)} style={{ borderLeft: "none" }} />
                </div>
                {showPartSearch && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 1050, backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxHeight: "220px", overflowY: "auto" }}>
                    {filteredAimsItems.length === 0
                      ? <div style={{ padding: "12px 16px", color: "#9ca3af", fontSize: "14px" }}>No parts found.</div>
                      : filteredAimsItems.map((item) => (
                          <div key={item.id} onClick={() => addPart(item)}
                            style={{ padding: "10px 16px", cursor: "pointer", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fff"}>
                            <div><div style={{ fontWeight: "600", fontSize: "14px" }}>{item.name}</div><div style={{ fontSize: "12px", color: "#6b7280" }}>{item.sku} &bull; {item.category}</div></div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontWeight: "600", color: "#0ea5e9", fontSize: "13px" }}>{formatCurrency(item.cost_price)}</div>
                              <div style={{ fontSize: "11px", color: item.current_stock > 0 ? "#16a34a" : "#dc2626" }}>Stock: {item.current_stock ?? 0}</div>
                            </div>
                          </div>
                        ))
                    }
                  </div>
                )}
              </div>
              {selectedParts.length > 0 ? (
                <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
                  <table className="table mb-0" style={{ fontSize: "13px" }}>
                    <thead style={{ backgroundColor: "#f8fafc" }}><tr>{["Part","SKU","Qty","Unit Cost","Total",""].map((h, i) => <th key={i} style={{ padding: "10px 12px", fontWeight: "600", color: "#666" }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {selectedParts.map((part) => (
                        <tr key={part.item_id}>
                          <td style={{ padding: "8px 12px", fontWeight: "500" }}>{part.name}</td>
                          <td style={{ padding: "8px 12px", color: "#6b7280" }}>{part.sku}</td>
                          <td style={{ padding: "8px 12px" }}>
                            <div className="d-flex align-items-center gap-1">
                              <button type="button" className="btn btn-sm btn-outline-secondary" style={{ padding: "0px 6px", lineHeight: "1.4" }} onClick={() => updatePartQty(part.item_id, part.qty - 1)}>−</button>
                              <span style={{ minWidth: "24px", textAlign: "center" }}>{part.qty}</span>
                              <button type="button" className="btn btn-sm btn-outline-secondary" style={{ padding: "0px 6px", lineHeight: "1.4" }} onClick={() => updatePartQty(part.item_id, part.qty + 1)}>+</button>
                            </div>
                          </td>
                          <td style={{ padding: "8px 12px" }}>{formatCurrency(part.unit_cost)}</td>
                          <td style={{ padding: "8px 12px", fontWeight: "600" }}>{formatCurrency(part.total)}</td>
                          <td style={{ padding: "8px 12px" }}><button type="button" className="btn btn-sm" style={{ color: "#dc2626", padding: "2px 6px" }} onClick={() => removePart(part.item_id)}><MdDelete size={16} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ backgroundColor: "#f0fdf4", padding: "10px 16px", display: "flex", justifyContent: "flex-end", borderTop: "1px solid #e5e7eb" }}>
                    <span style={{ fontWeight: "700", color: "#15803d", fontSize: "14px" }}>Parts Total: {formatCurrency(partsTotalCost)}</span>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px dashed #d1d5db", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>No parts added yet. Search above to add parts from AIMS inventory.</div>
              )}
            </div>

            <Form.Group className="mb-1">
              <Form.Label style={{ fontWeight: "500" }}>
                Cost (Optional)
                {selectedParts.length > 0 && <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "400", marginLeft: "8px" }}>Leave blank to auto-fill from parts total ({formatCurrency(partsTotalCost)})</span>}
              </Form.Label>
              <Form.Control type="number" step="0.01" name="cost" value={formData.cost} onChange={handleInputChange}
                placeholder={selectedParts.length > 0 ? `Auto: ${formatCurrency(partsTotalCost)}` : "0.00"} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ borderTop: "1px solid #e5e7eb", gap: "8px" }}>
            <Button variant="secondary" onClick={() => { setShowCreateModal(false); resetModal(); }} style={{ borderRadius: "6px" }}>Cancel</Button>
            <Button variant="primary" type="submit" style={{ borderRadius: "6px", backgroundColor: "#3b82f6" }}>Create Maintenance Log</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Layout>
  );
}