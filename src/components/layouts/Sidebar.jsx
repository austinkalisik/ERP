import {
  MdMenu, MdDashboard, MdPeople, MdAttachMoney, MdQrCodeScanner,
  MdPrecisionManufacturing, MdAssessment, MdSettings, MdEventNote,
  MdPerson, MdExpandMore, MdBuild, MdLocalGasStation, MdDirectionsCar,
  MdPlayArrow, MdBarChart, MdSchedule, MdCreditCard, MdAccessTime,
  MdContactPhone, MdSubscriptions, MdBusiness, MdRefresh, MdTune,
  MdInventory, MdTrendingUp, MdApps,
} from "react-icons/md";
import { Link, useLocation } from "react-router-dom";
import { can } from "../../utils/permissions";
import { useState } from "react";
import { useSettings } from "../../contexts/SettingsContext";
import { useTranslation } from "react-i18next";

export default function Sidebar({ open, setOpen, user }) {
  const location     = useLocation();
  const { settings } = useSettings();
  const { t }        = useTranslation();
  const dark         = settings.theme === "dark";

  const permissions = user?.permissions || [];
  const role        = user?.role || "";

  const hasRole       = (...roles) => roles.includes(role);
  const hasPermission = (slug)     => can(permissions, slug);

  const [hrmsExpanded,            setHrmsExpanded]            = useState(location.pathname.startsWith("/hrms"));
  const [payrollExpanded,         setPayrollExpanded]         = useState(location.pathname.startsWith("/payroll"));
  const [aimsExpanded,            setAimsExpanded]            = useState(location.pathname.startsWith("/aims"));
  const [aimsSetupExpanded,       setAimsSetupExpanded]       = useState(location.pathname.startsWith("/aims/setup"));
  const [momsExpanded,            setMomsExpanded]            = useState(location.pathname.startsWith("/moms"));
  const [momsMaintenanceExpanded, setMomsMaintenanceExpanded] = useState(location.pathname.startsWith("/moms/maintenance"));
  const [momsOperationsExpanded,  setMomsOperationsExpanded]  = useState(location.pathname.startsWith("/moms/operations"));
  const [momsFinanceExpanded,     setMomsFinanceExpanded]     = useState(location.pathname.startsWith("/moms/finance"));
  const [momsReportsExpanded,     setMomsReportsExpanded]     = useState(location.pathname.startsWith("/moms/reports"));
  const [crmExpanded,             setCrmExpanded]             = useState(location.pathname.startsWith("/crm"));

  const theme = {
    sidebar:      dark ? "#0f172a" : "#ffffff",
    border:       dark ? "#1e293b" : "#e5e5e5",
    text:         dark ? "#f1f5f9" : "#444",
    textMuted:    dark ? "#94a3b8" : "#666",
    textNested:   dark ? "#cbd5e1" : "#777",
    hover:        dark ? "#1e293b" : "#f5f5f5",
    activeItem:   "#123d72",
    activeBg:     dark ? "#123d72" : "#e8f3f6",
    activeText:   dark ? "#b8f3ee" : "#123d72",
    nestedBorder: dark ? "#334155" : "#e5e7eb",
    title:        dark ? "#f1f5f9" : "#333",
  };

  const menuItems = [
    {
      name: t("nav.dashboard"), icon: <MdDashboard />, path: "/dashboard",
      permission: null, hidden: role !== "system_admin",
    },
    {
      name: t("nav.hrms"), icon: <MdPeople />, path: "/hrms",
      permission: "access_hrms", hasSubmenu: true,
      submenu: [
        ...(hasRole("employee") ? [{ name: t("nav.myProfile") || "My Profile", icon: <MdPerson />, path: `/hrms/employee/${user?.biometric_id || ""}`, permission: "employee.view" }] : []),
        { name: hasRole("employee") ? (t("nav.myRequests") || "My Requests") : (t("nav.leaveOtRequests") || "Leave & OT Requests"), icon: <MdEventNote />, path: "/hrms/applications", permission: "access_hrms" },
      ],
    },
    {
      name: t("nav.payroll"), icon: <MdAttachMoney />, path: "/payroll",
      permission: "access_payroll", hasSubmenu: true,
      submenu: [
        { name: t("nav.cashAdvances"), icon: <MdCreditCard />, path: "/payroll/cash-advances", permission: "access_payroll" },
        ...(hasRole("system_admin", "hr") ? [{ name: "Payroll Setup", icon: <MdBuild />, path: "/payroll/setup", permission: "access_payroll" }] : []),
      ],
    },
    {
      name: t("nav.aims"), icon: <MdQrCodeScanner />, path: "/aims",
      permission: "access_aims",
      hasSubmenu: true,
      submenu: [
        // ── Stocktaking (all AIMS users) ──
        { name: "Stocktake", icon: <MdInventory />, path: "/aims/stocktake", permission: "access_aims" },

        // ── Setup submenu (managers only) ──
        ...(hasPermission("aims.purchase_orders.approve") ? [{
          name: t("moms.setup"), icon: <MdBuild />, path: "/aims/setup",
          permission: "aims.purchase_orders.approve", hasNestedSubmenu: true,
          nestedSubmenu: [
            { name: t("aims.salesOrders.title") || "Sales Order", icon: <MdAssessment />, path: "/aims/setup/sales-order", permission: "aims.purchase_orders.approve" },
            { name: t("nav.customers") || "Customers",            icon: <MdPeople />,     path: "/aims/setup/customers",   permission: "aims.purchase_orders.approve" },
          ],
        }] : []),
      ],
    },
    {
      name: t("nav.moms"), icon: <MdPrecisionManufacturing />, path: "/moms",
      permission: "access_moms", hasSubmenu: true,
      submenu: [
        ...(hasRole("system_admin", "moms_manager", "moms_supervisor") ? [{ name: t("moms.machines"), icon: <MdPrecisionManufacturing />, path: "/moms/machines", permission: "moms.fleet.view" }] : []),
        ...(hasRole("system_admin", "moms_manager", "moms_supervisor") ? [{ name: t("moms.operators"), icon: <MdPeople />, path: "/moms/operators", permission: "moms.operators.view" }] : []),
        ...(hasRole("system_admin", "moms_manager", "moms_supervisor") ? [{ name: t("moms.fuelLogs") || "Fuel", icon: <MdLocalGasStation />, path: "/moms/fuel", permission: "moms.fuel.view" }] : []),
        ...(hasRole("system_admin", "moms_manager", "moms_supervisor") ? [{
          name: t("moms.maintenance"), icon: <MdBuild />, path: "/moms/maintenance",
          permission: "moms.maintenance.view", hasNestedSubmenu: true,
          nestedSubmenu: [
            { name: t("moms.logs"),      icon: <MdEventNote />, path: "/moms/maintenance/logs",      permission: "moms.maintenance.view" },
            { name: t("moms.schedules"), icon: <MdSchedule />,  path: "/moms/maintenance/schedules", permission: "moms.schedules.view" },
          ],
        }] : []),
        ...(hasRole("system_admin", "moms_manager", "moms_supervisor") ? [{ name: t("moms.fleets"), icon: <MdDirectionsCar />, path: "/moms/fleets", permission: "moms.fleet.view" }] : []),
        {
          name: t("moms.operations"), icon: <MdPlayArrow />, path: "/moms/operations",
          permission: "moms.operations.view", hasNestedSubmenu: true,
          nestedSubmenu: [
            { name: t("moms.startShift"), icon: <MdPlayArrow />,  path: "/moms/operations/start-shift",  permission: "moms.operations.create" },
            { name: t("moms.dailyOps"),   icon: <MdBarChart />,   path: "/moms/operations/daily-ops",    permission: "moms.operations.view" },
            { name: "Time Entries",       icon: <MdAccessTime />, path: "/moms/operations/time-entries", permission: "moms.assignments.view" },
          ],
        },
        ...(hasRole("system_admin", "moms_manager", "moms_supervisor") ? [{
          name: t("moms.finance"), icon: <MdAttachMoney />, path: "/moms/finance",
          permission: "access_moms", hasNestedSubmenu: true,
          nestedSubmenu: [
            { name: t("moms.fuelCosts"), icon: <MdLocalGasStation />, path: "/moms/finance/fuel-costs",   permission: "access_moms" },
            { name: t("moms.pricing"),   icon: <MdAttachMoney />,     path: "/moms/finance/pricing",      permission: "access_moms" },
            // ── NEW: R&M Costs ──
            { name: "R&M Costs",         icon: <MdBuild />,           path: "/moms/finance/repair-costs", permission: "access_moms" },
          ],
        }] : []),
        // ── NEW: Reports ──
        ...(hasRole("system_admin", "moms_manager", "moms_supervisor") ? [{
          name: "Reports", icon: <MdAssessment />, path: "/moms/reports",
          permission: "access_moms", hasNestedSubmenu: true,
          nestedSubmenu: [
            { name: "Availability", icon: <MdBarChart />, path: "/moms/reports/availability", permission: "access_moms" },
          ],
        }] : []),
      ],
    },
    // ── CRM ──────────────────────────────────────────────────────────────────
    {
      name: "CRM", icon: <MdContactPhone />, path: "/crm",
      permission: "access_crm", hasSubmenu: true,
      submenu: [
        { name: "Clients",       icon: <MdBusiness />,      path: "/crm/clients",       permission: "access_crm" },
        { name: "Subscriptions", icon: <MdSubscriptions />, path: "/crm/subscriptions", permission: "access_crm" },
        { name: "Renewals",      icon: <MdRefresh />,       path: "/crm/renewals",      permission: "access_crm" },
        { name: "Reports",       icon: <MdAssessment />,    path: "/crm/reports",       permission: "access_crm" },
        { name: "Services",      icon: <MdTune />,          path: "/crm/services",      permission: "access_crm" },
        { name: "Deals", icon: <MdTrendingUp />, path: "/crm/deals", permission: "access_crm" },
      ],
    },
    { name: "Integrated Systems", icon: <MdApps />, path: "/systems", permission: null },
    { name: t("nav.reports"),  icon: <MdAssessment />, path: "/reports",  permission: "access_reports" },
    { name: t("nav.settings"), icon: <MdSettings />,   path: "/settings", permission: "access_settings" },
  ];

  const visibleMenuItems = menuItems.filter(
    (item) => !item.hidden && (!item.permission || hasPermission(item.permission))
  );

  return (
    <aside style={{ width: open ? "80px" : "240px", transition: "width 0.3s ease", background: theme.sidebar, borderRight: `1px solid ${theme.border}`, height: "100vh", position: "fixed", top: 0, left: 0, boxShadow: dark ? "2px 0 8px rgba(0,0,0,0.4)" : "2px 0 8px rgba(0,0,0,0.05)", zIndex: 1000, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 10px", borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: open ? "center" : "space-between" }}>
          {!open && <h2 style={{ fontWeight: 600, fontSize: "20px", color: theme.title, margin: 0, whiteSpace: "nowrap" }}>ERP System</h2>}
          <MdMenu size={24} style={{ cursor: "pointer", color: theme.text }} onClick={() => setOpen(!open)} />
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "10px", overflowY: "auto", overflowX: "hidden", flex: 1, scrollbarWidth: "thin", scrollbarColor: `${dark ? "#334155" : "#cbd5e1"} transparent` }} className="custom-scrollbar">
        <style>{`.custom-scrollbar::-webkit-scrollbar{width:6px}.custom-scrollbar::-webkit-scrollbar-track{background:transparent}.custom-scrollbar::-webkit-scrollbar-thumb{background:${dark ? "#334155" : "#cbd5e1"};border-radius:3px}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:${dark ? "#475569" : "#94a3b8"}}`}</style>

        {visibleMenuItems.map((item, index) => {
          const isActive = !item.external && (item.path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname === item.path || location.pathname.startsWith(item.path + "/"));

          if (item.hasSubmenu && !open) {
            const isExpanded =
              item.path === "/hrms"    ? hrmsExpanded    :
              item.path === "/payroll" ? payrollExpanded :
              item.path === "/aims"    ? aimsExpanded    :
              item.path === "/moms"    ? momsExpanded    :
              item.path === "/crm"     ? crmExpanded     :
              false;

            const setExpanded =
              item.path === "/hrms"    ? setHrmsExpanded    :
              item.path === "/payroll" ? setPayrollExpanded :
              item.path === "/aims"    ? setAimsExpanded    :
              item.path === "/moms"    ? setMomsExpanded    :
              item.path === "/crm"     ? setCrmExpanded     :
              null;

            return (
              <div key={`${item.name}-${index}`} style={{ marginBottom: "4px" }}>
                <div
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "8px", background: isActive ? "#123d72" : "transparent", color: isActive ? "#fff" : theme.text, transition: "background 0.2s ease" }}
                  onMouseEnter={(e) => !isActive && (e.currentTarget.style.background = theme.hover)}
                  onMouseLeave={(e) => !isActive && (e.currentTarget.style.background = "transparent")}
                >
                  <Link to={item.path} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "12px", flex: 1, color: "inherit" }} onClick={(e) => e.stopPropagation()}>
                    <span style={{ fontSize: "20px", flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontSize: "14px" }}>{item.name}</span>
                  </Link>
                  <span
                    style={{ fontSize: "18px", transition: "transform 0.2s ease", transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)", cursor: "pointer", padding: "4px 8px", flexShrink: 0, borderRadius: "4px" }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded && setExpanded(!isExpanded); }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <MdExpandMore />
                  </span>
                </div>

                {isExpanded && (
                  <div style={{ marginLeft: "16px", marginTop: "4px", display: "flex", flexDirection: "column", gap: "2px", paddingLeft: "8px", borderLeft: `2px solid ${theme.nestedBorder}` }}>
                    {item.submenu.filter((s) => !s.permission || hasPermission(s.permission)).map((subItem, subIndex) => {
                      const isSubActive = location.pathname === subItem.path || location.pathname.startsWith(subItem.path + "/");

                      if (subItem.hasNestedSubmenu) {
                        const isNestedExpanded =
                          (item.path === "/aims" && subItem.path === "/aims/setup"       && aimsSetupExpanded) ||
                          (item.path === "/moms" && subItem.path === "/moms/maintenance" && momsMaintenanceExpanded) ||
                          (item.path === "/moms" && subItem.path === "/moms/operations"  && momsOperationsExpanded) ||
                          (item.path === "/moms" && subItem.path === "/moms/finance"     && momsFinanceExpanded) ||
                          (item.path === "/moms" && subItem.path === "/moms/reports"     && momsReportsExpanded);

                        return (
                          <div key={`${subItem.name}-${subIndex}`}>
                            <div
                              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: "6px", background: isSubActive ? theme.activeBg : "transparent", color: isSubActive ? theme.activeText : theme.textMuted, fontSize: "13px", transition: "all 0.2s ease" }}
                              onMouseEnter={(e) => !isSubActive && (e.currentTarget.style.background = theme.hover)}
                              onMouseLeave={(e) => !isSubActive && (e.currentTarget.style.background = "transparent")}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, cursor: "default" }}>
                                <span style={{ fontSize: "16px", flexShrink: 0 }}>{subItem.icon}</span>
                                <span>{subItem.name}</span>
                              </div>
                              <span
                                style={{ fontSize: "16px", transition: "transform 0.2s ease", transform: isNestedExpanded ? "rotate(0deg)" : "rotate(-90deg)", flexShrink: 0, cursor: "pointer", padding: "4px 8px", borderRadius: "4px" }}
                                onClick={(e) => {
                                  e.preventDefault(); e.stopPropagation();
                                  if      (subItem.path === "/aims/setup")            setAimsSetupExpanded(!aimsSetupExpanded);
                                  else if (subItem.path === "/moms/maintenance")      setMomsMaintenanceExpanded(!momsMaintenanceExpanded);
                                  else if (subItem.path === "/moms/operations")       setMomsOperationsExpanded(!momsOperationsExpanded);
                                  else if (subItem.path === "/moms/finance")          setMomsFinanceExpanded(!momsFinanceExpanded);
                                  else if (subItem.path === "/moms/reports")          setMomsReportsExpanded(!momsReportsExpanded);
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                              >
                                <MdExpandMore />
                              </span>
                            </div>
                            {isNestedExpanded && (
                              <div style={{ marginLeft: "16px", marginTop: "2px", display: "flex", flexDirection: "column", gap: "2px", paddingLeft: "8px", borderLeft: `2px solid ${theme.nestedBorder}` }}>
                                {subItem.nestedSubmenu.filter((n) => !n.permission || hasPermission(n.permission)).map((nestedItem, ni) => {
                                  const isNestedActive = location.pathname === nestedItem.path || location.pathname.startsWith(nestedItem.path + "/");
                                  return (
                                    <Link
                                      key={`${nestedItem.name}-${ni}`}
                                      to={nestedItem.path}
                                      style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", borderRadius: "6px", background: isNestedActive ? (dark ? "#123d72" : "#e8f3f6") : "transparent", color: isNestedActive ? (dark ? "#b8f3ee" : "#123d72") : theme.textNested, fontSize: "12px", transition: "all 0.2s ease" }}
                                      onMouseEnter={(e) => !isNestedActive && (e.currentTarget.style.background = theme.hover)}
                                      onMouseLeave={(e) => !isNestedActive && (e.currentTarget.style.background = "transparent")}
                                    >
                                      <span style={{ fontSize: "14px", flexShrink: 0 }}>{nestedItem.icon}</span>
                                      <span>{nestedItem.name}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={`${subItem.name}-${subIndex}`}
                          to={subItem.path}
                          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "6px", background: isSubActive ? theme.activeBg : "transparent", color: isSubActive ? theme.activeText : theme.textMuted, fontSize: "13px", transition: "all 0.2s ease" }}
                          onMouseEnter={(e) => !isSubActive && (e.currentTarget.style.background = theme.hover)}
                          onMouseLeave={(e) => !isSubActive && (e.currentTarget.style.background = "transparent")}
                        >
                          <span style={{ fontSize: "16px", flexShrink: 0 }}>{subItem.icon}</span>
                          <span>{subItem.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={`${item.name}-${index}`}
              to={item.path}
              style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: open ? "center" : "flex-start", gap: open ? "0px" : "12px", padding: "10px 12px", borderRadius: "8px", background: isActive ? "#123d72" : "transparent", color: isActive ? "#fff" : theme.text, transition: "background 0.2s ease", marginBottom: "4px" }}
              onMouseEnter={(e) => !isActive && (e.currentTarget.style.background = theme.hover)}
              onMouseLeave={(e) => !isActive && (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize: "20px", flexShrink: 0 }}>{item.icon}</span>
              {!open && <span style={{ fontSize: "14px" }}>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
