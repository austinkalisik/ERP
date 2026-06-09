import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { MdSave, MdSearch, MdAssessment, MdDoneAll } from "react-icons/md";
import Swal from "sweetalert2";

const fetchSession = (id) =>
  baseApi.get(`/api/aims/stocktake/${id}`).then((r) => r.data);

const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d) ? val : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtQty = (val) => {
  if (val === null || val === undefined || val === "") return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : Number.isInteger(n) ? n : parseFloat(n.toFixed(2));
};

export default function AIMSStocktakeCount() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const cacheKey = ["aims_stocktake_session", id];
  const { data: session, isLoading } = useQuery({
    queryKey: cacheKey,
    queryFn:  () => fetchSession(id),
    staleTime: 60 * 1000,
  });

  const [edits,        setEdits]        = useState({});
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const lines = session?.lines ?? [];

  const mergedLines = useMemo(() => lines.map((l) => ({
    ...l,
    counted_qty:     edits[l.id]?.counted_qty     ?? l.counted_qty ?? "",
    variance_reason: edits[l.id]?.variance_reason ?? l.variance_reason ?? "",
  })), [lines, edits]);

  const filteredLines = useMemo(() => mergedLines.filter((l) => {
    const matchSearch = !search ||
      l.item?.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.item?.sku?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "all"     ? true :
      filterStatus === "pending" ? l.counted_qty === "" :
      filterStatus === "counted" ? l.counted_qty !== "" : true;
    return matchSearch && matchStatus;
  }), [mergedLines, search, filterStatus]);

  const editLine = (lineId, field, value) =>
    setEdits((e) => ({ ...e, [lineId]: { ...(e[lineId] || {}), [field]: value } }));

  const dirtyCount   = Object.keys(edits).filter((k) => edits[k].counted_qty !== undefined && edits[k].counted_qty !== "").length;
  const countedCount = mergedLines.filter((l) => l.counted_qty !== "").length;
  const totalCount   = mergedLines.length;
  const pct          = totalCount > 0 ? Math.round((countedCount / totalCount) * 100) : 0;
  const allCounted   = countedCount === totalCount && totalCount > 0;
  const isOpen       = session && ["in_progress", "draft"].includes(session.status);

  const saveMutation = useMutation({
    mutationFn: (changed) => baseApi.post(`/api/aims/stocktake/${id}/count`, { lines: changed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cacheKey });
      setEdits({});
      Swal.fire({ icon: "success", title: "Saved!", text: "Counts saved successfully.", confirmButtonColor: "#3b82f6", timer: 2000, showConfirmButton: false });
    },
    onError: (err) => {
      Swal.fire({ icon: "error", title: "Save Failed", text: err.response?.data?.message || "Failed to save counts.", confirmButtonColor: "#3b82f6" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => baseApi.post(`/api/aims/stocktake/${id}/complete`),
    onSuccess: () => {
      Swal.fire({ icon: "success", title: "Complete!", confirmButtonColor: "#3b82f6", timer: 1500, showConfirmButton: false })
        .then(() => navigate(`/aims/stocktake/${id}/variance`));
    },
    onError: (err) => {
      Swal.fire({ icon: "error", title: "Failed", text: err.response?.data?.message || "Cannot complete session.", confirmButtonColor: "#3b82f6" });
    },
  });

  const handleSave = () => {
    const changed = Object.entries(edits)
      .filter(([, v]) => v.counted_qty !== undefined && v.counted_qty !== "")
      .map(([lid, v]) => ({ line_id: parseInt(lid), ...v }));
    if (!changed.length) return;
    saveMutation.mutate(changed);
  };

  const handleComplete = () => {
    Swal.fire({
      title: "Complete Session?",
      text: "This marks the count as complete and lets you view the variance report.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, complete it",
    }).then((r) => { if (r.isConfirmed) completeMutation.mutate(); });
  };

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">

        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h1 style={{ fontWeight: "700", fontSize: "clamp(18px,5vw,24px)", marginBottom: 0 }}>
                {session?.reference || "Stocktake"}
              </h1>
              <span style={{
                backgroundColor: session?.type === "full" ? "#ede9fe" : "#e0f2fe",
                color: session?.type === "full" ? "#5b21b6" : "#0369a1",
                padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600"
              }}>
                {session?.type === "full" ? "Full Count" : "Cyclic Count"}
              </span>
              {session?.status && (
                <span style={{
                  backgroundColor: session.status === "completed" ? "#d1fae5" : "#dbeafe",
                  color: session.status === "completed" ? "#065f46" : "#1e40af",
                  padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600"
                }}>
                  {session.status === "in_progress" ? "In Progress" : session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                </span>
              )}
            </div>
            <p className="text-muted mb-0 mt-1" style={{ fontSize: "13px" }}>
              {formatDate(session?.count_date)}
              {session?.location && <span> · 📍 {session.location}</span>}
              {session?.category && <span> · 🏷 {session.category}</span>}
            </p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            {dirtyCount > 0 && isOpen && (
              <button
                className="btn btn-success d-flex align-items-center gap-2"
                style={{ borderRadius: "8px", fontWeight: "600", fontSize: "13px" }}
                onClick={handleSave}
                disabled={saveMutation.isLoading}
              >
                <MdSave size={16} />
                {saveMutation.isLoading ? "Saving…" : `Save ${dirtyCount} change${dirtyCount > 1 ? "s" : ""}`}
              </button>
            )}
            {allCounted && isOpen && (
              <button
                className="btn btn-primary d-flex align-items-center gap-2"
                style={{ borderRadius: "8px", fontWeight: "600", fontSize: "13px" }}
                onClick={handleComplete}
                disabled={completeMutation.isLoading}
              >
                <MdDoneAll size={16} />
                {completeMutation.isLoading ? "Processing…" : "Complete & View Report"}
              </button>
            )}
            {session?.status === "completed" && (
              <button
                className="btn btn-outline-success d-flex align-items-center gap-2"
                style={{ borderRadius: "8px", fontWeight: "600", fontSize: "13px" }}
                onClick={() => navigate(`/aims/stocktake/${id}/variance`)}
              >
                <MdAssessment size={16} /> Variance Report
              </button>
            )}
            <button
              className="btn btn-outline-secondary"
              style={{ borderRadius: "8px", fontSize: "13px" }}
              onClick={() => navigate("/aims/stocktake")}
            >
              Back
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="card shadow-sm mb-3" style={{ borderRadius: "10px", border: "1px solid #e5e7eb" }}>
          <div className="card-body p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>Count Progress</span>
              <span style={{ fontSize: "13px", color: "#6b7280" }}>
                <strong style={{ color: pct === 100 ? "#10b981" : "#3b82f6" }}>{countedCount}</strong> of {totalCount} items
                <span style={{ marginLeft: 6, color: pct === 100 ? "#10b981" : "#9ca3af" }}>({pct}%)</span>
              </span>
            </div>
            <div style={{ height: "8px", background: "#e5e7eb", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{
                width: `${pct}%`, height: "100%", borderRadius: "4px",
                background: pct === 100 ? "#10b981" : "#3b82f6",
                transition: "width 0.4s"
              }} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card shadow-sm mb-3" style={{ borderRadius: "10px", border: "1px solid #e5e7eb" }}>
          <div className="card-body py-2 px-3 d-flex gap-3 flex-wrap align-items-center">
            <div className="input-group input-group-sm" style={{ maxWidth: 280 }}>
              <span className="input-group-text bg-white border-end-0">
                <MdSearch size={15} color="#9ca3af" />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search SKU or name…"
                style={{ fontSize: "13px" }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="d-flex gap-1">
              {[
                { key: "all",     label: `All (${totalCount})` },
                { key: "pending", label: `Pending (${totalCount - countedCount})` },
                { key: "counted", label: `Counted (${countedCount})` },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => setFilterStatus(s.key)}
                  className="btn btn-sm"
                  style={{
                    borderRadius: "6px", fontSize: "12px", fontWeight: "600", padding: "4px 12px",
                    backgroundColor: filterStatus === s.key ? "#3b82f6" : "#f3f4f6",
                    color: filterStatus === s.key ? "#fff" : "#374151",
                    border: "none",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card shadow-sm" style={{ borderRadius: "10px", border: "1px solid #e5e7eb" }}>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0" style={{ fontSize: "13px" }}>
                <thead style={{ backgroundColor: "#2c3e50", color: "white" }}>
                  <tr>
                    {["SKU", "Item Name", "Category", "System Qty", "Counted Qty", "Variance", "Reason"].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", fontWeight: "600", fontSize: "12px", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan="7" className="text-center py-5 text-muted">Loading items…</td></tr>
                  ) : filteredLines.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-5 text-muted">No items match your filter.</td></tr>
                  ) : (
                    filteredLines.map((line) => {
                      const cq       = line.counted_qty !== "" ? parseFloat(line.counted_qty) : null;
                      const sysQty   = parseFloat(line.system_qty);
                      const variance = cq !== null ? cq - sysQty : null;
                      const isDirty  = edits[line.id] !== undefined;
                      const hasVar   = variance !== null && variance !== 0;

                      return (
                        <tr key={line.id} style={{
                          backgroundColor: isDirty ? "#fffbeb" : undefined,
                          verticalAlign: "middle"
                        }}>
                          <td style={{ padding: "12px 16px" }}>
                            {line.item?.sku
                              ? <span style={{ color: "#3b82f6", fontWeight: "600", fontFamily: "monospace" }}>{line.item.sku}</span>
                              : <span style={{ color: "#d1d5db" }}>—</span>}
                          </td>
                          <td style={{ padding: "12px 16px", fontWeight: "500" }}>{line.item?.name ?? "—"}</td>
                          <td style={{ padding: "12px 16px" }}>
                            {line.item?.category
                              ? <span style={{ backgroundColor: "#f3f4f6", color: "#374151", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>{line.item.category}</span>
                              : <span style={{ color: "#d1d5db" }}>—</span>}
                          </td>
                          <td style={{ padding: "12px 16px", fontWeight: "600", color: "#111827" }}>
                            {fmtQty(line.system_qty) ?? "—"}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            {isOpen ? (
                              <input
                                type="number"
                                min="0"
                                step="1"
                                className="form-control form-control-sm"
                                style={{ width: "90px", borderRadius: "6px", fontSize: "13px", fontWeight: "600" }}
                                value={line.counted_qty}
                                onChange={(e) => editLine(line.id, "counted_qty", e.target.value)}
                                placeholder="—"
                              />
                            ) : (
                              <span style={{ fontWeight: "600" }}>{fmtQty(cq) ?? "—"}</span>
                            )}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            {variance !== null ? (
                              <span style={{
                                fontWeight: "700", fontSize: "13px",
                                color: variance > 0 ? "#16a34a" : variance < 0 ? "#dc2626" : "#9ca3af"
                              }}>
                                {variance > 0 ? "+" : ""}{fmtQty(variance)}
                              </span>
                            ) : <span style={{ color: "#d1d5db" }}>—</span>}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            {isOpen && hasVar ? (
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                style={{ borderRadius: "6px", minWidth: "160px", fontSize: "12px" }}
                                value={line.variance_reason}
                                onChange={(e) => editLine(line.id, "variance_reason", e.target.value)}
                                placeholder="Reason for variance…"
                              />
                            ) : (
                              <span style={{ fontSize: "12px", color: "#6b7280" }}>{line.variance_reason || <span style={{ color: "#d1d5db" }}>—</span>}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}