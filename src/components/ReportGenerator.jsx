import { useState } from "react";
import { MdClose, MdFileDownload } from "react-icons/md";
import baseApi from "../api/baseApi";

export default function ReportGenerator({ report, filters, onClose }) {
  const [generating, setGenerating] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("csv");
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: "",
  });

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Step 1: Generate report data
      const reportFilters = {
        report_type: report.type,
        date_range: filters.dateRange || 'month',
        start_date: customDateRange.start || undefined,
        end_date: customDateRange.end || undefined,
        filters: {
          status: filters.status,
          category: filters.machine,
        },
      };

      console.log('Generating report with filters:', reportFilters);

      const generateResponse = await baseApi.post('/api/reports/generate', reportFilters);

      if (!generateResponse.data.success) {
        throw new Error(generateResponse.data.message || 'Failed to generate report');
      }

      const reportData = generateResponse.data.report;

      console.log('Report generated, now exporting...', reportData);

      // Step 2: Export to selected format
      const exportResponse = await baseApi.post('/api/reports/export', {
        report_type: report.type,
        format: selectedFormat,
        data: reportData.data,
        title: report.title,
      }, {
        responseType: 'blob'
      });

      // Step 3: Download file
      const url = window.URL.createObjectURL(new Blob([exportResponse.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileExtension = selectedFormat === 'csv' ? 'csv' : 'pdf';
      const filename = `${report.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert('Report exported successfully!');
      onClose();
    } catch (error) {
      console.error("Generation failed:", error);
      alert(error.response?.data?.message || error.message || "Failed to generate report. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const showCustomDateRange = filters.dateRange === 'custom' || filters.dateRange === '';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 1000,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "#fff",
          borderRadius: "12px",
          width: "90%",
          maxWidth: "500px",
          zIndex: 1001,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <MdFileDownload size={24} style={{ color: "#667eea" }} />
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
                Generate Report
              </h2>
              <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#718096" }}>
                {report.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={generating}
            style={{
              padding: "8px",
              background: "transparent",
              border: "none",
              cursor: generating ? "not-allowed" : "pointer",
              color: "#718096",
            }}
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "24px" }}>
          
          {/* Format Selection */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 500,
              color: "#4a5568",
              marginBottom: "8px",
            }}>
              Export Format
            </label>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setSelectedFormat('csv')}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: selectedFormat === 'csv' ? '#10b981' : '#fff',
                  color: selectedFormat === 'csv' ? '#fff' : '#4a5568',
                  border: `2px solid ${selectedFormat === 'csv' ? '#10b981' : '#e2e8f0'}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                📊 CSV
              </button>
              <button
                onClick={() => setSelectedFormat('pdf')}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: selectedFormat === 'pdf' ? '#ef4444' : '#fff',
                  color: selectedFormat === 'pdf' ? '#fff' : '#4a5568',
                  border: `2px solid ${selectedFormat === 'pdf' ? '#ef4444' : '#e2e8f0'}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                📄 PDF
              </button>
            </div>
          </div>

          {/* Custom Date Range */}
          {showCustomDateRange && (
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                color: "#4a5568",
                marginBottom: "8px",
              }}>
                Date Range
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#718096", display: "block", marginBottom: "4px" }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#718096", display: "block", marginBottom: "4px" }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Selected Filters Info */}
          <div style={{
            background: "#f7fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "20px",
          }}>
            <p style={{ margin: 0, fontSize: "13px", color: "#4a5568", fontWeight: 500, marginBottom: "8px" }}>
              Applied Filters:
            </p>
            <div style={{ fontSize: "13px", color: "#718096" }}>
              {filters.dateRange && filters.dateRange !== '' && <div>• Date Range: <strong>{filters.dateRange}</strong></div>}
              {customDateRange.start && <div>• Start Date: <strong>{customDateRange.start}</strong></div>}
              {customDateRange.end && <div>• End Date: <strong>{customDateRange.end}</strong></div>}
              {filters.status && filters.status !== 'all' && <div>• Status: <strong>{filters.status}</strong></div>}
              {filters.machine && filters.machine !== 'all' && <div>• Category: <strong>{filters.machine}</strong></div>}
              {(!filters.dateRange || filters.dateRange === '') && !filters.status && !filters.machine && !customDateRange.start && (
                <div>• No filters applied (will generate full report)</div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={onClose}
              disabled={generating}
              style={{
                flex: 1,
                padding: "12px",
                background: "#fff",
                color: "#718096",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: generating ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                flex: 1,
                padding: "12px",
                background: generating ? "#a0aec0" : "#667eea",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: generating ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {generating ? (
                <>
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid #fff",
                      borderTop: "2px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  Generating...
                </>
              ) : (
                <>
                  <MdFileDownload size={18} />
                  Generate & Download
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}