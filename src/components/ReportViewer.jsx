import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MdClose, MdRefresh, MdFileDownload } from "react-icons/md";
import baseApi from "../api/baseApi";
import SOAExpandableTable from "./SOAExpandableTable";

export default function ReportViewer({ report, filters, onClose }) {
  const queryClient = useQueryClient();
  const cacheKey = [
    "report_view",
    report?.type,
    filters?.dateRange,
    filters?.startDate,
    filters?.endDate,
    filters?.status,
    filters?.machine,
    filters?.search,
  ];

  const { data: reportData, isLoading: loading, error: queryError } = useQuery({
    queryKey: cacheKey,
    queryFn:  async () => {
      const response = await baseApi.post("/api/reports/view", {
        report_type: report.type,
        date_range:  filters.dateRange || "month",
        start_date:  filters.startDate,
        end_date:    filters.endDate,
        filters: {
          status:  filters.status,
          machine: filters.machine,
          search:  filters.search,
        },
      });

      if (!response.data.success) throw new Error("Failed to load report data");

      return {
        data:          response.data.data          || [],
        total_records: response.data.total_records || 0,
      };
    },
    staleTime: 2 * 60 * 1000,
    retry:     1,
    enabled:   !!report?.type,
  });

  const error = queryError?.response?.data?.message || queryError?.message || null;

  // ── Manual refresh — invalidates this specific cache entry ───────────────
  const handleRefresh = () => queryClient.invalidateQueries({ queryKey: cacheKey });

  const handleExport = async (format) => {
    try {
      const response = await baseApi.post("/api/reports/export", {
        report_type: report.type,
        format,
        data:  reportData?.data || [],
        title: report.title,
      }, { responseType: "blob" });

      const url      = window.URL.createObjectURL(new Blob([response.data]));
      const link     = document.createElement("a");
      link.href      = url;
      link.setAttribute("download", `${report.title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.${format === "csv" ? "csv" : "pdf"}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      alert(`Report exported as ${format.toUpperCase()} successfully!`);
    } catch (err) {
      console.error("Error exporting report:", err);
      alert("Failed to export report");
    }
  };

  const getColumnHeaders = () => {
    if (!reportData?.data?.length) return [];
    return Object.keys(reportData.data[0]).map((key) => ({
      key,
      label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    }));
  };

  const columns = getColumnHeaders();

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "12px", width: "100%", maxWidth: "1200px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>

        {/* Header */}
        <div style={{ padding: "24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600, color: "#1a202c" }}>{report.title}</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#718096" }}>{reportData?.total_records || 0} records found</p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button onClick={handleRefresh} disabled={loading}
              style={{ padding: "8px 16px", background: "#f7fafc", border: "1px solid #e2e8f0", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#4a5568" }}>
              <MdRefresh size={18} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
              Refresh
            </button>
            <button onClick={onClose} style={{ padding: "8px", background: "transparent", border: "none", cursor: "pointer", color: "#718096", display: "flex", alignItems: "center" }}>
              <MdClose size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "24px", flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", color: "#718096" }}>
              <div style={{ width: "50px", height: "50px", border: "4px solid #e2e8f0", borderTop: "4px solid #667eea", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "20px" }} />
              <p>Loading report data...</p>
            </div>
          ) : error ? (
            <div style={{ padding: "60px", textAlign: "center", color: "#f56565" }}>
              <p style={{ fontSize: "16px", marginBottom: "8px" }}>{error}</p>
              <button onClick={handleRefresh} style={{ padding: "10px 20px", background: "#667eea", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", marginTop: "16px" }}>
                Try Again
              </button>
            </div>
          ) : reportData?.data?.length > 0 ? (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                {report.type === "soa_by_supplier_report" ? (
                  <SOAExpandableTable transactions={reportData.data} />
                ) : (

                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead style={{ background: "#f7fafc", position: "sticky", top: 0 }}>
                    <tr>
                      {columns.map((col) => (
                        <th key={col.key} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: "12px", color: "#4a5568", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" }}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    { reportData.data.map((row, idx) =>(
                      <tr key={idx} style={{ borderBottom: "1px solid #f0f0f0", transition: "background 0.2s" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#f7fafc"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        {columns.map((col) => (
                          <td key={col.key} style={{ padding: "12px 16px", color: "#2d3748", whiteSpace: "nowrap" }}>
                            {row[col.key] !== null && row[col.key] !== undefined ? String(row[col.key]) : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
)}
              </div>
            </div>
          ) : (
            <div style={{ padding: "60px", textAlign: "center", color: "#a0aec0" }}>
              <p style={{ fontSize: "16px" }}>No data available for this report</p>
              <p style={{ fontSize: "14px", marginTop: "8px" }}>Try adjusting the filters or date range</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          {["csv", "pdf"].map((fmt) => (
            <button key={fmt} onClick={() => handleExport(fmt)}
              disabled={!reportData?.data?.length}
              style={{ padding: "10px 20px", background: fmt === "pdf" ? "#667eea" : "#fff", color: fmt === "pdf" ? "#fff" : "#10b981", border: fmt === "pdf" ? "none" : "1px solid #10b981", borderRadius: "6px", fontSize: "14px", fontWeight: 500, cursor: !reportData?.data?.length ? "not-allowed" : "pointer", opacity: !reportData?.data?.length ? 0.5 : 1, display: "flex", alignItems: "center", gap: "8px" }}>
              <MdFileDownload size={18} />
              Export {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}