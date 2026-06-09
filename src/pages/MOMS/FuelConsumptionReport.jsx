import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { Button, Form } from "react-bootstrap";
import { MdArrowBack, MdLocalGasStation } from "react-icons/md";

const defaultStart = () => new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split("T")[0];
const defaultEnd   = () => new Date().toISOString().split("T")[0];

export default function FuelConsumptionReport() {
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate,   setEndDate]   = useState(defaultEnd);

  // ── Committed date range — only updates when user clicks Generate ─────────
  // Keeps the cache key stable during typing; prevents mid-type re-fetches
  const [committed, setCommitted] = useState({ start: startDate, end: endDate });

  // ── Report data — cached per date range combo ────────────────────────────
  const cacheKey = ["moms_fuel_consumption_report", committed.start, committed.end];
  const { data: reportData = [], isFetching: loading } = useQuery({
    queryKey: cacheKey,
    queryFn:  () => baseApi.get("/api/moms/fuel-consumption-report", {
      params: { startDate: committed.start, endDate: committed.end },
    }).then((r) => r.data || []),
    staleTime: 5 * 60 * 1000,
  });

  const handleGenerate = () => {
    const next = { start: startDate, end: endDate };
    setCommitted(next);
    // If key didn't change (same dates clicked again), force a fresh fetch
    queryClient.invalidateQueries({ queryKey: ["moms_fuel_consumption_report", next.start, next.end] });
  };

  const totals = reportData.reduce(
    (acc, row) => ({ total_volume: acc.total_volume + parseFloat(row.total_volume || 0), engine_hours: acc.engine_hours + parseFloat(row.engine_hours || 0) }),
    { total_volume: 0, engine_hours: 0 }
  );
  const overallEfficiency = totals.engine_hours > 0 ? (totals.total_volume / totals.engine_hours).toFixed(2) : "—";
  const getMachineName    = (row) => row.machine_name || row.machine?.name || `Machine #${row.machine_id}`;

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="row mb-4 align-items-start">
          <div className="col">
            <button className="btn btn-link p-0 mb-2 text-muted d-inline-flex align-items-center gap-1" style={{ fontSize: "14px", textDecoration: "none" }} onClick={() => navigate("/moms/fuel")}>
              <MdArrowBack size={16} /> Back to Fuel Management
            </button>
            <div className="d-flex align-items-center gap-3 mt-1">
              <div style={{ width: "48px", height: "48px", backgroundColor: "#f59e0b", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MdLocalGasStation size={24} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontWeight: "bold", fontSize: "clamp(18px, 4vw, 26px)", marginBottom: "4px" }}>Fuel Consumption Report</h1>
                <p className="text-muted mb-0" style={{ fontSize: "14px" }}>{committed.start} → {committed.end}</p>
              </div>
            </div>
          </div>
        </div>

        {reportData.length > 0 && (
          <div className="row g-3 mb-4">
            {[
              { label: "Machines Tracked", value: reportData.length,              value2: "",     bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
              { label: "Total Fuel Used",  value: totals.total_volume.toFixed(2), value2: "L",    bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
              { label: "Total Engine Hrs", value: totals.engine_hours.toFixed(2), value2: "hrs",  bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
              { label: "Avg Efficiency",   value: overallEfficiency,              value2: "L/hr", bg: "#fdf4ff", color: "#7e22ce", border: "#e9d5ff" },
            ].map((c) => (
              <div className="col-6 col-md-3" key={c.label}>
                <div className="card" style={{ borderRadius: "10px", border: `1px solid ${c.border}`, backgroundColor: c.bg }}>
                  <div className="card-body py-3 px-3">
                    <p style={{ fontSize: "12px", color: c.color, fontWeight: "600", marginBottom: "4px", textTransform: "uppercase" }}>{c.label}</p>
                    <p style={{ fontSize: "22px", fontWeight: "700", color: c.color, marginBottom: 0 }}>{c.value} <span style={{ fontSize: "13px", fontWeight: "500" }}>{c.value2}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="card shadow-sm mb-4" style={{ borderRadius: "12px" }}>
          <div className="card-body p-3">
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-4">
                <Form.Group><Form.Label style={{ fontWeight: "500" }}>Start Date</Form.Label><Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Form.Group>
              </div>
              <div className="col-12 col-md-4">
                <Form.Group><Form.Label style={{ fontWeight: "500" }}>End Date</Form.Label><Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Form.Group>
              </div>
              <div className="col-12 col-md-4">
                <Button variant="success" className="w-100" onClick={handleGenerate} disabled={loading} style={{ borderRadius: "8px", fontWeight: "500", height: "38px" }}>
                  {loading ? "Generating..." : "Generate Report"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                  <tr>
                    {["Machine","Total Volume (L)","Engine Hours","Efficiency (L/hr)"].map((h) => (
                      <th key={h} style={{ padding: "16px", fontWeight: "600", fontSize: "13px", color: "#666" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="4" className="text-center py-5"><div className="spinner-border spinner-border-sm text-warning me-2" role="status" />Generating report...</td></tr>
                  ) : reportData.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-5 text-muted">No fuel transactions found for the selected date range.</td></tr>
                  ) : (
                    <>
                      {reportData.map((row, index) => {
                        const hasHours   = parseFloat(row.engine_hours || 0) > 0;
                        const efficiency = hasHours ? (parseFloat(row.total_volume || 0) / parseFloat(row.engine_hours)).toFixed(2) : "—";
                        return (
                          <tr key={index}>
                            <td style={{ padding: "16px", fontWeight: "500" }}>{getMachineName(row)}</td>
                            <td style={{ padding: "16px" }}>{parseFloat(row.total_volume || 0).toFixed(2)} L</td>
                            <td style={{ padding: "16px" }}>{parseFloat(row.engine_hours || 0).toFixed(2)} hrs</td>
                            <td style={{ padding: "16px" }}>{hasHours ? `${parseFloat(row.efficiency || efficiency).toFixed(2)} L/hr` : "—"}</td>
                          </tr>
                        );
                      })}
                      <tr style={{ backgroundColor: "#f8fafc", fontWeight: "700", borderTop: "2px solid #e5e7eb" }}>
                        <td style={{ padding: "16px" }}>TOTAL</td>
                        <td style={{ padding: "16px" }}>{totals.total_volume.toFixed(2)} L</td>
                        <td style={{ padding: "16px" }}>{totals.engine_hours.toFixed(2)} hrs</td>
                        <td style={{ padding: "16px" }}>{overallEfficiency !== "—" ? `${overallEfficiency} L/hr` : "—"}</td>
                      </tr>
                    </>
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