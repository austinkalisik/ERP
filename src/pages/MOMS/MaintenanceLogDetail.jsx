import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { Modal, Button, Form } from "react-bootstrap";
import {
  MdArrowBack, MdEdit, MdBuild, MdCalendarToday,
  MdPerson, MdAttachMoney, MdDelete, MdSearch,
  MdAttachFile, MdUploadFile, MdDownload, MdPictureAsPdf,
  MdImage, MdInsertDriveFile,
} from "react-icons/md";
import Swal from "sweetalert2";
import { useSettings } from "../../contexts/SettingsContext";

const getFileIcon = (mimeType) => {
  if (mimeType === "application/pdf") return <MdPictureAsPdf size={24} color="#ef4444" />;
  if (["image/jpeg","image/jpg","image/png"].includes(mimeType)) return <MdImage size={24} color="#3b82f6" />;
  return <MdInsertDriveFile size={24} color="#6b7280" />;
};

const maintenanceTypes = ["Preventive", "Corrective", "Predictive", "Emergency", "Routine Check"];
const statuses         = ["Scheduled", "In Progress", "Completed", "Cancelled"];
const STATUS_COLORS    = {
  Completed:     { bg: "#d1fae5", text: "#065f46" },
  "In Progress": { bg: "#dbeafe", text: "#1e40af" },
  Scheduled:     { bg: "#fef3c7", text: "#92400e" },
  Cancelled:     { bg: "#fee2e2", text: "#991b1b" },
};

