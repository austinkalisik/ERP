import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MdPeople, MdAttachMoney, MdQrCodeScanner, MdPrecisionManufacturing,
  MdCalendarToday, MdFilterList, MdSearch, MdVisibility, MdFileDownload,
} from "react-icons/md";
import DashboardLayout from "../components/layouts/DashboardLayout";
import baseApi from "../api/baseApi";
import ReportViewer from "../components/ReportViewer";
import ReportGenerator from "../components/ReportGenerator";
import { useSettings } from "../contexts/SettingsContext";

const TABS = [
  { id: "HRMS",    label: "HRMS",    icon: <MdPeople />,                module: "hrms"    },
  { id: "Payroll", label: "Payroll", icon: <MdAttachMoney />,            module: "payroll" },
  { id: "AIMS",    label: "AIMS",    icon: <MdQrCodeScanner />,          module: "aims"    },
  { id: "MOMS",    label: "MOMS",    icon: <MdPrecisionManufacturing />, module: "moms"    },
];

export default function ReportsPage() {
  const { formatCurrency, formatDate } = useSettings();

  const [activeTab, setActiveTab] = useState("HRMS");
  const [filters,   setFilters]   = useState({ dateRange: "", machine: "all", status: "all", search: "" });

  const [showViewer,     setShowViewer]     = useState(false);
  const [showGenerator,  setShowGenerator]  = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const activeModule = TABS.find((t) => t.id === activeTab)?.module;

  // ── Summary — cached 5 min per tab ───────────────────────────────────────
  const { data: summaryData = {}, isLoading: summaryLoading } = useQuery({
    queryKey:  ["report_summary", activeTab],
    queryFn:   () => baseApi.get(`/api/reports/summary/${activeModule}`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  // ── Reports list — cached 5 min per tab ──────────────────────────────────
  const { data: rawReports = [], isLoading: reportsLoading } = useQuery({
    queryKey:  ["report_list", activeTab],
    queryFn:   () => baseApi.get(`/api/reports/list?module=${activeModule}`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  // dateGenerated uses formatDate from SettingsContext (respects date_format setting)
  const reports = rawReports.map((report) => ({
    ...report,
    dateGenerated: formatDate(new Date().toISOString()),
  }));

  // Summary cards — Payroll values use formatCurrency from SettingsContext
  const getSummaryCards = () => {
    switch (activeTab) {
      case "HRMS":    return [
        { label: "Total Employees", value: summaryData.total_employees || "0" },
        { label: "Present Today",   value: summaryData.present_today   || "0" },
        { label: "On Leave",        value: summaryData.on_leave        || "0" },
      ];
      case "Payroll": return [
        { label: "Total Payroll",   value: formatCurrency(parseFloat(summaryData.total_payroll)   || 0) },
        { label: "Paid This Month", value: formatCurrency(parseFloat(summaryData.paid_this_month) || 0) },
        { label: "Pending",         value: formatCurrency(parseFloat(summaryData.pending)         || 0) },
      ];
      case "AIMS":    return [
        { label: "Total Orders", value: summaryData.total_orders || "0" },
        { label: "Completed",    value: summaryData.completed    || "0" },
        { label: "Pending",      value: summaryData.pending      || "0" },
      ];
      case "MOMS":    return [
        { label: "Machine Usage Hours",   value: summaryData.machine_usage_hours    || "—" },
        { label: "Breakdown This Period", value: summaryData.breakdown_this_period  || "—" },
        { label: "Maintenance Completed", value: summaryData.maintenance_completed  || "—" },
      ];
      default: return [];
    }
  };

  const summaryCards = getSummaryCards();

  const handleGenerate = (report) => { setSelectedReport(report); setShowGenerator(true); };
  const handleView     = (report) => { setSelectedReport(report); setShowViewer(true); };

  const tabStyle = (isActive) => ({
    display: "flex", alignItems: "center", gap: "8px",
    padding: "12px 24px", background: "transparent", border: "none",
    borderBottom: isActive ? "3px solid #667eea" : "3px solid transparent",
    color: isActive ? "#667eea" : "#718096",
    fontSize: "15px", fontWeight: isActive ? 600 : 500,
    cursor: "pointer", transition: "all 0.2s ease", marginBottom: "-2px",
  });

  const selectStyle = {
    width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0",
    borderRadius: "8px", fontSize: "14px", color: "#2d3748",
    background: "#fff", cursor: "pointer",
  };

  const labelStyle = {
    display: "flex", alignItems: "center", gap: "6px",
    fontSize: "13px", fontWeight: 500, color: "#4a5568", marginBottom: "8px",
  };

  return (
    <DashboardLayout>
      <div style={{ padding: "30px", background: "#f8f9fa", minHeight: "100vh", marginLeft: "-16px", marginRight: "-16px", marginTop: "-16px" }}>

        {/* Header */}
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 600, color: "#1a202c", margin: 0 }}>Reports</h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#718096" }}>Generate and view comprehensive reports across all modules</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "30px", borderBottom: "2px solid #e2e8f0" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={tabStyle(activeTab === tab.id)}
              onMouseEnter={(e) => { if (activeTab !== tab.id) e.currentTarget.style.color = "#4a5568"; }}
              onMouseLeave={(e) => { if (activeTab !== tab.id) e.currentTarget.style.color = "#718096"; }}
            >
              <span style={{ fontSize: "20px" }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "30px" }}>
          {summaryCards.map((card, index) => (
            <div key={index} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              <div style={{ fontSize: "14px", color: "#718096", marginBottom: "8px", fontWeight: 500 }}>{card.label}</div>
              {summaryLoading ? (
                <div style={{ height: "40px", background: "#f7fafc", borderRadius: "4px", animation: "pulse 2s ease-in-out infinite" }} />
              ) : (
                <div style={{ fontSize: "32px", fontWeight: 700, color: "#1a202c" }}>{card.value}</div>
              )}
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", alignItems: "end" }}>
            <div>
              <label style={labelStyle}><MdCalendarToday size={16} /> Date Range:</label>
              <select value={filters.dateRange} onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })} style={selectStyle}>
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}><MdFilterList size={16} /> {activeTab === "MOMS" ? "Machine" : "Category"}</label>
              <select value={filters.machine} onChange={(e) => setFilters({ ...filters, machine: e.target.value })} style={selectStyle}>
                <option value="all">All</option>
                <option value="category1">Category 1</option>
                <option value="category2">Category 2</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}><MdFilterList size={16} /> Status</label>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} style={selectStyle}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          {/* Table Header */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "16px 24px", background: "#f7fafc", borderBottom: "1px solid #e2e8f0", fontWeight: 600, fontSize: "13px", color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            <div>Report Title</div><div>Type</div><div>Actions</div>
          </div>

          {reportsLoading ? (
            <div style={{ padding: "60px 24px", textAlign: "center" }}>
              <div style={{ width: "50px", height: "50px", border: "4px solid #e2e8f0", borderTop: "4px solid #667eea", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 20px" }} />
              <p style={{ color: "#718096" }}>Loading reports...</p>
            </div>
          ) : reports.length > 0 ? (
            reports.map((report) => (
              <div
                key={report.id}
                style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "20px 24px", borderBottom: "1px solid #e2e8f0", alignItems: "center", transition: "background 0.2s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#f7fafc"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
              >
                <div style={{ fontSize: "14px", color: "#2d3748", fontWeight: 500 }}>
                  {report.title}
                  <div style={{ fontSize: "12px", color: "#a0aec0", marginTop: "4px" }}>{report.type}</div>
                </div>
                <div>
                  <span style={{ padding: "4px 12px", background: "#e0e7ff", color: "#4c51bf", borderRadius: "12px", fontSize: "12px", fontWeight: 500 }}>{activeTab}</span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => handleView(report)} style={{ padding: "8px 16px", background: "#667eea", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                    <MdVisibility size={16} /> View
                  </button>
                  <button onClick={() => handleGenerate(report)} style={{ padding: "8px 16px", background: "#fff", color: "#10b981", border: "1px solid #10b981", borderRadius: "6px", fontSize: "13px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                    <MdFileDownload size={16} /> Export
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: "60px 24px", textAlign: "center", color: "#a0aec0" }}>
              <MdSearch size={64} style={{ marginBottom: "16px", opacity: 0.5 }} />
              <p style={{ fontSize: "16px", margin: 0 }}>No reports available for this module.</p>
            </div>
          )}
        </div>
      </div>

      {showViewer    && selectedReport && <ReportViewer   report={selectedReport} filters={filters} onClose={() => setShowViewer(false)} />}
      {showGenerator && selectedReport && <ReportGenerator report={selectedReport} filters={filters} onClose={() => setShowGenerator(false)} />}

      <style>{`
        @keyframes spin  { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </DashboardLayout>
  );
}