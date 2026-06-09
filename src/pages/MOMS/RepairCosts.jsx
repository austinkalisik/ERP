import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { useSettings } from "../../contexts/SettingsContext";
import { Modal, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, PieChart, Pie,
} from "recharts";
import {
  MdBuild, MdAdd, MdTrendingUp, MdTrendingDown,
  MdAttachMoney, MdFilterList,
} from "react-icons/md";

const COST_TYPES = [
  { val: "labour",           label: "Labour",           color: "#3b82f6" },
  { val: "parts",            label: "Parts",            color: "#10b981" },
  { val: "external_service", label: "External Service", color: "#f59e0b" },
  { val: "other",            label: "Other",            color: "#8b5cf6" },
];
const typeColor = (t) => COST_TYPES.find((c) => c.val === t)?.color || "#6b7280";
const typeLabel = (t) => COST_TYPES.find((c) => c.val === t)?.label || t;

const fetchSummary  = (from, to) => baseApi.get("/api/moms/finance/repair-costs/summary", { params: { from, to } }).then((r) => r.data);
const fetchCosts    = (params)   => baseApi.get("/api/moms/finance/repair-costs",          { params }).then((r) => r.data);
const fetchMachines = ()         => baseApi.get("/api/moms/machines").then((r) => r.data.data || []);

