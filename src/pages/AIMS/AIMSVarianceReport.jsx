import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts";
import { MdCheckCircle, MdTrendingUp, MdTrendingDown, MdWarning, MdAssessment } from "react-icons/md";
import Swal from "sweetalert2";

const fetchReport = (id) =>
  baseApi.get(`/api/aims/stocktake/${id}/variance-report`).then((r) => r.data);

const fmtQty = (val) => {
  if (val === null || val === undefined) return "—";
  const n = parseFloat(val);
  return isNaN(n) ? "—" : Number.isInteger(n) ? n : parseFloat(n.toFixed(2));
};

export default function AIMSVarianceReport() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["aims_variance_report", id],
    queryFn:  () => fetchReport(id),
    staleTime: 2 * 60 * 1000,
  });

  const approveMutation = useMutation({
    mutationFn: () => baseApi.post(`/api/aims/stocktake/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aims_variance_report", id] });
      queryClient.invalidateQueries({ queryKey: ["aims_stocktake"] });
      Swal.fire({ icon: "success", title: "Approved!", text: "Inventory adjusted based on count results.", confirmButtonColor: "#3b82f6", timer: 2000, showConfirmButton: false });
    },
    onError: (err) => {
      Swal.fire({ icon: "error", title: "Approval Failed", text: err.response?.data?.message || "Failed to approve.", confirmButtonColor: "#3b82f6" });
    },
  });

  const handleApprove = () => {
    Swal.fire({
      title: "Approve & Adjust Inventory?",
      text: "This updates stock quantities based on variance results. Cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, approve it",
    }).then((r) => { if (r.isConfirmed) approveMutation.mutate(); });
  };

  if (isLoading) {
    return <Layout><div className="text-center py-5 text-muted">Loading variance report…</div></Layout>;
  }

  const { session, summary, lines } = data || {};
  const variantLines = (lines || []).filter((l) => l.variance !== 0);
  const isApproved   = !!session?.approved_by;
  const canApprove   = session?.status === "completed" && !isApproved;

  const chartData = (lines || [])
    .filter((l) => l.variance !== 0)
    .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
    .slice(0, 10)
    .map((l) => ({
      name:     l.item_code || l.item_name?.split(" ")[0] || "—",
      variance: l.variance,
      fill:     l.variance > 0 ? "#16a34a" : "#dc2626",
    }));

  const pieData = [
    { name: "Over",    value: summary?.over    || 0, fill: "#16a34a" },
    { name: "Under",   value: summary?.under   || 0, fill: "#dc2626" },
    { name: "Matched", value: summary?.matched || 0, fill: "#3b82f6" },
  ].filter((d) => d.value > 0);

  const KPI_CARDS = [
    { label: "Total Items",   value: summary?.total     || 0, color: "#3b82f6" },
    { label: "Over Stock",    value: summary?.over      || 0, color: "#16a34a", icon: <MdTrendingUp size={18} /> },
    { label: "Under Stock",   value: summary?.under     || 0, color: "#dc2626", icon: <MdTrendingDown size={18} /> },
    { label: "Matched",       value: summary?.matched   || 0, color: "#10b981", icon: <MdCheckCircle size={18} /> },
    { label: "Uncounted",     value: summary?.uncounted || 0, color: "#f59e0b", icon: <MdWarning size={18} /> },
  ];

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">

        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
          <div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h1 style={{ fontWeight: "700", fontSize: "clamp(18px,5vw,24px)", marginBottom: 0 }}>
                Variance Report
              </h1>
              <span style={{ color: "#3b82f6", fontWeight: "700", fontSize: "20px" }}>
                — {session?.reference}
              </span>
            </div>
            <p className="text-muted mb-0 mt-1" style={{ fontSize: "13px" }}>
              {session?.count_date}
              {session?.type && <span> · {session.type === "full" ? "Full Count" : "Cyclic Count"}</span>}
              {session?.location && <span> · 📍 {session.location}</span>}
            </p>
          </div>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            {isApproved && (
              <span style={{
                backgroundColor: "#d1fae5", color: "#065f46",
                padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600"
              }}>
                ✓ Approved by {session.approved_by} · {session.approved_at}
              </span>
            )}
            {canApprove && (
              <button
                className="btn btn-success d-flex align-items-center gap-2"
                style={{ borderRadius: "8px", fontWeight: "600", fontSize: "13px" }}
                onClick={handleApprove}
                disabled={approveMutation.isLoading}
              >
                <MdCheckCircle size={16} />
                {approveMutation.isLoading ? "Approving…" : "Approve & Adjust Inventory"}
              </button>
            )}
            <button
              className="btn btn-outline-secondary"
              style={{ borderRadius: "8px", fontSize: "13px" }}
              onClick={() => navigate(`/aims/stocktake/${id}`)}
            >
              Back to Count
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="row g-3 mb-4">
          {KPI_CARDS.map((c) => (
            <div key={c.label} className="col-6 col-md-4 col-lg">
              <div className="card shadow-sm" style={{ borderRadius: "12px", borderTop: `3px solid ${c.color}` }}>
                <div className="card-body p-3">
                  <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", marginBottom: "4px" }}>
                    {c.label}
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: "800", color: c.color }}>
                    {c.value}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        {chartData.length > 0 && (
          <div className="row g-3 mb-4">
            <div className="col-12 col-lg-8">
              <div className="card shadow-sm" style={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                <div className="card-header" style={{ background: "#2c3e50", color: "#fff", borderRadius: "12px 12px 0 0", padding: "13px 16px" }}>
                  <h6 className="mb-0" style={{ fontWeight: "600", fontSize: "13px" }}>
                    <MdAssessment size={16} className="me-1" />
                    Top Variances by Item
                  </h6>
                </div>
                <div className="card-body p-3" style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ left: -10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => [v > 0 ? `+${v}` : v, "Variance"]} />
                      <Bar dataKey="variance" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-4">
              <div className="card shadow-sm" style={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                <div className="card-header" style={{ background: "#2c3e50", color: "#fff", borderRadius: "12px 12px 0 0", padding: "13px 16px" }}>
                  <h6 className="mb-0" style={{ fontWeight: "600", fontSize: "13px" }}>Variance Breakdown</h6>
                </div>
                <div className="card-body p-3" style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData} dataKey="value" cx="50%" cy="42%" outerRadius={90}
                        label={({ name, value }) => `${name}: ${value}`} labelLine={false}
                      >
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Variance Table */}
        <div className="card shadow-sm" style={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}>
          <div className="card-header" style={{ background: "#2c3e50", color: "#fff", borderRadius: "12px 12px 0 0", padding: "13px 16px" }}>
            <h6 className="mb-0" style={{ fontWeight: "600", fontSize: "13px" }}>
              {variantLines.length > 0
                ? `Items with Variances (${variantLines.length})`
                : "No Variances Detected"}
            </h6>
          </div>
          <div className="card-body p-0">
            {variantLines.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <MdCheckCircle size={40} color="#10b981" style={{ display: "block", margin: "0 auto 8px" }} />
                All counts match system quantities. No adjustments needed.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0" style={{ fontSize: "13px" }}>
                  <thead style={{ backgroundColor: "#f8fafc" }}>
                    <tr>
                      {["SKU", "Item Name", "Category", "Unit", "System Qty", "Counted", "Variance", "Variance %", "Reason", "Counted By"].map((h) => (
                        <th key={h} style={{ padding: "12px 14px", fontWeight: "600", fontSize: "12px", color: "#374151", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {variantLines.map((line) => (
                      <tr key={line.id} style={{ verticalAlign: "middle" }}>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ color: "#3b82f6", fontWeight: "600", fontFamily: "monospace" }}>
                            {line.item_code || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", fontWeight: "500" }}>{line.item_name}</td>
                        <td style={{ padding: "12px 14px" }}>
                          {line.category && line.category !== "—"
                            ? <span style={{ background: "#f3f4f6", color: "#374151", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>{line.category}</span>
                            : <span style={{ color: "#d1d5db" }}>—</span>}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#6b7280" }}>{line.unit || "—"}</td>
                        <td style={{ padding: "12px 14px", fontWeight: "600" }}>{fmtQty(line.system_qty)}</td>
                        <td style={{ padding: "12px 14px", fontWeight: "600" }}>{fmtQty(line.counted_qty)}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{
                            fontWeight: "800", fontSize: "13px",
                            color: line.variance > 0 ? "#16a34a" : "#dc2626"
                          }}>
                            {line.variance > 0 ? "+" : ""}{fmtQty(line.variance)}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: "12px", color: line.variance > 0 ? "#16a34a" : "#dc2626", fontWeight: "600" }}>
                          {line.variance_pct !== null && line.variance_pct !== undefined
                            ? `${line.variance_pct > 0 ? "+" : ""}${line.variance_pct}%`
                            : "—"}
                        </td>
                        <td style={{ padding: "12px 14px", maxWidth: 200 }}>
                          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "12px", color: "#6b7280" }}>
                            {line.variance_reason || <span style={{ color: "#d1d5db" }}>—</span>}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", fontSize: "12px", color: "#374151" }}>
                          {line.counted_by || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}