import { useQuery } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import baseApi from "../../api/baseApi";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../utils/permissions";
import {
  MdPrecisionManufacturing, MdAssignment, MdWarning, MdBuild,
  MdToday, MdAccessTime, MdLocalGasStation,
} from "react-icons/md";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
const today  = new Date().toISOString().split("T")[0];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 18) return "Afternoon";
  return "Evening";
}

export default function MOMS() {
  const navigate = useNavigate();
  const { user, permissions } = useAuth();

  const isOperator         = user?.role === "moms_operator";
  const canViewFuel        = can(permissions, "moms.fuel.view");

  // ════════════════════════════════════════════
  // OPERATOR QUERIES (only run when isOperator)
  // ════════════════════════════════════════════

  // Today's ops — reuses moms_daily_ops cache (DailyOps.jsx shares this key)
  const { data: todayOpsData, isLoading: todayLoading } = useQuery({
    queryKey:  ["moms_daily_ops", today],
    queryFn:   () => baseApi.get(`/api/moms/operations/daily?date=${today}`).then((r) => r.data),
    staleTime: 60 * 1000,
    enabled:   isOperator,
  });

  // Recent shifts (operator-scoped by backend)
  const { data: recentShiftsData, isLoading: recentLoading } = useQuery({
    queryKey:  ["moms_operator_recent_shifts"],
    queryFn:   () => baseApi.get("/api/moms/operations/recent?limit=5").then((r) => r.data),
    staleTime: 60 * 1000,
    enabled:   isOperator,
  });

  // Assignments — reuses moms_assignments cache
  const { data: assignmentsData, isLoading: assignLoading } = useQuery({
    queryKey:  ["moms_assignments"],
    queryFn:   () => baseApi.get("/api/moms/assignments").then((r) => r.data || []),
    staleTime: 30 * 1000,
    enabled:   isOperator,
  });

  const todayOps       = todayOpsData?.operations || [];
  const recentShifts   = recentShiftsData?.operations || [];
  const assignments    = Array.isArray(assignmentsData) ? assignmentsData : [];
  const currentAssignment = assignments.find((a) => a.status === "Active") || null;
  const todayHours     = todayOps.reduce((sum, op) => sum + (parseFloat(op.hours) || 0), 0);
  const operatorLoading = todayLoading || recentLoading || assignLoading;

  const operatorStats = {
    todayShifts:        todayOps.length,
    totalHours:         todayHours.toFixed(1),
    breakdownsReported: 0,
  };

  // ════════════════════════════════════════════
  // MANAGER / SUPERVISOR QUERIES
  // ════════════════════════════════════════════

  // Main stats — only fetched when canViewFuel (manager/supervisor)
  const { data: statsData = {} } = useQuery({
    queryKey:  ["moms_dashboard_stats"],
    queryFn:   () => baseApi.get("/api/moms/stats").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    enabled:   !isOperator && canViewFuel,
  });

  const { data: utilizationData = [] } = useQuery({
    queryKey:  ["moms_machine_utilization"],
    queryFn:   () => baseApi.get("/api/moms/machine-utilization").then((r) => r.data || []),
    staleTime: 5 * 60 * 1000,
    enabled:   !isOperator && canViewFuel,
  });

  const { data: downtimeRaw = {} } = useQuery({
    queryKey:  ["moms_downtime_overview"],
    queryFn:   () => baseApi.get("/api/moms/downtime-overview").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    enabled:   !isOperator && canViewFuel,
  });

  const { data: fuelConsumptionData = [] } = useQuery({
    queryKey:  ["moms_fuel_consumption_chart"],
    queryFn:   () => baseApi.get("/api/moms/fuel-consumption").then((r) => r.data || []),
    staleTime: 5 * 60 * 1000,
    enabled:   !isOperator && canViewFuel,
  });

  // Derived from statsData
  const activeMachines      = statsData.activeMachines      || 0;
  const activeAssignments   = statsData.activeAssignments   || 0;
  const maintenanceOverdue  = statsData.maintenanceOverdue  || 0;
  const breakdownsToday     = statsData.breakdownsToday     || 0;
  const fuelUsage           = statsData.fuelUsage           || { amount: 0, cost: 0 };
  const machineUtilization  = statsData.machineUtilization  || { percentage: 0, active: 0, total: 0 };
  const activeJobSites      = statsData.activeJobSites      || { count: 0, avgProgress: 0 };

  const downtimeData  = downtimeRaw.chartData || [];
  const summaryStats  = downtimeRaw.summary   || { totalOpHours: 0, totalDowntime: 0, machinesTracked: 0, avgDowntimePerMachine: 0 };

  // ════════════════════════════════════════════
  // OPERATOR VIEW
  // ════════════════════════════════════════════
  if (isOperator) {
    return (
      <Layout>
        <div className="container-fluid px-3 px-md-4">
          <div className="row mb-4">
            <div className="col-12">
              <h1 style={{ fontWeight: "bold", fontSize: "clamp(20px, 5vw, 28px)" }}>Good {getGreeting()}, {user?.name?.split(" ")[0]}! 👋</h1>
              <p className="text-muted mb-0">Here's your shift overview for today.</p>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="row g-3 mb-4">
            {[
              { label: "Today's Shifts",      value: operatorStats.todayShifts,        color: "#3b82f6", icon: <MdToday size={26} color="#fff" /> },
              { label: "Total Hours Logged",  value: `${operatorStats.totalHours} hrs`, color: "#10b981", icon: <MdAccessTime size={26} color="#fff" /> },
              { label: "Breakdowns Reported", value: operatorStats.breakdownsReported,  color: "#f59e0b", icon: <MdWarning size={26} color="#fff" /> },
            ].map((c) => (
              <div key={c.label} className="col-12 col-md-4">
                <div className="card shadow-sm" style={{ borderRadius: "12px", border: "none" }}>
                  <div className="card-body p-3 d-flex align-items-center gap-3" style={{ minHeight: "90px" }}>
                    <div style={{ backgroundColor: c.color, width: "48px", height: "48px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.icon}</div>
                    <div>
                      <p className="text-muted mb-1" style={{ fontSize: "13px", fontWeight: "500" }}>{c.label}</p>
                      <h3 className="mb-0" style={{ fontWeight: "bold" }}>{operatorLoading ? "—" : c.value}</h3>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Current Assignment */}
          <div className="row g-3 mb-4">
            <div className="col-12">
              <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
                <div className="card-header bg-white p-3 border-bottom"><h5 className="mb-0" style={{ fontWeight: "600", fontSize: "16px" }}>Current Assignment</h5></div>
                <div className="card-body p-3">
                  {operatorLoading ? (
                    <p className="text-muted text-center py-3">Loading...</p>
                  ) : currentAssignment ? (
                    <div>
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <div style={{ backgroundColor: "#ede9fe", width: "48px", height: "48px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <MdPrecisionManufacturing size={26} color="#5b21b6" />
                        </div>
                        <div>
                          <p className="mb-0" style={{ fontWeight: "600", fontSize: "15px" }}>{currentAssignment.machine_id_display || currentAssignment.machine_id}</p>
                          <p className="mb-0 text-muted" style={{ fontSize: "13px" }}>{currentAssignment.job_site || "No job site assigned"}</p>
                        </div>
                      </div>
                      <div className="d-flex gap-2 flex-wrap">
                        <span style={{ backgroundColor: "#d1fae5", color: "#065f46", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "600" }}>{currentAssignment.status}</span>
                        <span style={{ backgroundColor: "#dbeafe", color: "#1e40af", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: "600" }}>{currentAssignment.shift_type} Shift</span>
                      </div>
                      <button className="btn btn-outline-primary btn-sm mt-3 w-100" style={{ borderRadius: "8px", fontWeight: "500" }} onClick={() => navigate(`/moms/assignments/${currentAssignment.id}`)}>View Assignment Details</button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <MdAssignment size={40} style={{ color: "#d1d5db", marginBottom: "8px" }} />
                      <p className="text-muted mb-0" style={{ fontSize: "14px" }}>No active assignment</p>
                      <p className="text-muted" style={{ fontSize: "12px" }}>Contact your supervisor for an assignment.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Shifts */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
                <div className="card-header bg-white p-3 border-bottom"><h5 className="mb-0" style={{ fontWeight: "600", fontSize: "16px" }}>Recent Shifts</h5></div>
                <div className="card-body p-0">
                  {operatorLoading ? (
                    <p className="text-center text-muted py-4">Loading...</p>
                  ) : recentShifts.length === 0 ? (
                    <div className="text-center py-5">
                      <MdAccessTime size={40} style={{ color: "#d1d5db", marginBottom: "8px" }} />
                      <p className="text-muted mb-0">No shifts recorded yet.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead style={{ backgroundColor: "#f8fafc" }}>
                          <tr>{["Date","Machine","Duration","Hours","Status"].map((h) => <th key={h} style={{ padding: "12px 16px", fontWeight: "600", fontSize: "13px", color: "#6b7280" }}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {recentShifts.map((shift) => (
                            <tr key={shift.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/moms/operations/${shift.id}`)}>
                              <td style={{ padding: "12px 16px", fontSize: "14px" }}>{new Date(shift.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                              <td style={{ padding: "12px 16px", fontSize: "14px", color: "#3b82f6", fontWeight: "500" }}>{shift.machine}</td>
                              <td style={{ padding: "12px 16px", fontSize: "14px" }}>{shift.duration}</td>
                              <td style={{ padding: "12px 16px", fontSize: "14px" }}>{shift.hours}</td>
                              <td style={{ padding: "12px 16px" }}>
                                <span style={{ backgroundColor: shift.status === "In Progress" ? "#dbeafe" : shift.status === "Completed" ? "#d1fae5" : "#fef3c7", color: shift.status === "In Progress" ? "#1e40af" : shift.status === "Completed" ? "#065f46" : "#92400e", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "600" }}>{shift.status}</span>
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
          </div>
        </div>
      </Layout>
    );
  }

  // ════════════════════════════════════════════
  // MANAGER / SUPERVISOR VIEW
  // ════════════════════════════════════════════
  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="row mb-3 mb-md-4">
          <div className="col-12">
            <h1 style={{ fontWeight: "bold", fontSize: "clamp(20px, 5vw, 28px)" }}>Dashboard</h1>
            <p className="text-muted mb-0">Machine Operations Management System</p>
          </div>
        </div>

        {/* Top stat cards */}
        <div className="row g-2 g-md-3 mb-3 mb-md-4">
          <MOMSCard title="Active Machines"     value={activeMachines}     color="#3b82f6" icon={<MdPrecisionManufacturing size={30} color="#fff" />} />
          <MOMSCard title="Active Assignments"  value={activeAssignments}  color="#10b981" icon={<MdAssignment size={30} color="#fff" />} />
          <MOMSCard title="Maintenance Overdue" value={maintenanceOverdue} color="#ef4444" icon={<MdWarning size={30} color="#fff" />} />
          <MOMSCard title="Breakdowns Today"    value={breakdownsToday}    color="#f59e0b" icon={<MdBuild size={30} color="#fff" />} />
        </div>

        {/* Secondary stats */}
        {canViewFuel && (
          <div className="row g-2 g-md-3 mb-3 mb-md-4">
            <div className="col-12 col-md-4">
              <div className="card shadow-sm" style={{ borderRadius: "12px", height: "100%" }}>
                <div className="card-body p-3">
                  <h6 className="text-muted mb-1" style={{ fontSize: "14px" }}>Fuel Usage (This Month)</h6>
                  <h3 className="mb-0" style={{ fontWeight: "bold" }}>{fuelUsage.amount.toFixed(2)} L</h3>
                  <p className="text-muted mb-0" style={{ fontSize: "13px" }}>Cost: ${fuelUsage.cost.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card shadow-sm" style={{ borderRadius: "12px", height: "100%" }}>
                <div className="card-body p-3">
                  <h6 className="text-muted mb-1" style={{ fontSize: "14px" }}>Machine Utilization</h6>
                  <h3 className="mb-0" style={{ fontWeight: "bold" }}>{machineUtilization.percentage.toFixed(1)}%</h3>
                  <p className="text-muted mb-0" style={{ fontSize: "13px" }}>{machineUtilization.active} of {machineUtilization.total} machines active</p>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card shadow-sm" style={{ borderRadius: "12px", height: "100%" }}>
                <div className="card-body p-3">
                  <h6 className="text-muted mb-1" style={{ fontSize: "14px" }}>Active Job Sites</h6>
                  <h3 className="mb-0" style={{ fontWeight: "bold" }}>{activeJobSites.count}</h3>
                  <div className="mt-2">
                    <div className="progress" style={{ height: "8px", borderRadius: "4px" }}>
                      <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${activeJobSites.avgProgress}%` }} aria-valuenow={activeJobSites.avgProgress} aria-valuemin="0" aria-valuemax="100" />
                    </div>
                    <p className="text-muted mb-0 mt-1" style={{ fontSize: "13px" }}>Avg Progress: {activeJobSites.avgProgress.toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts row */}
        {canViewFuel && (
          <div className="row g-2 g-md-3 mb-4">
            <div className="col-12 col-lg-4 mb-3 mb-lg-0">
              <div className="card shadow-sm" style={{ borderRadius: "12px", height: "100%" }}>
                <div className="card-header bg-white p-3 border-bottom"><h5 className="mb-0" style={{ fontWeight: "600", fontSize: "16px" }}>Machine Status</h5></div>
                <div className="card-body p-3" style={{ height: "300px" }}>
                  {utilizationData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={utilizationData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                          {utilizationData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip /><Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="d-flex align-items-center justify-content-center h-100"><p className="text-muted">No utilization data available</p></div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-5 mb-3 mb-lg-0">
              <div className="card shadow-sm" style={{ borderRadius: "12px", height: "100%" }}>
                <div className="card-header bg-white p-3 border-bottom d-flex align-items-center gap-2">
                  <div style={{ width: "12px", height: "12px", backgroundColor: "#f59e0b", borderRadius: "2px" }} />
                  <span style={{ fontSize: "14px", color: "#666", fontWeight: "600" }}>Downtime Hours (Last 7 Days)</span>
                </div>
                <div className="card-body p-3" style={{ height: "300px" }}>
                  {downtimeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={downtimeData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="machine" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="downtime" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="d-flex align-items-center justify-content-center h-100"><p className="text-muted">No downtime data available yet</p></div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-3">
              <div className="card shadow-sm" style={{ borderRadius: "12px", height: "100%" }}>
                <div className="card-header bg-white p-3 border-bottom"><h5 className="mb-0" style={{ fontWeight: "600", fontSize: "16px" }}>Summary Stats</h5></div>
                <div className="card-body p-3">
                  {[
                    { label: "Total Op Hours:",        value: `${summaryStats.totalOpHours} hrs`,                     color: "#10b981" },
                    { label: "Total Downtime:",        value: `${summaryStats.totalDowntime} hrs`,                    color: "#ef4444" },
                    { label: "Machines Tracked:",      value: summaryStats.machinesTracked,                           color: "#3b82f6" },
                    { label: "Avg Downtime/Machine:",  value: `${summaryStats.avgDowntimePerMachine.toFixed(2)} hrs`, color: "#f59e0b" },
                  ].map((s) => (
                    <div key={s.label} className="mb-3">
                      <p className="text-muted mb-1" style={{ fontSize: "14px" }}>{s.label}</p>
                      <h5 style={{ fontWeight: "bold", color: s.color }}>{s.value}</h5>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fuel chart */}
        {canViewFuel && (
          <div className="row g-2 g-md-3 mb-4">
            <div className="col-12 col-lg-8 mb-3 mb-lg-0">
              <div className="card shadow-sm" style={{ borderRadius: "12px", height: "100%" }}>
                <div className="card-header bg-white p-3 border-bottom"><h5 className="mb-0" style={{ fontWeight: "600", fontSize: "16px" }}>Fuel Consumption Overview (Last 30 Days)</h5></div>
                <div className="card-body p-3" style={{ height: "300px" }}>
                  {fuelConsumptionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={fuelConsumptionData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} label={{ value: "Fuel Volume (L)", angle: -90, position: "insideLeft", fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="fuel" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="d-flex align-items-center justify-content-center h-100 flex-column">
                      <p className="text-muted mb-3">No fuel consumption data for the last 30 days</p>
                      <button className="btn btn-primary" onClick={() => navigate("/moms/fuel")} style={{ borderRadius: "8px", fontWeight: "500" }}>View Fuel Management</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-4">
              <div className="card shadow-sm" style={{ borderRadius: "12px", height: "100%" }}>
                <div className="card-header bg-white p-3 border-bottom"><h5 className="mb-0" style={{ fontWeight: "600", fontSize: "16px" }}>Fuel Summary</h5></div>
                <div className="card-body p-3">
                  {[
                    { label: "This Month:",    value: `${fuelUsage.amount.toFixed(2)} L`,                color: "#3b82f6" },
                    { label: "Month Cost:",    value: `$${fuelUsage.cost.toFixed(2)}`,                   color: "#10b981" },
                    { label: "Daily Average:", value: `${(fuelUsage.amount / 30).toFixed(2)} L`,          color: "#f59e0b" },
                  ].map((s) => (
                    <div key={s.label} className="mb-3">
                      <p className="text-muted mb-1" style={{ fontSize: "14px" }}>{s.label}</p>
                      <h5 style={{ fontWeight: "bold", color: s.color }}>{s.value}</h5>
                    </div>
                  ))}
                  <button className="btn btn-primary w-100 mt-2" style={{ borderRadius: "8px", height: "40px", fontSize: "14px", fontWeight: "500" }} onClick={() => navigate("/moms/fuel/consumption-report")}>View Fuel Report</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function MOMSCard({ title, value, color, icon }) {
  return (
    <div className="col-6 col-md-3">
      <div className="card shadow-sm" style={{ borderRadius: "12px", border: "none", overflow: "hidden" }}>
        <div className="card-body p-3 d-flex align-items-center gap-3" style={{ minHeight: "100px" }}>
          <div style={{ backgroundColor: color, width: "50px", height: "50px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
          <div style={{ overflow: "hidden" }}>
            <p className="text-muted mb-1" style={{ fontSize: "13px", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</p>
            <h3 className="mb-0" style={{ fontWeight: "bold", fontSize: "24px" }}>{value}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}