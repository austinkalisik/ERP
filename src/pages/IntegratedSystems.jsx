import { Link } from "react-router-dom";
import Layout from "../components/layouts/DashboardLayout";
import { useAuth } from "../contexts/AuthContext";
import { can } from "../utils/permissions";
import {
  MdAssessment,
  MdBuild,
  MdContactPhone,
  MdInventory,
  MdRouter,
  MdSupportAgent,
} from "react-icons/md";

const MODULES = [
  {
    name: "Assets Management",
    description: "Asset register, inventory, issue/return workflows, suppliers, departments, receivers, and audit records.",
    sourcePath: "modules/assets-management",
    route: "/aims/inventory",
    permission: "access_aims",
    roles: ["system_admin", "aims_manager", "aims_staff"],
    icon: MdInventory,
    status: "Integrated via AIMS inventory",
  },
  {
    name: "CRM",
    description: "Clients, subscriptions, renewals, services, deals, reports, and customer lifecycle management.",
    sourcePath: "modules/crm-standalone",
    route: "/crm",
    permission: "access_crm",
    roles: ["system_admin", "crm_manager", "crm_staff"],
    icon: MdContactPhone,
    status: "Integrated",
  },
  {
    name: "Monitoring System",
    description: "Standalone monitoring source preserved for ERP module integration and operational reporting.",
    sourcePath: "modules/monitoring-system",
    route: null,
    permission: "access_reports",
    roles: ["system_admin"],
    icon: MdAssessment,
    status: "Source included",
  },
  {
    name: "WiFi / NAC Portal",
    description: "Network access control, hotspot, plans, sessions, adverts, and payment portal source.",
    sourcePath: "modules/wifi-nac-portal",
    route: null,
    permission: "access_settings",
    roles: ["system_admin"],
    icon: MdRouter,
    status: "Source included",
  },
  {
    name: "Ticketing System",
    description: "Support ticketing source copied into ERP for helpdesk and service workflow integration.",
    sourcePath: "modules/ticketing-system",
    route: null,
    permission: "access_reports",
    roles: ["system_admin", "crm_manager", "crm_staff"],
    icon: MdSupportAgent,
    status: "Source included",
  },
  {
    name: "MOMS",
    description: "Machines, operators, assignments, fuel, maintenance, breakdowns, operations, fleet, and reports.",
    sourcePath: "core ERP module",
    route: "/moms",
    permission: "access_moms",
    roles: ["system_admin", "moms_manager", "moms_supervisor", "moms_operator"],
    icon: MdBuild,
    status: "Integrated",
  },
];

function canOpenModule(module, user) {
  if (!user) return false;
  if (user.permissions?.includes("*")) return true;
  if (module.roles?.includes(user.role)) return true;
  return module.permission ? can(user.permissions || [], module.permission) : true;
}

export default function IntegratedSystems() {
  const { user } = useAuth();
  const modules = MODULES.filter((module) => canOpenModule(module, user));

  return (
    <Layout>
      <div className="container-fluid">
        <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
          <div>
            <h1 className="h3 mb-1 fw-bold text-dark">Integrated Systems</h1>
            <p className="text-muted mb-0">
              One ERP login controls access to the systems and source modules included in this workspace.
            </p>
          </div>
          <div className="text-muted small align-self-lg-end">
            Workspace: <span className="fw-semibold">A:\NextGen Projects\ERP</span>
          </div>
        </div>

        <div className="row g-3">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <div className="col-12 col-md-6 col-xl-4" key={module.name}>
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body d-flex flex-column gap-3">
                    <div className="d-flex align-items-start justify-content-between gap-3">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="d-flex align-items-center justify-content-center rounded-3"
                          style={{ width: 46, height: 46, background: "#eef2ff", color: "#4f46e5" }}
                        >
                          <Icon size={24} />
                        </div>
                        <div>
                          <h2 className="h5 mb-1 fw-bold">{module.name}</h2>
                          <span className="badge text-bg-light border">{module.status}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-muted mb-0 flex-grow-1">{module.description}</p>

                    <div className="small text-muted">
                      Source: <code>{module.sourcePath}</code>
                    </div>

                    {module.route ? (
                      <Link to={module.route} className="btn btn-primary align-self-start">
                        Open Module
                      </Link>
                    ) : (
                      <button type="button" className="btn btn-outline-secondary align-self-start" disabled>
                        Awaiting full merge
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
