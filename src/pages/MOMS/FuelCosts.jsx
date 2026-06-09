import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";
import { useSettings } from "../../contexts/SettingsContext";
import { MdAttachMoney, MdRefresh, MdFileDownload, MdCalendarToday } from "react-icons/md";

const defaultStart = () => new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 10);
const defaultEnd   = () => new Date().toISOString().slice(0, 10);

export default function FuelCosts() {
  const { formatCurrency, settings } = useSettings();
  const queryClient = useQueryClient();
  const currency    = settings.currency || "PGK";

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate,   setEndDate]   = useState(defaultEnd);

  // ── Committed dates — only update on Refresh click ───────────────────────
  const [committed, setCommitted] = useState({ start: startDate, end: endDate });

  // ── Fuel costs — cached per date range combo ─────────────────────────────
  // onError removed (deprecated in RQ v5) — error handled via queryFn .catch
  const cacheKey = ["moms_fuel_costs", committed.start, committed.end];
  const { data, isFetching: loading } = useQuery({
    queryKey: cacheKey,
    queryFn:  () =>
      baseApi.get("/api/moms/finance/fuel-costs", {
        params: { start_date: committed.start, end_date: committed.end },
      })
      .then((r) => r.data)
      .catch(() => {
        Swal.fire({ icon: "error", title: "Error", text: "Failed to load fuel costs data.", confirmButtonColor: "#f97316" });
        return null;
      }),
    staleTime: 5 * 60 * 1000,
  });

  const transactions = data?.transactions || [];
  const totalVolume  = data?.totalVolume  || 0;
  const totalCost    = data?.totalCost    || 0;

  const handleRefresh = () => {
    const next = { start: startDate, end: endDate };
    setCommitted(next);
    queryClient.invalidateQueries({ queryKey: ["moms_fuel_costs", next.start, next.end] });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      let datePart;
      if (dateString.includes("T"))      datePart = dateString.split("T")[0];
      else if (dateString.includes(" ")) datePart = dateString.split(" ")[0];
      else                               datePart = dateString;
      const [year, month, day] = datePart.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch { return "Invalid Date"; }
  };

  const handleExport = () => {
    if (transactions.length === 0) {
      Swal.fire({ icon: "warning", title: "No Data", text: "No transactions to export.", confirmButtonColor: "#f97316" });
      return;
    }
    Swal.fire({
      title: "Export Fuel Costs", text: "Choose export format:", icon: "question",
      showCancelButton: true, showDenyButton: true,
      confirmButtonText: "📊 Export CSV", denyButtonText: "📄 Export PDF", cancelButtonText: "Cancel",
      confirmButtonColor: "#10b981", denyButtonColor: "#3b82f6",
    }).then((result) => {
      if (result.isConfirmed) handleExportCSV();
      else if (result.isDenied) handleExportPDF();
    });
  };

  const handleExportCSV = () => {
    const headers = ["Date", `Total Volume (L)`, `Total Cost (${currency})`];
    const rows    = transactions.map((t) => [
      formatDate(t.date),
      t.volume ? parseFloat(t.volume).toFixed(2) : "0.00",
      t.cost   ? parseFloat(t.cost).toFixed(2)   : "0.00",
    ]);
    rows.push(["TOTAL", totalVolume.toFixed(2), totalCost.toFixed(2)]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob       = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link       = document.createElement("a");
    const url        = URL.createObjectURL(blob);
    const filename   = `fuel_costs_${committed.start}_to_${committed.end}.csv`;
    link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = "hidden";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    Swal.fire({ icon: "success", title: "Exported!", text: `Downloaded as ${filename}`, confirmButtonColor: "#10b981", timer: 2000, showConfirmButton: false });
  };

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    const htmlContent = `<!DOCTYPE html><html><head><title>Fuel Costs Report</title><meta charset="UTF-8" />
      <style>* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: 'Segoe UI', sans-serif; background: #fff; color: #1a202c; }
      .header { background: #1a202c; padding: 36px 48px; } .report-title { font-size: 26px; font-weight: 700; color: #fff; } .report-subtitle { font-size: 13px; color: #a0aec0; margin-top: 4px; }
      .header-meta { text-align: right; } .meta-label { font-size: 11px; font-weight: 600; color: #718096; letter-spacing: 1px; text-transform: uppercase; } .meta-value { font-size: 13px; color: #e2e8f0; margin-top: 2px; }
      .summary-row { display: flex; background: #f7fafc; border-bottom: 1px solid #e2e8f0; } .summary-item { flex: 1; padding: 24px 32px; border-right: 1px solid #e2e8f0; } .summary-item:last-child { border-right: none; }
      .summary-label { font-size: 11px; font-weight: 600; color: #718096; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; } .summary-value { font-size: 28px; font-weight: 700; color: #1a202c; }
      .table-section { padding: 0 48px 48px; } .section-title { font-size: 11px; font-weight: 700; color: #718096; letter-spacing: 1.5px; text-transform: uppercase; padding: 24px 0 12px; border-bottom: 1px solid #e2e8f0; margin-bottom: 0; }
      table { width: 100%; border-collapse: collapse; } thead tr { background: #f7fafc; } th { padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #4a5568; letter-spacing: 1px; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
      td { padding: 14px 16px; font-size: 14px; color: #2d3748; border-bottom: 1px solid #edf2f7; } tr:last-child td { border-bottom: none; }
      .volume-cell { color: #2b6cb0; font-weight: 600; } .cost-cell { color: #276749; font-weight: 700; }
      .total-row td { background: #1a202c !important; color: #fff !important; font-weight: 700; font-size: 14px; padding: 16px; } .total-row .volume-cell { color: #90cdf4 !important; } .total-row .cost-cell { color: #9ae6b4 !important; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }</style></head><body>
      <div class="header"><div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div><p class="report-title">Fuel Costs Report</p><p class="report-subtitle">Daily fuel expenditure and volume</p></div>
        <div class="header-meta"><p class="meta-label">Period</p><p class="meta-value">${formatDate(committed.start)} — ${formatDate(committed.end)}</p></div>
      </div></div>
      <div class="summary-row">
        <div class="summary-item"><p class="summary-label">Total Volume</p><p class="summary-value">${totalVolume.toFixed(2)} <span style="font-size:16px;font-weight:400;color:#718096;">L</span></p></div>
        <div class="summary-item"><p class="summary-label">Total Cost (${currency})</p><p class="summary-value">${totalCost.toFixed(2)}</p></div>
        <div class="summary-item"><p class="summary-label">Records</p><p class="summary-value">${transactions.length}</p></div>
      </div>
      <div class="table-section"><p class="section-title">Transaction Breakdown</p>
        <table><thead><tr><th>Date</th><th>Total Volume</th><th>Total Cost (${currency})</th></tr></thead>
        <tbody>
          ${transactions.map((t) => `<tr><td>${formatDate(t.date)}</td><td class="volume-cell">${t.volume ? parseFloat(t.volume).toFixed(2) + " L" : "—"}</td><td class="cost-cell">${t.cost ? parseFloat(t.cost).toFixed(2) : "—"}</td></tr>`).join("")}
          <tr class="total-row"><td>TOTAL</td><td class="volume-cell">${totalVolume.toFixed(2)} L</td><td class="cost-cell">${totalCost.toFixed(2)}</td></tr>
        </tbody></table>
      </div>
      <script>window.onload = function() { setTimeout(function() { window.print(); }, 300); };</script>
      </body></html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
  };

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="row mb-3 mb-md-4 align-items-center">
          <div className="col">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <MdAttachMoney size={32} color="#10b981" />
              <div>
                <h1 style={{ fontWeight: "bold", fontSize: "clamp(20px, 5vw, 28px)", margin: 0 }}>Fuel Costs Overview</h1>
                <p className="text-muted mb-0" style={{ fontSize: "14px" }}>Track daily fuel expenditure and volume</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm mb-4" style={{ borderRadius: "12px" }}>
          <div className="card-body p-3">
            <div className="row align-items-end g-3">
              <div className="col-auto">
                <label style={{ fontSize: "13px", fontWeight: "500", color: "#64748b", marginBottom: "6px", display: "block" }}>Start Date</label>
                <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ height: "42px", borderRadius: "8px", fontSize: "14px" }} />
              </div>
              <div className="col-auto">
                <label style={{ fontSize: "13px", fontWeight: "500", color: "#64748b", marginBottom: "6px", display: "block" }}>End Date</label>
                <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ height: "42px", borderRadius: "8px", fontSize: "14px" }} />
              </div>
              <div className="col-auto">
                <button className="btn btn-primary" style={{ height: "42px", borderRadius: "8px", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }} onClick={handleRefresh} disabled={loading}>
                  <MdRefresh size={18} />{loading ? "Loading..." : "Refresh"}
                </button>
              </div>
              <div className="col-auto ms-auto">
                <button className="btn btn-success" style={{ height: "42px", borderRadius: "8px", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }} onClick={handleExport} disabled={loading || transactions.length === 0}>
                  <MdFileDownload size={18} />Export
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-12 col-md-6">
            <div className="card shadow-sm" style={{ borderRadius: "12px", background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", color: "white", border: "none" }}>
              <div className="card-body p-3">
                <p className="mb-1" style={{ fontSize: "13px", opacity: 0.9, fontWeight: "500" }}>Total Volume</p>
                <h2 className="mb-0" style={{ fontWeight: "bold", fontSize: "32px" }}>{totalVolume.toFixed(2)} L</h2>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className="card shadow-sm" style={{ borderRadius: "12px", background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)", color: "white", border: "none" }}>
              <div className="card-body p-3">
                <p className="mb-1" style={{ fontSize: "13px", opacity: 0.9, fontWeight: "500" }}>Total Cost</p>
                <h2 className="mb-0" style={{ fontWeight: "bold", fontSize: "32px" }}>{formatCurrency(totalCost)}</h2>
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
                    <th style={{ padding: "16px", fontWeight: "600", fontSize: "13px", color: "#666" }}>DATE</th>
                    <th style={{ padding: "16px", fontWeight: "600", fontSize: "13px", color: "#666" }}>TOTAL VOLUME (L)</th>
                    <th style={{ padding: "16px", fontWeight: "600", fontSize: "13px", color: "#666" }}>TOTAL COST</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="3" className="text-center py-4"><div className="spinner-border spinner-border-sm text-secondary me-2" />Loading...</td></tr>
                  ) : transactions.length === 0 ? (
                    <tr><td colSpan="3" className="text-center py-5"><MdCalendarToday size={48} color="#cbd5e1" /><p className="text-muted mb-0 mt-2">No fuel transactions found for the selected period.</p></td></tr>
                  ) : (
                    <>
                      {transactions.map((transaction, index) => (
                        <tr key={index}>
                          <td style={{ padding: "16px", fontWeight: "500" }}>{formatDate(transaction.date)}</td>
                          <td style={{ padding: "16px" }}>{transaction.volume ? `${parseFloat(transaction.volume).toFixed(2)} L` : "—"}</td>
                          <td style={{ padding: "16px", fontWeight: "600", color: "#059669" }}>{transaction.cost ? formatCurrency(transaction.cost) : "—"}</td>
                        </tr>
                      ))}
                      <tr style={{ backgroundColor: "#f8fafc", fontWeight: "600", borderTop: "2px solid #e5e7eb" }}>
                        <td style={{ padding: "16px", fontSize: "15px" }}>Total</td>
                        <td style={{ padding: "16px", fontSize: "15px" }}>{totalVolume > 0 ? `${totalVolume.toFixed(2)} L` : "—"}</td>
                        <td style={{ padding: "16px", fontSize: "15px", color: "#059669" }}>{formatCurrency(totalCost)}</td>
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