export default function RepairCosts() {
  const qc                               = useQueryClient();
  const { formatCurrency, formatDate }   = useSettings();

  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
    to:   new Date().toISOString().split("T")[0],
  });
  const [tableFilters, setTableFilters] = useState({ machine_id: "", cost_type: "" });
  const [showAdd,      setShowAdd]      = useState(false);

  const { data: summary } = useQuery({
    queryKey:  ["rm_summary", dateRange],
    queryFn:   () => fetchSummary(dateRange.from, dateRange.to),
    staleTime: 5 * 60 * 1000,
  });

  const { data: costsData, isLoading } = useQuery({
    queryKey:  ["rm_costs", tableFilters],
    queryFn:   () => fetchCosts(tableFilters),
    staleTime: 2 * 60 * 1000,
  });

  const { data: machines = [] } = useQuery({
    queryKey: ["moms_machines_list"],
    queryFn:  fetchMachines,
    staleTime: 10 * 60 * 1000,
  });

  const costs = costsData?.data ?? [];
  const kpi   = summary?.kpi || {};
  const trend = (summary?.trend || []).map((t) => ({ month: t.month, total: parseFloat(t.total) }));

  const byMachineChart = (summary?.by_machine || []).map((m) => ({
    name:  m.machine_ref,
    total: parseFloat(m.total),
    label: m.label,
  }));

  const byTypeChart = COST_TYPES.map((t) => ({
    name:  t.label,
    value: parseFloat(summary?.by_type?.[t.val]?.total || 0),
    fill:  t.color,
  })).filter((t) => t.value > 0);

  const changePct = kpi.change_pct;

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h1 style={{ fontWeight: "bold", fontSize: "clamp(18px, 4vw, 26px)", marginBottom: 2 }}>
              Repair & Maintenance Costs
            </h1>
            <p className="text-muted mb-0" style={{ fontSize: 13 }}>Track labour, parts & service costs per machine</p>
          </div>
          <button
            className="btn btn-sm d-flex align-items-center gap-2"
            style={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: 8, fontWeight: 600 }}
            onClick={() => setShowAdd(true)}
          >
            <MdAdd size={16} /> Record Cost
          </button>
        </div>

        {/* Date range for summary */}
        <div className="card shadow-sm mb-4" style={{ borderRadius: 12 }}>
          <div className="card-body p-3 d-flex flex-wrap gap-3 align-items-center">
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Summary Period:</span>
            <input type="date" className="form-control form-control-sm" style={{ width: 160, borderRadius: 8 }} value={dateRange.from} onChange={(e) => setDateRange((d) => ({ ...d, from: e.target.value }))} />
            <span style={{ fontSize: 13, color: "#9ca3af" }}>to</span>
            <input type="date" className="form-control form-control-sm" style={{ width: 160, borderRadius: 8 }} value={dateRange.to} onChange={(e) => setDateRange((d) => ({ ...d, to: e.target.value }))} />
          </div>
        </div>

        {/* KPI cards */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="card shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-body p-3">
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Total R&M This Period</div>
                <div style={{ fontSize: 28, fontWeight: "bold", color: "#111" }}>
                  {formatCurrency(kpi.total_this_period || 0)}
                </div>
                {changePct !== null && changePct !== undefined && (
                  <div style={{ fontSize: 12, color: changePct <= 0 ? "#16a34a" : "#dc2626", display: "flex", alignItems: "center", gap: 4 }}>
                    {changePct <= 0 ? <MdTrendingDown size={14} /> : <MdTrendingUp size={14} />}
                    {Math.abs(changePct)}% vs previous period
                  </div>
                )}
              </div>
            </div>
          </div>
          {COST_TYPES.map((t) => (
            <div key={t.val} className="col-6 col-md-2">
              <div className="card shadow-sm" style={{ borderRadius: 12 }}>
                <div className="card-body p-3">
                  <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>{t.label}</div>
                  <div style={{ fontSize: 18, fontWeight: "bold", color: t.color }}>
                    {formatCurrency(parseFloat(summary?.by_type?.[t.val]?.total || 0))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-lg-8">
            <div className="card shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-header bg-white border-bottom p-3">
                <h6 className="mb-0 fw-semibold">R&M Cost by Machine (Top 10)</h6>
              </div>
              <div className="card-body p-3" style={{ height: 280 }}>
                {byMachineChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byMachineChart} margin={{ left: -10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v, n, p) => [formatCurrency(v), p.payload.label]} />
                      <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <p className="text-muted">No data for this period</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className="card shadow-sm" style={{ borderRadius: 12 }}>
              <div className="card-header bg-white border-bottom p-3">
                <h6 className="mb-0 fw-semibold">Cost by Type</h6>
              </div>
              <div className="card-body p-3" style={{ height: 280 }}>
                {byTypeChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={byTypeChart} dataKey="value" cx="50%" cy="45%" outerRadius={75}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {byTypeChart.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100">
                    <p className="text-muted">No data</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {trend.length > 0 && (
          <div className="card shadow-sm mb-4" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom p-3">
              <h6 className="mb-0 fw-semibold">Monthly R&M Cost Trend (Last 6 Months)</h6>
            </div>
            <div className="card-body p-3" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="card shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-header bg-white border-bottom p-3 d-flex flex-wrap gap-3 align-items-center justify-content-between">
            <h6 className="mb-0 fw-semibold">Cost Records</h6>
            <div className="d-flex gap-2 flex-wrap align-items-center">
              <MdFilterList size={16} color="#6b7280" />
              <select className="form-select form-select-sm" style={{ width: 170, borderRadius: 8 }} value={tableFilters.machine_id} onChange={(e) => setTableFilters((f) => ({ ...f, machine_id: e.target.value }))}>
                <option value="">All Machines</option>
                {machines.map((m) => <option key={m.id} value={m.id}>{m.machine_id} — {m.make} {m.model}</option>)}
              </select>
              <select className="form-select form-select-sm" style={{ width: 160, borderRadius: 8 }} value={tableFilters.cost_type} onChange={(e) => setTableFilters((f) => ({ ...f, cost_type: e.target.value }))}>
                <option value="">All Types</option>
                {COST_TYPES.map((t) => <option key={t.val} value={t.val}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="card-body p-0">
            {isLoading ? (
              <div className="text-center py-5 text-muted"><div className="spinner-border spinner-border-sm me-2" />Loading…</div>
            ) : costs.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <MdBuild size={36} style={{ opacity: 0.3 }} />
                <p className="mt-2 mb-0">No cost records found.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead style={{ background: "#f8fafc" }}>
                    <tr>
                      {["Date", "Machine", "Type", "Description", "Supplier / Ref", "Amount", "Recorded By"].map((h) => (
                        <th key={h} style={{ padding: "11px 14px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {costs.map((c) => (
                      <tr key={c.id}>
                        <td style={{ padding: "10px 14px", fontSize: 13 }}>{c.cost_date ? formatDate(c.cost_date) : "—"}</td>
                        <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: "#1e40af" }}>{c.machine?.machine_id}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ background: typeColor(c.cost_type) + "22", color: typeColor(c.cost_type), fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>
                            {typeLabel(c.cost_type)}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 13 }}>{c.description}</td>
                        <td style={{ padding: "10px 14px", fontSize: 12, color: "#6b7280" }}>
                          {[c.supplier, c.invoice_ref].filter(Boolean).join(" · ") || "—"}
                        </td>
                        <td style={{ padding: "10px 14px", fontWeight: 700, fontSize: 14 }}>
                          {formatCurrency(parseFloat(c.amount))}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 12 }}>{c.recorder?.name || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddCostModal
        show={showAdd}
        onHide={() => setShowAdd(false)}
        machines={machines}
        onSuccess={() => {
          qc.invalidateQueries(["rm_costs"]);
          qc.invalidateQueries(["rm_summary"]);
        }}
      />
    </Layout>
  );
}

// ── Add Cost Modal ────────────────────────────────────────────────────────────
function AddCostModal({ show, onHide, machines, onSuccess }) {
  const [form, setForm] = useState({
    machine_id: "", cost_type: "labour", description: "", amount: "",
    supplier: "", invoice_ref: "",
    cost_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [error, setError] = useState(null);

  const { mutate, isLoading } = useMutation({
    mutationFn: (data) => baseApi.post("/api/moms/finance/repair-costs", data),
    onSuccess: () => {
      onSuccess();
      onHide();
      setForm((f) => ({ ...f, description: "", amount: "", supplier: "", invoice_ref: "" }));
      Swal.fire({ icon: "success", title: "Cost Recorded!", text: "R&M cost saved successfully.", confirmButtonColor: "#3b82f6", timer: 2000, showConfirmButton: false });
    },
    onError: (e) => {
      setError(e.response?.data?.message || "Failed to save.");
      Swal.fire({ icon: "error", title: "Failed", text: e.response?.data?.message || "Failed to save cost.", confirmButtonColor: "#3b82f6" });
    },
  });

  const set = (f) => (e) => setForm((prev) => ({ ...prev, [f]: e.target.value }));

  return (
    <Modal show={show} onHide={onHide} centered size="md">
      <Modal.Header closeButton style={{ borderBottom: "1px solid #e5e7eb" }}>
        <Modal.Title style={{ fontWeight: 700, fontSize: 16 }}>Record R&M Cost</Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4 pb-2">
        {error && <div className="alert alert-danger py-2 mb-3" style={{ fontSize: 13 }}>{error}</div>}
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Machine <span className="text-danger">*</span></label>
            <select className="form-select" style={{ borderRadius: 8, fontSize: 13 }} value={form.machine_id} onChange={set("machine_id")}>
              <option value="">Select machine…</option>
              {machines.map((m) => <option key={m.id} value={m.id}>{m.machine_id} — {m.make} {m.model}</option>)}
            </select>
          </div>
          <div className="col-6">
            <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Cost Type <span className="text-danger">*</span></label>
            <select className="form-select" style={{ borderRadius: 8, fontSize: 13 }} value={form.cost_type} onChange={set("cost_type")}>
              {COST_TYPES.map((t) => <option key={t.val} value={t.val}>{t.label}</option>)}
            </select>
          </div>
          <div className="col-6">
            <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Date <span className="text-danger">*</span></label>
            <input type="date" className="form-control" style={{ borderRadius: 8, fontSize: 13 }} value={form.cost_date} onChange={set("cost_date")} />
          </div>
          <div className="col-12">
            <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Description <span className="text-danger">*</span></label>
            <input type="text" className="form-control" style={{ borderRadius: 8, fontSize: 13 }} placeholder="e.g. Replace hydraulic hose" value={form.description} onChange={set("description")} />
          </div>
          <div className="col-6">
            <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Amount <span className="text-danger">*</span></label>
            <input type="number" min="0" step="0.01" className="form-control" style={{ borderRadius: 8, fontSize: 13 }} value={form.amount} onChange={set("amount")} placeholder="0.00" />
          </div>
          <div className="col-6">
            <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Supplier</label>
            <input type="text" className="form-control" style={{ borderRadius: 8, fontSize: 13 }} value={form.supplier} onChange={set("supplier")} placeholder="Optional" />
          </div>
          <div className="col-6">
            <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Invoice / Reference</label>
            <input type="text" className="form-control" style={{ borderRadius: 8, fontSize: 13 }} value={form.invoice_ref} onChange={set("invoice_ref")} placeholder="Optional" />
          </div>
          <div className="col-12">
            <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Notes</label>
            <textarea className="form-control" style={{ borderRadius: 8, fontSize: 13, minHeight: 60, resize: "vertical" }} value={form.notes} onChange={set("notes")} />
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer style={{ borderTop: "1px solid #e5e7eb", gap: 8 }}>
        <Button variant="outline-secondary" style={{ borderRadius: 8 }} onClick={onHide}>Cancel</Button>
        <Button
          style={{ backgroundColor: "#6366f1", borderColor: "#6366f1", borderRadius: 8, fontWeight: 600 }}
          disabled={isLoading || !form.machine_id || !form.description || !form.amount}
          onClick={() => mutate(form)}
        >
          {isLoading ? <><div className="spinner-border spinner-border-sm me-2" />Saving…</> : "Save Cost"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
} 