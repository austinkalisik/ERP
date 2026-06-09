import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
  ComposedChart, Area,
} from "recharts";
import {
  MdPrecisionManufacturing, MdWarning, MdCheckCircle,
  MdBuild, MdFilterList, MdRefresh,
} from "react-icons/md";

const fetchReport = (params) =>
  baseApi.get("/api/moms/reports/availability", { params }).then((r) => r.data);

const availColor = (pct) => {
  if (pct >= 85) return "#16a34a";
  if (pct >= 60) return "#f59e0b";
  return "#dc2626";
};

export default function MachineAvailabilityReport() {
  const [filters, setFilters] = useState({
    from: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
    to:   new Date().toISOString().split("T")[0],
    machine_id: "",
  });
  const [applied, setApplied] = useState(filters);

  const { data, isLoading, refetch } = useQuery({
    queryKey:  ["moms_availability_report", applied],
    queryFn:   () => fetchReport(applied),
    staleTime: 5 * 60 * 1000,
  });

  const summary   = data?.summary    || {};
  const machines  = data?.machines   || [];
  const problematic = data?.problematic || [];
  const daily     = data?.daily_trend || [];
  const period    = data?.period     || {};

  // Downtime bar chart data
  const downtimeChart = useMemo(() =>
    problematic.slice(0, 8).map((m) => ({
      name:      m.machine_id,
      Unplanned: parseFloat(m.unplanned_hours.toFixed(1)),
      Planned:   parseFloat(m.planned_hours.toFixed(1)),
    })), [problematic]);

  // Failure count bar chart
  const failureChart = useMemo(() =>
    [...problematic]
      .filter((m) => m.failure_count > 0)
      .sort((a, b) => b.failure_count - a.failure_count)
      .slice(0, 8)
      .map((m) => ({ name: m.machine_id, failures: m.failure_count })),
    [problematic]);

  return (
    <Layout>
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h1 style={{ fontWeight: "bold", fontSize: "clamp(18px, 4vw, 26px)", marginBottom: 2 }}>
            Machine Availability & Failure Report
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>
            {period.from && `${period.from} → ${period.to}`}
          </p>
        </div>
        <button className="btn btn-outline-secondary d-flex align-items-center gap-2" style={{ borderRadius: 8, fontSize: 13 }} onClick={() => refetch()}>
          <MdRefresh size={16} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card shadow-sm mb-4" style={{ borderRadius: 12 }}>
        <div className="card-body p-3 d-flex flex-wrap gap-3 align-items-end">
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>FROM</label>
            <input type="date" className="form-control form-control-sm" style={{ borderRadius: 8, width: 160 }} value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 4 }}>TO</label>
            <input type="date" className="form-control form-control-sm" style={{ borderRadius: 8, width: 160 }} value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ borderRadius: 8, fontWeight: 600, height: 32 }}
            onClick={() => setApplied(filters)}
          >
            Apply
          </button>
        </div>
      </div>

      {/* Summary KPI tiles — mirrors report header */}
      <div className="row g-3 mb-4">
        {[
          { label: "Avg Availability",   value: `${summary.avg_availability ?? 0}%`,  color: availColor(summary.avg_availability ?? 0), icon: <MdCheckCircle size={22} color="#fff" /> },
          { label: "Machines Online",    value: summary.online ?? 0,                   color: "#16a34a", icon: <MdPrecisionManufacturing size={22} color="#fff" /> },
          { label: "Offline (Unplanned)",value: summary.offline_unplanned ?? 0,        color: "#dc2626", icon: <MdWarning size={22} color="#fff" /> },
          { label: "Offline (Planned)",  value: summary.offline_planned ?? 0,          color: "#f59e0b", icon: <MdBuild size={22} color="#fff" /> },
          { label: "Total Failures",     value: summary.total_failures ?? 0,           color: "#6366f1", icon: <MdWarning size={22} color="#fff" /> },
          { label: "Unplanned Downtime", value: `${summary.total_unplanned ?? 0} hrs`, color: "#ef4444", icon: null },
          { label: "Planned Downtime",   value: `${summary.total_planned ?? 0} hrs`,   color: "#3b82f6", icon: null },
        ].map((c) => (
          <div key={c.label} className="col-6 col-md-3 col-lg-2">
            <div className="card shadow-sm" style={{ borderRadius: 12, borderTop: `3px solid ${c.color}` }}>
              <div className="card-body p-3">
                <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontSize: 22, fontWeight: "bold", color: c.color }}>{c.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1: Downtime + Failures */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom p-3">
              <h6 className="mb-0 fw-semibold">Unplanned vs Planned Downtime (hrs) — Top Assets</h6>
            </div>
            <div className="card-body p-3" style={{ height: 280 }}>
              {downtimeChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={downtimeChart} margin={{ left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} label={{ value: "Hours", angle: -90, position: "insideLeft", fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Unplanned" fill="#dc2626" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Planned"   fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="d-flex h-100 align-items-center justify-content-center text-muted">No downtime data</div>
              )}
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom p-3">
              <h6 className="mb-0 fw-semibold">Failure Count by Asset</h6>
            </div>
            <div className="card-body p-3" style={{ height: 280 }}>
              {failureChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={failureChart} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip />
                    <Bar dataKey="failures" fill="#f59e0b" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="d-flex h-100 align-items-center justify-content-center text-muted">No failures recorded</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Availability over time */}
      {daily.length > 1 && (
        <div className="card shadow-sm mb-4" style={{ borderRadius: 12 }}>
          <div className="card-header bg-white border-bottom p-3">
            <h6 className="mb-0 fw-semibold">Fleet Availability Over Time (%)</h6>
          </div>
          <div className="card-body p-3" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={daily} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v, n) => n === "availability" ? `${v}%` : `${v} hrs`} />
                <Legend />
                <Area type="monotone" dataKey="availability" fill="#dbeafe" stroke="#3b82f6" strokeWidth={2} name="Availability %" />
                <Bar dataKey="downtime" fill="#fca5a5" name="Downtime hrs" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* MTBF / MTTR summary */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom p-3">
              <h6 className="mb-0 fw-semibold">MTBF & MTTR by Asset (hrs)</h6>
            </div>
            <div className="card-body p-3" style={{ height: 260 }}>
              {(() => {
                const mtbfData = machines
                  .filter((m) => m.mtbf !== null || m.mttr !== null)
                  .map((m) => ({ name: m.machine_id, MTBF: m.mtbf ?? 0, MTTR: m.mttr ?? 0 }));
                return mtbfData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mtbfData} margin={{ left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="MTBF" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="MTTR" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="d-flex h-100 align-items-center justify-content-center text-muted">No MTBF/MTTR data</div>;
              })()}
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card shadow-sm" style={{ borderRadius: 12 }}>
            <div className="card-header bg-white border-bottom p-3">
              <h6 className="mb-0 fw-semibold">Labour & Parts Cost by Asset (PGK)</h6>
            </div>
            <div className="card-body p-3" style={{ height: 260 }}>
              {(() => {
                const costData = machines
                  .filter((m) => m.labor_parts_cost > 0)
                  .sort((a, b) => b.labor_parts_cost - a.labor_parts_cost)
                  .slice(0, 8)
                  .map((m) => ({ name: m.machine_id, cost: m.labor_parts_cost }));
                return costData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costData} margin={{ left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => `PGK ${v.toLocaleString()}`} />
                      <Bar dataKey="cost" fill="#10b981" radius={[3, 3, 0, 0]} name="Cost" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="d-flex h-100 align-items-center justify-content-center text-muted">No cost data for period</div>;
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed table — mirrors the PDF "Most Problematic Assets" table */}
      <div className="card shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-header bg-white border-bottom p-3">
          <h6 className="mb-0 fw-semibold">Asset Availability Detail</h6>
        </div>
        <div className="card-body p-0">
          {isLoading ? (
            <div className="text-center py-5 text-muted">
              <div className="spinner-border spinner-border-sm me-2" />Loading report…
            </div>
          ) : machines.length === 0 ? (
            <div className="text-center py-5 text-muted">No machine data found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: 13 }}>
                <thead style={{ background: "#f8fafc" }}>
                  <tr>
                    {["Asset", "Category", "Location", "Availability", "Unplanned DT", "Planned DT", "Failures", "MTBF", "MTTR", "Labour & Parts Cost"].map((h) => (
                      <th key={h} style={{ padding: "11px 14px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...machines].sort((a, b) => a.availability_pct - b.availability_pct).map((m) => (
                    <tr key={m.id}>
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: "#1e40af" }}>
                        <div>{m.machine_id}</div>
                        <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 400 }}>{m.make} {m.model}</div>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 12 }}>{m.category}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#6b7280" }}>{m.location}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <div className="d-flex align-items-center gap-2">
                          <div style={{ width: 56, height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden", flexShrink: 0 }}>
                            <div style={{ width: `${m.availability_pct}%`, height: "100%", background: availColor(m.availability_pct), borderRadius: 3 }} />
                          </div>
                          <span style={{ fontWeight: 700, color: availColor(m.availability_pct) }}>{m.availability_pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", color: m.unplanned_hours > 0 ? "#dc2626" : "#6b7280", fontWeight: m.unplanned_hours > 0 ? 700 : 400 }}>
                        {m.unplanned_hours > 0 ? `${m.unplanned_hours} hrs` : "—"}
                      </td>
                      <td style={{ padding: "10px 14px", color: "#6b7280" }}>
                        {m.planned_hours > 0 ? `${m.planned_hours} hrs` : "—"}
                      </td>
                      <td style={{ padding: "10px 14px", fontWeight: m.failure_count > 0 ? 700 : 400, color: m.failure_count > 0 ? "#dc2626" : "#6b7280" }}>
                        {m.failure_count}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 12 }}>
                        {m.mtbf !== null ? `${m.mtbf} hrs` : "—"}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 12 }}>
                        {m.mttr !== null ? `${m.mttr} hrs` : "—"}
                      </td>
                      <td style={{ padding: "10px 14px", fontWeight: m.labor_parts_cost > 0 ? 600 : 400 }}>
                        {m.labor_parts_cost > 0
                          ? `PGK ${m.labor_parts_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          : "PGK 0.00"
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}