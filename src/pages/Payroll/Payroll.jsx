import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { useSettings } from "../../contexts/SettingsContext";

import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { MdPendingActions, MdCheckCircle, MdAssignment } from "react-icons/md";

const fetchPayrollStats = () =>
  baseApi.get("/api/payroll/dashboard-stats").then((r) => r.data);

export default function Payroll() {
  const navigate = useNavigate();
  const { formatCurrency } = useSettings();
  const { t } = useTranslation();

  // ── React Query — cached 5 minutes, payroll stats rarely change mid-day ─
  const { data } = useQuery({
    queryKey:  ["payroll_stats"],
    queryFn:   fetchPayrollStats,
    staleTime: 5 * 60 * 1000,
  });

  const totalRuns       = data?.totalRuns       ?? 0;
  const pendingRuns     = data?.pendingRuns     ?? 0;
  const completedAmount = data?.completedAmount ?? 0;
  const statusData      = data?.statusData      ?? [];
  const trendData       = data?.trendData       ?? [];

  const buttonStyle = {
    height: "52px", fontSize: "15px", fontWeight: "500", borderRadius: "8px",
  };

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="row mb-3 mb-md-4">
          <div className="col-12">
            <h1 style={{ fontWeight: "bold", fontSize: "clamp(20px, 5vw, 28px)" }}>
              {t("payroll.title")}
            </h1>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row g-2 g-md-3 mb-3 mb-md-4">
          <PayrollCard title={t("payroll.totalRuns")}        value={totalRuns}                    color="#3b82f6" icon={<MdAssignment    size={30} color="#fff" />} />
          <PayrollCard title={t("payroll.pendingPayrolls")}  value={pendingRuns}                  color="#f59e0b" icon={<MdPendingActions size={30} color="#fff" />} />
          <PayrollCard title={t("payroll.completedPayrolls")} value={formatCurrency(completedAmount)} color="#10b981" icon={<MdCheckCircle   size={30} color="#fff" />} />
        </div>

        {/* Status Chart + Trend */}
        <div className="row g-2 g-md-3 mb-4">
          <div className="col-12 col-lg-8 mb-3 mb-lg-0" style={{ minWidth: 0 }}>
            <div className="card h-100 shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-header bg-white p-3">
                <h5 className="mb-0" style={{ fontWeight: "600" }}>{t("payroll.statusDistribution")}</h5>
              </div>
              <div className="card-body p-2 p-md-3" style={{ height: "500px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={1200} animationBegin={200}>
                      {statusData.map((_, index) => (
                        <Cell key={index} fill={["#3b82f6", "#10b981", "#ef4444", "#8b5cf6"][index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-4" style={{ minWidth: 0 }}>
            <div className="card h-100 shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-header bg-white p-3">
                <h5 className="mb-0" style={{ fontWeight: "600" }}>{t("payroll.trend")}</h5>
              </div>
              <div className="card-body p-2 p-md-3" style={{ height: "260px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="card-body p-3 d-flex flex-column gap-3">
                <button className="btn btn-primary w-100" style={buttonStyle} onClick={() => navigate("/payroll/run")}>
                  {t("payroll.runPayroll")}
                </button>
                <button className="btn w-100" style={{ ...buttonStyle, backgroundColor: "#f59e0b", color: "white" }} onClick={() => navigate("/payroll/salary-table")}>
                  {t("payroll.viewSalaryTable")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function PayrollCard({ title, value, color, icon }) {
  return (
    <div className="col-12 col-sm-6 col-lg-4">
      <div className="card d-flex flex-row align-items-center"
        style={{ background: color, color: "white", borderRadius: "15px", padding: "20px", minHeight: "120px", gap: "15px" }}>
        <div style={{ background: "rgba(255,255,255,0.25)", width: "55px", height: "55px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
        <div>
          <h6 style={{ fontWeight: "bold" }}>{title}</h6>
          <h2 style={{ fontWeight: "bold" }}>{value}</h2>
        </div>
      </div>
    </div>
  );
}