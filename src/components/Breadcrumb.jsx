import { Link, useLocation } from "react-router-dom";
import { MdHome, MdChevronRight } from "react-icons/md";
import { useAuth } from "../contexts/AuthContext";

const NO_DASHBOARD_ROLES = [
  "hr", "dept_head", "employee",
  "aims_manager", "aims_staff",
  "moms_manager", "moms_supervisor", "moms_operator",
];

export default function Breadcrumb({ customPath }) {
  const location = useLocation();
  const { user } = useAuth();

  const routeNames = {
    "/dashboard": "Dashboard",         
    "/hrms": "HRMS Dashboard",
    "/hrms/add-employee": "Add Employee",
    "/hrms/employee-overview": "Employee Overview",
    "/hrms/employee": "Employee Details",
    "/hrms/employee-status": "Employee Status",
    "/hrms/attendance": "Attendance",
    "/hrms/applications": "Leave & OT Requests",
    "/payroll": "Payroll Dashboard",
    "/payroll/run": "Run Payroll",
    "/aims": "AIMS Dashboard",
    "/aims/add-item": "Add Item",
    "/aims/items": "Edit Item",
    "/aims/inventory": "Inventory List",
    "/aims/stock-movements": "Stock Movements",
    "/aims/request-orders": "Request Orders",
    "/aims/purchase-requests": "Purchase Requests",
    "/aims/suppliers": "Suppliers",
  };

  const currentPath = customPath || location.pathname;
  const pathSegments = currentPath.split("/").filter(Boolean);
  const breadcrumbs  = [];
  const isEmployee   = user?.role === "employee";
  const showHome     = !NO_DASHBOARD_ROLES.includes(user?.role);

  // Home crumb — only for system_admin
  if (showHome) {
    breadcrumbs.push({ label: "Home", path: "/dashboard", icon: <MdHome size={16} /> }); 
  }

  let accumulatedPath = "";

  const hasEmployeeId = pathSegments.some(s => s.match(/^[A-Z]+-\d+$/));

  pathSegments.forEach((segment, index) => {
    accumulatedPath += `/${segment}`;

    const isEmployeeId = segment.match(/^[A-Z]+-\d+$/);

    if (isEmployeeId) {
      if (!isEmployee) {
        if (!breadcrumbs.find(b => b.label === "HRMS Dashboard")) {
          breadcrumbs.push({ label: "HRMS Dashboard", path: "/hrms" });
        }
        breadcrumbs.push({ label: "Employee Overview", path: "/hrms/employee-overview" });
      }
      breadcrumbs.push({ label: isEmployee ? "My Profile" : "Employee Details", path: null });
      return;
    }

    if (!isNaN(segment)) return;
    if (segment === "employee") return;

    if (hasEmployeeId && accumulatedPath === "/hrms") return;

    let displayName =
      routeNames[accumulatedPath] ||
      segment.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    const isLast = index === pathSegments.length - 1;

    breadcrumbs.push({ label: displayName, path: isLast ? null : accumulatedPath });
  });

  return (
    <nav aria-label="breadcrumb" style={{ marginBottom: "24px" }}>
      <ol
        style={{
          display: "flex", alignItems: "center", listStyle: "none",
          padding: "16px 20px", margin: 0, backgroundColor: "#ffffff",
          borderRadius: "10px", border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)", flexWrap: "wrap", gap: "8px",
        }}
      >
        {breadcrumbs.map((crumb, index) => (
          <li key={index} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {crumb.path ? (
              <Link
                to={crumb.path}
                style={{ color: "#6b7280", textDecoration: "none", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", borderRadius: "6px", transition: "all 0.2s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#111827"; e.currentTarget.style.backgroundColor = "#f3f4f6"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#6b7280"; e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                {crumb.icon && <span style={{ display: "flex", alignItems: "center" }}>{crumb.icon}</span>}
                <span
                  style={{ borderBottom: "2px solid transparent", transition: "border-color 0.2s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderBottomColor = "#3b82f6"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderBottomColor = "transparent"; }}
                >
                  {crumb.label}
                </span>
              </Link>
            ) : (
              <span style={{ color: "#111827", fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px" }}>
                {crumb.icon && <span style={{ display: "flex", alignItems: "center" }}>{crumb.icon}</span>}
                <span style={{ borderBottom: "2px solid #3b82f6", paddingBottom: "2px" }}>{crumb.label}</span>
              </span>
            )}

            {index < breadcrumbs.length - 1 && (
              <span style={{ display: "flex", alignItems: "center", color: "#d1d5db" }}>
                <MdChevronRight size={18} />
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}