export default function MaintenanceLogDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { formatCurrency } = useSettings();
  const queryClient = useQueryClient();
  const partSearchRef = useRef(null);
  const fileInputRef  = useRef(null);

  const [showEditModal,  setShowEditModal]  = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [attachments,    setAttachments]    = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [dragOver,       setDragOver]       = useState(false);
  const [partSearch,     setPartSearch]     = useState("");
  const [showPartSearch, setShowPartSearch] = useState(false);
  const [selectedParts,  setSelectedParts]  = useState([]);
  const [formData, setFormData] = useState({
    machine_id: "", maintenance_schedule_id: "", maintenance_type: "",
    status: "", start_time: "", end_time: "", cost: "", description: "",
  });
  const [formInit, setFormInit] = useState(false);

  // ── Log detail — cached 2 min per ID ─────────────────────────────────────
  const logCacheKey = ["moms_maintenance_log", id];
  const { data: log, isLoading: loading } = useQuery({
    queryKey:  logCacheKey,
    queryFn:   () => baseApi.get(`/api/moms/maintenance/logs/${id}`).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
    enabled:   !!id,
  });

  // ── Machines — reuses shared moms_machines cache ──────────────────────────
  const { data: machines = [] } = useQuery({
    queryKey:  ["moms_machines"],
    queryFn:   () => baseApi.get("/api/moms/machines").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  // ── Schedules — reuses shared moms_maintenance_schedules cache ───────────
  const { data: schedules = [] } = useQuery({
    queryKey:  ["moms_maintenance_schedules"],
    queryFn:   () => baseApi.get("/api/moms/maintenance/schedules").then((r) => r.data || []),
    staleTime: 5 * 60 * 1000,
  });

  // ── AIMS items for parts — cached 10 min ─────────────────────────────────
  const { data: aimsRaw = [] } = useQuery({
    queryKey:  ["aims_items_for_moms"],
    queryFn:   () => baseApi.get("/api/aims/items-for-moms").then((r) => r.data?.data || r.data),
    staleTime: 10 * 60 * 1000,
  });
  const aimsItems = Array.isArray(aimsRaw) ? aimsRaw : [];

  // Pre-fill form once log data arrives (guard: only once)
  useEffect(() => {
    if (!log || formInit) return;
    setFormInit(true);
    setAttachments(log.attachments || []);
    if (log.parts_used?.length > 0) {
      setSelectedParts(log.parts_used.map((p) => ({
        item_id: p.item_id, name: p.name, sku: p.sku,
        unit: p.unit, unit_cost: p.unit_cost, qty: p.qty, total: p.total,
      })));
    }
    setFormData({
      machine_id:              log.machine?.id              || "",
      maintenance_schedule_id: log.maintenance_schedule_id  || "",
      maintenance_type:        log.maintenance_type         || "",
      status:                  log.status                   || "",
      start_time:              log.start_time ? log.start_time.slice(0, 16) : "",
      end_time:                log.end_time   ? log.end_time.slice(0, 16)   : "",
      cost:                    log.cost       || "",
      description:             log.description || "",
    });
  }, [log]);

  // Close part-search dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (partSearchRef.current && !partSearchRef.current.contains(e.target)) setShowPartSearch(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  // ── File upload ───────────────────────────────────────────────────────────
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    const allowed = ["application/pdf","image/jpeg","image/jpg","image/png"];
    const maxBytes = 10 * 1024 * 1024;
    const valid = [], errors = [];
    Array.from(files).forEach((f) => {
      if (!allowed.includes(f.type)) errors.push(`${f.name}: unsupported type`);
      else if (f.size > maxBytes)    errors.push(`${f.name}: exceeds 10 MB`);
      else                           valid.push(f);
    });
    if (errors.length) Swal.fire({ icon: "warning", title: "Some files skipped", html: errors.join("<br/>"), confirmButtonColor: "#3b82f6" });
    if (!valid.length) return;
    setUploadingFiles(true);
    try {
      const fd = new FormData();
      valid.forEach((f) => fd.append("files[]", f));
      const res = await baseApi.post(`/api/attachments/maintenance_log/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setAttachments((prev) => [...res.data.data, ...prev]);
      Swal.fire({ icon: "success", title: "Uploaded!", text: res.data.message, confirmButtonColor: "#3b82f6", timer: 2000, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Upload Failed", text: err.response?.data?.message || "Failed to upload files.", confirmButtonColor: "#3b82f6" });
    } finally { setUploadingFiles(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    const result = await Swal.fire({ title: "Delete attachment?", text: "This cannot be undone.", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, delete" });
    if (!result.isConfirmed) return;
    try {
      await baseApi.delete(`/api/attachments/${attachmentId}`);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      Swal.fire({ icon: "success", title: "Deleted!", timer: 1500, showConfirmButton: false });
    } catch { Swal.fire({ icon: "error", title: "Delete Failed", text: "Could not delete attachment.", confirmButtonColor: "#3b82f6" }); }
  };

  const handleDownload  = (attachmentId) => window.open(`${baseApi.defaults.baseURL}/api/attachments/${attachmentId}/download`, "_blank");
  const handleDragOver  = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop      = (e) => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files); };

  const handleInputChange = (e) => { const { name, value } = e.target; setFormData((prev) => ({ ...prev, [name]: value })); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await baseApi.put(`/api/moms/maintenance/logs/${id}`, {
        ...formData,
        end_time:                formData.end_time || null,
        maintenance_schedule_id: formData.maintenance_schedule_id || null,
        parts_used: selectedParts.map((p) => ({ item_id: p.item_id, qty: p.qty })),
        cost: formData.cost || (selectedParts.length > 0 ? partsTotalCost : null),
      });
      setShowEditModal(false);
      // Invalidate this log + the logs list so both refresh
      queryClient.invalidateQueries({ queryKey: logCacheKey });
      queryClient.invalidateQueries({ queryKey: ["moms_maintenance_logs"] });
    } catch {
      Swal.fire({ icon: "error", title: "Update Failed", text: "Failed to update maintenance log.", confirmButtonColor: "#3b82f6" });
    } finally { setSaving(false); }
  };

  if (loading) return <Layout><div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}><div className="spinner-border text-primary" /></div></Layout>;
  if (!log)    return <Layout><div className="container-fluid px-4 py-5 text-center"><p className="text-muted">Maintenance log not found.</p><button className="btn btn-primary mt-2" onClick={() => navigate("/moms/maintenance/logs")}>Back to Logs</button></div></Layout>;

  const statusStyle = STATUS_COLORS[log.status] || { bg: "#f3f4f6", text: "#374151" };

  const InfoRow = ({ label, value }) => (
    <div style={{ marginBottom: "20px" }}>
      <p style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>{label}</p>
      <p style={{ fontSize: "15px", fontWeight: "500", marginBottom: 0, color: "#111827" }}>{value || <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Not provided</span>}</p>
    </div>
  );

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        {/* Header */}
        <div className="row mb-4 align-items-start">
          <div className="col">
            <button className="btn btn-link p-0 mb-2 text-muted d-inline-flex align-items-center gap-1" style={{ fontSize: "14px", textDecoration: "none" }} onClick={() => navigate("/moms/maintenance/logs")}>
              <MdArrowBack size={16} /> Back to Maintenance Logs
            </button>
            <div className="d-flex align-items-center gap-3 mt-1">
              <div style={{ width: "48px", height: "48px", backgroundColor: "#0ea5e9", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><MdBuild size={24} color="#fff" /></div>
              <div>
                <h1 style={{ fontWeight: "bold", fontSize: "clamp(18px, 4vw, 26px)", marginBottom: "4px" }}>Maintenance Log #{log.id}</h1>
                <p className="text-muted mb-0" style={{ fontSize: "14px" }}>{log.machine?.machine_id || "N/A"} &mdash; {log.maintenance_type}</p>
              </div>
            </div>
          </div>
          <div className="col-auto mt-4">
            <button className="btn" style={{ height: "42px", fontSize: "15px", fontWeight: "500", borderRadius: "8px", display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "#3b82f6", color: "white", border: "none" }} onClick={() => setShowEditModal(true)}>
              <MdEdit size={18} /> Edit Log
            </button>
          </div>
        </div>

        <div className="row g-3">
          {/* ── Left column ── */}
          <div className="col-12 col-lg-8">
            {/* Details card */}
            <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-body p-4">
                <h5 style={{ fontWeight: "700", marginBottom: "24px", fontSize: "16px" }}>Log Details</h5>
                <div className="row">
                  <div className="col-sm-6"><InfoRow label="Machine"          value={<span style={{ color: "#3b82f6" }}>{log.machine?.machine_id || "N/A"}</span>} /></div>
                  <div className="col-sm-6"><InfoRow label="Maintenance Type" value={log.maintenance_type} /></div>
                  <div className="col-sm-6"><InfoRow label="Status"           value={<span className="badge" style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, padding: "6px 12px", borderRadius: "6px", fontWeight: "500", fontSize: "13px" }}>{log.status}</span>} /></div>
                  <div className="col-sm-6"><InfoRow label="Cost"             value={log.cost ? formatCurrency(log.cost) : null} /></div>
                  <div className="col-sm-6"><InfoRow label="Start Time"       value={log.start_time ? new Date(log.start_time).toLocaleString() : null} /></div>
                  <div className="col-sm-6"><InfoRow label="End Time"         value={log.end_time ? new Date(log.end_time).toLocaleString() : null} /></div>
                  <div className="col-sm-6"><InfoRow label="Performed By"     value={log.performed_by} /></div>
                  <div className="col-sm-6"><InfoRow label="Linked Schedule"  value={log.schedule?.title || (log.maintenance_schedule_id ? `Schedule #${log.maintenance_schedule_id}` : null)} /></div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="card shadow-sm mt-3" style={{ borderRadius: "12px" }}>
              <div className="card-body p-4">
                <h5 style={{ fontWeight: "700", marginBottom: "12px", fontSize: "16px" }}>Description</h5>
                <p style={{ color: "#374151", lineHeight: "1.6", marginBottom: 0 }}>{log.description || <span style={{ color: "#9ca3af", fontStyle: "italic" }}>No description provided.</span>}</p>
              </div>
            </div>

            {/* Parts Used */}
            <div className="card shadow-sm mt-3" style={{ borderRadius: "12px" }}>
              <div className="card-body p-4">
                <h5 style={{ fontWeight: "700", marginBottom: "16px", fontSize: "16px" }}>Parts Used</h5>
                {log.parts_used?.length > 0 ? (
                  <>
                    <div className="table-responsive">
                      <table className="table mb-2" style={{ fontSize: "14px" }}>
                        <thead style={{ backgroundColor: "#f8fafc" }}>
                          <tr>{["Part","SKU","Qty","Unit Cost","Total"].map((h) => <th key={h} style={{ padding: "10px 12px", fontWeight: "600", color: "#666", fontSize: "12px" }}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {log.parts_used.map((part, i) => (
                            <tr key={i}>
                              <td style={{ padding: "10px 12px", fontWeight: "500" }}>{part.name}</td>
                              <td style={{ padding: "10px 12px", color: "#6b7280" }}>{part.sku}</td>
                              <td style={{ padding: "10px 12px" }}>{part.qty} {part.unit}</td>
                              <td style={{ padding: "10px 12px" }}>{formatCurrency(part.unit_cost)}</td>
                              <td style={{ padding: "10px 12px", fontWeight: "600" }}>{formatCurrency(part.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="d-flex justify-content-end">
                      <div style={{ backgroundColor: "#f0fdf4", borderRadius: "8px", padding: "10px 16px", fontSize: "15px", fontWeight: "700", color: "#15803d" }}>
                        Parts Total: {formatCurrency(log.parts_cost || 0)}
                      </div>
                    </div>
                  </>
                ) : (
                  <p style={{ color: "#9ca3af", fontStyle: "italic", marginBottom: 0 }}>No parts recorded.</p>
                )}
              </div>
            </div>

            {/* Attachments */}
            <div className="card shadow-sm mt-3" style={{ borderRadius: "12px" }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 style={{ fontWeight: "700", fontSize: "16px", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <MdAttachFile size={20} color="#6b7280" /> Attachments
                    {attachments.length > 0 && <span style={{ fontSize: "13px", backgroundColor: "#e5e7eb", color: "#374151", borderRadius: "12px", padding: "2px 10px", fontWeight: "600" }}>{attachments.length}</span>}
                  </h5>
                  <button className="btn btn-sm" style={{ backgroundColor: "#0ea5e9", color: "white", borderRadius: "6px", fontSize: "13px", display: "flex", alignItems: "center", gap: "4px", border: "none" }} onClick={() => fileInputRef.current?.click()} disabled={uploadingFiles}>
                    <MdUploadFile size={16} />{uploadingFiles ? "Uploading..." : "Upload Files"}
                  </button>
                </div>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={(e) => handleFileUpload(e.target.files)} />
                <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
                  style={{ border: `2px dashed ${dragOver ? "#0ea5e9" : "#d1d5db"}`, borderRadius: "10px", padding: "20px", textAlign: "center", cursor: "pointer", backgroundColor: dragOver ? "#f0f9ff" : "#f8fafc", transition: "all 0.2s ease", marginBottom: attachments.length > 0 ? "16px" : 0 }}>
                  <MdUploadFile size={32} color={dragOver ? "#0ea5e9" : "#9ca3af"} />
                  <p style={{ marginBottom: "4px", fontSize: "14px", color: dragOver ? "#0ea5e9" : "#6b7280", fontWeight: "500" }}>{uploadingFiles ? "Uploading..." : "Drop files here or click to browse"}</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>PDF, JPG, PNG — max 10 MB per file</p>
                </div>
                {attachments.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {attachments.map((att) => (
                      <div key={att.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                        <div style={{ flexShrink: 0 }}>{getFileIcon(att.file_type)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: "600", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{att.file_name}</p>
                          <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>{att.size_formatted}{att.created_at && ` • ${new Date(att.created_at).toLocaleDateString()}`}</p>
                        </div>
                        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                          <button className="btn btn-sm" style={{ color: "#0ea5e9", padding: "4px 8px", backgroundColor: "#e0f2fe", borderRadius: "6px", border: "none" }} onClick={() => handleDownload(att.id)}><MdDownload size={16} /></button>
                          <button className="btn btn-sm" style={{ color: "#ef4444", padding: "4px 8px", backgroundColor: "#fee2e2", borderRadius: "6px", border: "none" }} onClick={() => handleDeleteAttachment(att.id)}><MdDelete size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="col-12 col-lg-4">
            <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-body p-4">
                <h5 style={{ fontWeight: "700", marginBottom: "20px", fontSize: "16px" }}>Summary</h5>
                {[
                  { icon: <MdBuild size={18} color="#0ea5e9" />,        label: "Type",        value: log.maintenance_type },
                  { icon: <MdCalendarToday size={18} color="#8b5cf6" />, label: "Date",        value: log.start_time ? new Date(log.start_time).toLocaleDateString() : "N/A" },
                  { icon: <MdPerson size={18} color="#16a34a" />,        label: "Technician",  value: log.performed_by || "Unassigned" },
                  { icon: <MdAttachMoney size={18} color="#ca8a04" />,   label: "Cost",        value: log.cost ? formatCurrency(log.cost) : "N/A" },
                  { icon: <MdAttachMoney size={18} color="#0ea5e9" />,   label: "Parts Cost",  value: log.parts_cost ? formatCurrency(log.parts_cost) : "N/A" },
                  { icon: <MdAttachFile size={18} color="#6b7280" />,    label: "Attachments", value: `${attachments.length} file(s)` },
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
            <div className="card shadow-sm mt-3" style={{ borderRadius: "12px" }}>
              <div className="card-body p-4">
                <h5 style={{ fontWeight: "700", marginBottom: "16px", fontSize: "16px" }}>Actions</h5>
                <button className="btn w-100 mb-2" style={{ backgroundColor: "#3b82f6", color: "white", borderRadius: "8px", height: "40px", fontSize: "14px", border: "none" }} onClick={() => setShowEditModal(true)}><MdEdit size={16} className="me-2" /> Edit This Log</button>
                <button className="btn w-100 mb-2" style={{ backgroundColor: "#0ea5e9", color: "white", borderRadius: "8px", height: "40px", fontSize: "14px", border: "none" }} onClick={() => fileInputRef.current?.click()}><MdUploadFile size={16} className="me-2" /> Upload Job Card</button>
                <button className="btn btn-outline-secondary w-100" style={{ borderRadius: "8px", height: "40px", fontSize: "14px" }} onClick={() => navigate("/moms/maintenance/logs")}>Back to All Logs</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered size="lg">
        <Modal.Header closeButton style={{ borderBottom: "1px solid #e5e7eb" }}>
          <Modal.Title style={{ fontWeight: "600" }}>Edit Maintenance Log #{id}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ padding: "24px" }}>
            <div className="row">
              <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Machine <span style={{ color: "red" }}>*</span></Form.Label><Form.Select name="machine_id" value={formData.machine_id} onChange={handleInputChange} required><option value="">Select Machine</option>{machines.map((m) => <option key={m.id} value={m.id}>{m.machine_id}</option>)}</Form.Select></Form.Group></div>
              <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Maintenance Schedule (Optional)</Form.Label><Form.Select name="maintenance_schedule_id" value={formData.maintenance_schedule_id} onChange={handleInputChange}><option value="">-- None --</option>{schedules.map((s) => <option key={s.id} value={s.id}>{s.title || `Schedule ${s.id}`}</option>)}</Form.Select></Form.Group></div>
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
                  <input type="text" className="form-control" placeholder="Search AIMS parts..." value={partSearch}
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
                {selectedParts.length > 0 && <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: "400", marginLeft: "8px" }}>Leave blank to auto-fill ({formatCurrency(partsTotalCost)})</span>}
              </Form.Label>
              <Form.Control type="number" step="0.01" name="cost" value={formData.cost} onChange={handleInputChange}
                placeholder={selectedParts.length > 0 ? `Auto: ${formatCurrency(partsTotalCost)}` : "0.00"} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ borderTop: "1px solid #e5e7eb", gap: "8px" }}>
            <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={saving} style={{ borderRadius: "6px" }}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving} style={{ borderRadius: "6px" }}>{saving ? "Saving..." : "Save Changes"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Layout>
  );
}