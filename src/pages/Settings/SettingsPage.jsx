import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MdSave, MdSettings, MdArrowBack, MdEdit, MdDelete, MdPersonAdd, MdLock, MdShield, MdTimer, MdVpnKey, MdHistory } from "react-icons/md";
import Layout from "../../components/layouts/DashboardLayout";
import settingsApi from "../../api/settingsApi";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../contexts/SettingsContext";
import { Modal, Button, Form } from "react-bootstrap";

/* HRMS SECTIONS */
import DepartmentsSection      from "./sections/Departments/DepartmentsSection";
import ShiftsSection           from "./sections/Shifts/ShiftsSection";
import EmploymentStatusSection from "./sections/EmploymentStatus/EmploymentStatusSection";
import LeaveTypesSection       from "./sections/LeaveTypes/LeaveTypesSection";
import OvertimeTypesSection    from "./sections/OvertimeTypes/OvertimeTypesSection";
import PublicHolidaysSection   from "./sections/PublicHolidays/PublicHolidaysSection";
import PayrollConfigSection    from "./sections/PayrollConfig/PayrollConfigSection";

/* MOMS SECTIONS */
import ChecklistTemplatesSection from "./sections/MOMS/ChecklistTemplatesSection";

/* ASSET MANAGEMENT SECTIONS */
import CategoriesSection from "./sections/AIMS/CategoriesSection";
import UnitsSection      from "./sections/AIMS/UnitsSection";
import WarehousesSection from "./sections/AIMS/WarehousesSection";

/* AUDIT TRAIL */
import AuditTrailSection from "./sections/AuditTrail/AuditTrailSection";

/* =========================
   MAIN SETTINGS PAGE
========================= */
export default function SettingsPage() {
  const { role, loading } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const tab    = params.get("tab");
    const valid  = ["general", "users", "modules", "security", "audit"];
    return valid.includes(tab) ? tab : "general";
  };

  const [activeTab,    setActiveTab]    = useState(getInitialTab);
  const [activeModule, setActiveModule] = useState(null);
  const [activeHRMS,   setActiveHRMS]   = useState(null);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    setActiveModule(null);
    setActiveHRMS(null);
    navigate(`/settings?tab=${tabId}`, { replace: true });
  };

  if (loading) {
    return <Layout><div style={{ padding: 60 }}>{t("common.loading")}</div></Layout>;
  }

  if (role === "employee") {
    return (
      <Layout>
        <div style={{ padding: 60, textAlign: "center" }}>
          <h3>Access Restricted</h3>
          <p>You do not have permission to access Settings.</p>
        </div>
      </Layout>
    );
  }

  if (!role) return null;

  const tabs = [
    { id: "general",  label: t("settings.tabs.general"),    roles: ["system_admin"] },
    { id: "users",    label: t("settings.tabs.users"),      roles: ["system_admin"] },
    { id: "modules",  label: t("settings.tabs.modules"),    roles: ["system_admin", "hr"] },
    { id: "security", label: t("settings.tabs.security"),   roles: ["system_admin"] },
    { id: "audit",    label: t("settings.tabs.auditTrail"), roles: ["system_admin", "hr"] },
  ];

  const visibleTabs = tabs.filter((tab) => tab.roles.includes(role));

  return (
    <Layout>
      <div className="container-fluid px-4">
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>{t("settings.title")}</h1>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 24, borderBottom: "1px solid #e5e7eb", marginBottom: 24, flexWrap: "wrap" }}>
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              style={{
                background: "none", border: "none", paddingBottom: 12, fontSize: 14,
                fontWeight: 500, cursor: "pointer",
                color: activeTab === tab.id ? "#111827" : "#6b7280",
                borderBottom: activeTab === tab.id ? "2px solid #111827" : "2px solid transparent",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "modules" && (activeModule || activeHRMS) && (
          <button
            onClick={() => { if (activeHRMS) setActiveHRMS(null); else setActiveModule(null); }}
            style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: 14, fontWeight: 500 }}
          >
            <MdArrowBack size={18} /> {t("common.back")}
          </button>
        )}

        {activeTab === "general"  && <GeneralSettings />}
        {activeTab === "users"    && <UsersAndRoles />}
        {activeTab === "modules"  && (
          <>
            {!activeModule && <ModulesChooser onSelect={setActiveModule} />}
            {activeModule === "hrms" && (
              <>
                {!activeHRMS && <HRMSSettings onManage={setActiveHRMS} />}
                {activeHRMS === "departments"     && <DepartmentsSection />}
                {activeHRMS === "shifts"          && <ShiftsSection />}
                {activeHRMS === "employment"      && <EmploymentStatusSection />}
                {activeHRMS === "leave-types"     && <LeaveTypesSection />}
                {activeHRMS === "overtime-types"  && <OvertimeTypesSection />}
                {activeHRMS === "public-holidays" && <PublicHolidaysSection />}
                {activeHRMS && !["departments","shifts","employment","leave-types","overtime-types","public-holidays"].includes(activeHRMS) && (
                  <ComingSoon module="HRMS Module" />
                )}
              </>
            )}
            {activeModule === "payroll" && <PayrollConfigSection />}
            {activeModule === "aims" && (
              <>
                {!activeHRMS && <AIMSSettings onManage={setActiveHRMS} />}
                {activeHRMS === "categories" && <CategoriesSection />}
                {activeHRMS === "units"      && <UnitsSection />}
                {activeHRMS === "warehouses" && <WarehousesSection />}
              </>
            )}
            {activeModule === "moms"       && <ChecklistTemplatesSection />}
            {activeModule === "crm"        && <CRMSettings />}
            {activeModule === "accounting" && <ComingSoon module="Accounting" />}
          </>
        )}
        {activeTab === "security" && <SecuritySettings />}
        {activeTab === "audit"    && <AuditTrailSection />}
      </div>
    </Layout>
  );
}

/* =========================
   GENERAL SETTINGS
========================= */
function GeneralSettings() {
  const { refreshSettings } = useSettings();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const DEFAULTS = {
    company_name: "", company_address: "", email: "", phone: "",
    country: "Papua New Guinea", timezone: "Pacific/Port_Moresby",
    currency: "USD", date_format: "MM/DD/YYYY", language: "en",
  };

  const [formData, setFormData] = useState(DEFAULTS);
  const [saving,   setSaving]   = useState(false);
  const [isDirty,  setIsDirty]  = useState(false);

  const currencies = [
    { value: "USD", label: "USD - US Dollar" },
    { value: "PGK", label: "PGK - Papua New Guinea Kina" },
    { value: "AUD", label: "AUD - Australian Dollar" },
    { value: "EUR", label: "EUR - Euro" },
    { value: "GBP", label: "GBP - British Pound" },
    { value: "JPY", label: "JPY - Japanese Yen" },
    { value: "CNY", label: "CNY - Chinese Yuan" },
    { value: "CAD", label: "CAD - Canadian Dollar" },
    { value: "NZD", label: "NZD - New Zealand Dollar" },
    { value: "SGD", label: "SGD - Singapore Dollar" },
    { value: "PHP", label: "PHP - Philippine Peso" },
    { value: "IDR", label: "IDR - Indonesian Rupiah" },
  ];

  const dateFormats = [
    { value: "MM/DD/YYYY", label: "MM/DD/YYYY (12/31/2026)" },
    { value: "DD/MM/YYYY", label: "DD/MM/YYYY (31/12/2026)" },
    { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2026-12-31)" },
    { value: "DD-MM-YYYY", label: "DD-MM-YYYY (31-12-2026)" },
    { value: "MM-DD-YYYY", label: "MM-DD-YYYY (12-31-2026)" },
    { value: "DD.MM.YYYY", label: "DD.MM.YYYY (31.12.2026)" },
  ];

  const timezones = [
    { value: "Pacific/Port_Moresby", label: "(UTC+10:00) Port Moresby" },
    { value: "Australia/Sydney",     label: "(UTC+11:00) Sydney" },
    { value: "Australia/Melbourne",  label: "(UTC+11:00) Melbourne" },
    { value: "Australia/Brisbane",   label: "(UTC+10:00) Brisbane" },
    { value: "Australia/Perth",      label: "(UTC+08:00) Perth" },
    { value: "Pacific/Auckland",     label: "(UTC+13:00) Auckland" },
    { value: "Asia/Manila",          label: "(UTC+08:00) Manila" },
    { value: "Asia/Singapore",       label: "(UTC+08:00) Singapore" },
    { value: "Asia/Tokyo",           label: "(UTC+09:00) Tokyo" },
    { value: "Asia/Hong_Kong",       label: "(UTC+08:00) Hong Kong" },
    { value: "Asia/Shanghai",        label: "(UTC+08:00) Shanghai" },
    { value: "Asia/Jakarta",         label: "(UTC+07:00) Jakarta" },
    { value: "America/New_York",     label: "(UTC-05:00) New York" },
    { value: "America/Chicago",      label: "(UTC-06:00) Chicago" },
    { value: "America/Denver",       label: "(UTC-07:00) Denver" },
    { value: "America/Los_Angeles",  label: "(UTC-08:00) Los Angeles" },
    { value: "Europe/London",        label: "(UTC+00:00) London" },
    { value: "Europe/Paris",         label: "(UTC+01:00) Paris" },
    { value: "Europe/Berlin",        label: "(UTC+01:00) Berlin" },
    { value: "UTC",                  label: "(UTC+00:00) UTC" },
  ];

  const languages = [
    { value: "en",  label: "English" },
    { value: "tpi", label: "Tok Pisin" },
    { value: "tl",  label: "Filipino (Tagalog)" },
    { value: "ja",  label: "日本語 (Japanese)" },
  ];

  const { data: serverData, isLoading: loading } = useQuery({
    queryKey:             ["settings_general"],
    queryFn:              () => settingsApi.getGeneral().then((r) =>
      Object.fromEntries(Object.entries(r.data).map(([k, v]) => [k, v ?? ""]))
    ),
    staleTime:            10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!serverData || isDirty) return;
    setFormData({ ...DEFAULTS, ...serverData });
  }, [serverData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleCancel = () => {
    if (serverData) { setFormData({ ...DEFAULTS, ...serverData }); setIsDirty(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.saveGeneral(formData);
      queryClient.setQueryData(["settings_general"], formData);
      setIsDirty(false);
      await refreshSettings();
      Swal.fire("Success", t("settings.general.savedSuccess"), "success");
    } catch {
      Swal.fire("Error", t("settings.general.savedError"), "error");
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="mb-3" style={{ fontWeight: 600, fontSize: 16 }}>{t("settings.sections.companyInfo")}</h5>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label mb-1" style={{ fontSize: 14 }}>{t("settings.general.companyName")}:</label>
              <input type="text" name="company_name" className="form-control" value={formData.company_name} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <label className="form-label mb-1" style={{ fontSize: 14 }}>{t("settings.general.email")}:</label>
              <input type="email" name="email" className="form-control" value={formData.email} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <label className="form-label mb-1" style={{ fontSize: 14 }}>{t("settings.general.phone")}:</label>
              <input type="text" name="phone" className="form-control" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="col-md-6">
              <label className="form-label mb-1" style={{ fontSize: 14 }}>{t("settings.general.country")}:</label>
              <input type="text" name="country" className="form-control" value={formData.country} onChange={handleChange} />
            </div>
            <div className="col-12">
              <label className="form-label mb-1" style={{ fontSize: 14 }}>{t("settings.general.companyAddress")}:</label>
              <textarea name="company_address" className="form-control" rows="3" value={formData.company_address} onChange={handleChange} />
            </div>
          </div>
        </div>
      </div>
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="mb-3" style={{ fontWeight: 600, fontSize: 16 }}>{t("settings.sections.regionalFormat")}</h5>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label mb-1" style={{ fontSize: 14 }}>{t("settings.general.timezone")}:</label>
              <select name="timezone" className="form-select" value={formData.timezone} onChange={handleChange}>
                {timezones.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label mb-1" style={{ fontSize: 14 }}>{t("settings.general.currency")}:</label>
              <select name="currency" className="form-select" value={formData.currency} onChange={handleChange}>
                {currencies.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label mb-1" style={{ fontSize: 14 }}>{t("settings.general.dateFormat")}:</label>
              <select name="date_format" className="form-select" value={formData.date_format} onChange={handleChange}>
                {dateFormats.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label mb-1" style={{ fontSize: 14 }}>{t("settings.general.language")}:</label>
              <select name="language" className="form-select" value={formData.language} onChange={handleChange}>
                {languages.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-end gap-2">
        <button className="btn btn-outline-secondary" onClick={handleCancel}>{t("common.cancel")}</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <MdSave className="me-2" />{saving ? t("common.loading") : t("common.save")}
        </button>
      </div>
    </div>
  );
}

/* =========================
   SECURITY SETTINGS
========================= */
const SECURITY_DEFAULTS = {
  session_timeout:           30,
  max_login_attempts:         5,
  lockout_duration:          15,
  password_expiry_days:      90,
  min_password_length:        8,
  require_strong_password:  true,
  audit_log_retention_days:  90,
  two_factor_enabled:       false,
};

const RETENTION_OPTIONS = [
  { value: 30,   label: "30 days" },
  { value: 60,   label: "60 days" },
  { value: 90,   label: "90 days", recommended: true },
  { value: 180,  label: "6 months" },
  { value: 365,  label: "1 year" },
  { value: 730,  label: "2 years" },
  { value: 1095, label: "3 years" },
  { value: 0,    label: "Forever (never auto-delete)" },
];

function SecuritySettings() {
  const { t }           = useTranslation();
  const queryClient     = useQueryClient();
  const [form, setForm] = useState(SECURITY_DEFAULTS);
  const [saving,  setSaving]  = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const { data: serverData, isLoading: loading } = useQuery({
    queryKey:             ["settings_security"],
    queryFn:              () => baseApi.get("/api/settings/security").then((r) => r.data),
    staleTime:            10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!serverData || isDirty) return;
    setForm({ ...SECURITY_DEFAULTS, ...serverData });
  }, [serverData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : Number(value) }));
    setIsDirty(true);
  };

  const handleToggle = (name) => {
    setForm((prev) => ({ ...prev, [name]: !prev[name] }));
    setIsDirty(true);
  };

  const handleCancel = () => {
    if (serverData) { setForm({ ...SECURITY_DEFAULTS, ...serverData }); setIsDirty(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await baseApi.put("/api/settings/security", form);
      queryClient.setQueryData(["settings_security"], form);
      setIsDirty(false);
      Swal.fire("Success", "Security settings saved successfully.", "success");
    } catch {
      Swal.fire("Error", "Failed to save security settings.", "error");
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;

  const retentionLabel = RETENTION_OPTIONS.find((o) => o.value === form.audit_log_retention_days)?.label
    ?? `${form.audit_log_retention_days} days`;

  return (
    <div>
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center gap-2 mb-3">
            <MdTimer size={20} color="#6b7280" />
            <h5 className="mb-0" style={{ fontWeight: 600, fontSize: 16 }}>Session Management</h5>
          </div>
          <div className="row g-4">
            <div className="col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: 14 }}>
                Session Timeout
                <span className="ms-2 text-muted fw-normal" style={{ fontSize: 13 }}>
                  — {form.session_timeout} min{form.session_timeout !== 1 ? "s" : ""}
                </span>
              </label>
              <input type="number" name="session_timeout" className="form-control"
                value={form.session_timeout} min={5} max={1440} onChange={handleChange} />
              <small className="text-muted">Users are logged out after this period of inactivity (5–1440 mins)</small>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center gap-2 mb-3">
            <MdShield size={20} color="#6b7280" />
            <h5 className="mb-0" style={{ fontWeight: 600, fontSize: 16 }}>Brute-Force Protection</h5>
          </div>
          <div className="row g-4">
            <div className="col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: 14 }}>
                Max Login Attempts
                <span className="ms-2 text-muted fw-normal" style={{ fontSize: 13 }}>
                  — {form.max_login_attempts} attempt{form.max_login_attempts !== 1 ? "s" : ""}
                </span>
              </label>
              <input type="number" name="max_login_attempts" className="form-control"
                value={form.max_login_attempts} min={3} max={20} onChange={handleChange} />
              <small className="text-muted">Account locks after this many consecutive failed logins (3–20)</small>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: 14 }}>
                Lockout Duration
                <span className="ms-2 text-muted fw-normal" style={{ fontSize: 13 }}>
                  — {form.lockout_duration} min{form.lockout_duration !== 1 ? "s" : ""}
                </span>
              </label>
              <input type="number" name="lockout_duration" className="form-control"
                value={form.lockout_duration} min={1} max={1440} onChange={handleChange} />
              <small className="text-muted">How long the account stays locked after too many attempts</small>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center gap-2 mb-3">
            <MdVpnKey size={20} color="#6b7280" />
            <h5 className="mb-0" style={{ fontWeight: 600, fontSize: 16 }}>Password Policy</h5>
          </div>
          <div className="row g-4">
            <div className="col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: 14 }}>
                Password Expiry
                <span className="ms-2 text-muted fw-normal" style={{ fontSize: 13 }}>
                  — {form.password_expiry_days === 0 ? "never expires" : `${form.password_expiry_days} days`}
                </span>
              </label>
              <input type="number" name="password_expiry_days" className="form-control"
                value={form.password_expiry_days} min={0} max={365} onChange={handleChange} />
              <small className="text-muted">Set to 0 to disable password expiration</small>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: 14 }}>
                Minimum Password Length
                <span className="ms-2 text-muted fw-normal" style={{ fontSize: 13 }}>
                  — {form.min_password_length} characters
                </span>
              </label>
              <input type="number" name="min_password_length" className="form-control"
                value={form.min_password_length} min={6} max={128} onChange={handleChange} />
              <small className="text-muted">Minimum number of characters required (6–128)</small>
            </div>
            <div className="col-12">
              <div
                className="d-flex align-items-center justify-content-between p-3 rounded"
                style={{ backgroundColor: "#f8f9fa", border: "1px solid #e9ecef", cursor: "pointer" }}
                onClick={() => handleToggle("require_strong_password")}
              >
                <div>
                  <div className="fw-semibold" style={{ fontSize: 14 }}>Require Strong Passwords</div>
                  <small className="text-muted">Must include uppercase, number, and special character</small>
                </div>
                <div className="form-check form-switch mb-0" onClick={(e) => e.stopPropagation()}>
                  <input
                    className="form-check-input" type="checkbox" role="switch"
                    name="require_strong_password"
                    checked={form.require_strong_password}
                    onChange={() => handleToggle("require_strong_password")}
                    style={{ width: "2.5em", height: "1.25em", cursor: "pointer" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center gap-2 mb-3">
            <MdHistory size={20} color="#6b7280" />
            <h5 className="mb-0" style={{ fontWeight: 600, fontSize: 16 }}>Audit & Logging</h5>
          </div>
          <div className="row g-4">
            <div className="col-md-6">
              <label className="form-label fw-semibold" style={{ fontSize: 14 }}>
                Log Retention Period
                <span className="ms-2 text-muted fw-normal" style={{ fontSize: 13 }}>
                  — {retentionLabel}
                </span>
              </label>
              <select name="audit_log_retention_days" className="form-select"
                value={form.audit_log_retention_days} onChange={handleChange}>
                {RETENTION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}{o.recommended ? " ✦ Recommended" : ""}
                  </option>
                ))}
              </select>
              <small className="text-muted">
                Audit logs older than this are automatically purged by the nightly cleanup job.
                {form.audit_log_retention_days === 0 && (
                  <span className="text-warning fw-semibold"> Logs will accumulate indefinitely — monitor disk usage.</span>
                )}
              </small>
            </div>
            <div className="col-md-6">
              <div className="p-3 rounded" style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", fontSize: 13 }}>
                <div className="fw-semibold mb-1" style={{ color: "#1d4ed8" }}>Audit logging is always active</div>
                <div className="text-muted">
                  All user actions, logins, data changes, and system events are continuously recorded.
                  The retention period controls how long history is kept, not whether it's recorded.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4" style={{ opacity: 0.7 }}>
        <div className="card-body">
          <div className="d-flex align-items-center gap-2 mb-3">
            <MdLock size={20} color="#6b7280" />
            <h5 className="mb-0" style={{ fontWeight: 600, fontSize: 16 }}>Two-Factor Authentication</h5>
            <span className="badge ms-2" style={{ backgroundColor: "#e5e7eb", color: "#374151", fontSize: 11 }}>Coming Soon</span>
          </div>
          <div className="d-flex align-items-center justify-content-between p-3 rounded"
            style={{ backgroundColor: "#f8f9fa", border: "1px solid #e9ecef" }}>
            <div>
              <div className="fw-semibold" style={{ fontSize: 14 }}>Enable Two-Factor Authentication (2FA)</div>
              <small className="text-muted">Require users to verify identity with an authenticator app.</small>
            </div>
            <div className="form-check form-switch mb-0">
              <input className="form-check-input" type="checkbox" role="switch"
                checked={false} disabled
                style={{ width: "2.5em", height: "1.25em", cursor: "not-allowed" }} />
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2">
        <button className="btn btn-outline-secondary" onClick={handleCancel} disabled={saving}>
          {t("common.cancel")}
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <MdSave className="me-2" />
          {saving ? t("common.loading") : t("common.save")}
        </button>
      </div>
    </div>
  );
}

/* =========================
   USERS & ROLES
========================= */
const ROLES = [
  { value: "system_admin",    label: "System Admin" },
  { value: "hr",              label: "HR" },
  { value: "dept_head",       label: "Department Head" },
  { value: "employee",        label: "Employee" },
  { value: "aims_manager",    label: "Asset Manager" },
  { value: "aims_staff",      label: "Asset Staff" },
  { value: "moms_manager",    label: "MOMS Manager" },
  { value: "moms_supervisor", label: "MOMS Supervisor" },
  { value: "moms_operator",   label: "MOMS Operator" },
  { value: "crm_manager",     label: "CRM Manager" },
  { value: "crm_staff",       label: "CRM Staff"   },
];

const PERMISSION_GROUPS = [
  {
    title: "Module Access",
    permissions: [
      ["access_hrms", "HRMS"],
      ["access_payroll", "Payroll"],
      ["access_aims", "Asset Management"],
      ["access_moms", "MOMS"],
      ["access_crm", "CRM"],
    ],
  },
  {
    title: "HRMS",
    permissions: [
      ["employee.view", "View employees"],
      ["employee.create", "Create employees"],
      ["employee.update", "Update employees"],
      ["employee.delete", "Delete employees"],
      ["attendance.manage", "Manage attendance"],
      ["leave.approve", "Approve leave"],
    ],
  },
  {
    title: "Asset Management",
    permissions: [
      ["aims.inventory.view", "View assets"],
      ["aims.inventory.create", "Create assets"],
      ["aims.inventory.update", "Update assets"],
      ["aims.inventory.delete", "Delete assets"],
      ["aims.purchase_orders.view", "View purchase"],
      ["aims.purchase_orders.approve", "Approve purchase"],
    ],
  },
  {
    title: "MOMS",
    permissions: [
      ["moms.fleet.view", "View fleet"],
      ["moms.operators.view", "View operators"],
      ["moms.operations.create", "Start operations"],
      ["moms.operations.approve", "Approve operations"],
      ["moms.maintenance.view", "View maintenance"],
      ["moms.fuel.view", "View fuel"],
    ],
  },
  {
    title: "CRM",
    permissions: [
      ["access_crm", "Access CRM workspace"],
    ],
  },
];

function UsersAndRoles() {
  const { formatDate } = useSettings();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [searchTerm,             setSearchTerm]             = useState("");
  const [roleFilter,             setRoleFilter]             = useState("All");
  const [showEditModal,          setShowEditModal]          = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser,           setSelectedUser]           = useState(null);
  const [editFormData,           setEditFormData]           = useState({ name: "", email: "", role: "", is_active: true, permissions: [] });
  const [newPassword,            setNewPassword]            = useState("");

  const cacheKey = ["settings_users"];
  const { data: users = [], isLoading: loading } = useQuery({
    queryKey:  cacheKey,
    queryFn:   () => baseApi.get("/api/users").then((r) => r.data),
    select:    (raw) => (Array.isArray(raw) ? raw : raw?.data ?? []),
    staleTime: 5 * 60 * 1000,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: cacheKey });

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({ name: user.name, email: user.email, role: user.role, is_active: user.is_active !== false, permissions: user.permissions || [] });
    setShowEditModal(true);
  };

  const togglePermission = (slug, checked) => {
    setEditFormData((current) => ({
      ...current,
      permissions: checked
        ? [...new Set([...(current.permissions || []), slug])]
        : (current.permissions || []).filter((item) => item !== slug),
    }));
  };

  const handleUpdateUser = async () => {
    try {
      await baseApi.put(`/api/users/${selectedUser.id}`, editFormData);
      Swal.fire("Success", "User updated successfully", "success");
      setShowEditModal(false); refetch();
    } catch { Swal.fire("Error", "Failed to update user", "error"); }
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user); setNewPassword(""); setShowResetPasswordModal(true);
  };

  const handleResetPasswordSubmit = async () => {
    if (!newPassword || newPassword.length < 8) {
      Swal.fire("Error", "Password must be at least 8 characters", "error"); return;
    }
    try {
      await baseApi.post(`/api/users/${selectedUser.id}/reset-password`, { new_password: newPassword });
      Swal.fire("Success", "Password reset successfully", "success");
      setShowResetPasswordModal(false); setNewPassword("");
    } catch { Swal.fire("Error", "Failed to reset password", "error"); }
  };

  const handleDeleteUser = async (user) => {
    const result = await Swal.fire({
      title: "Delete User?", text: `Are you sure you want to delete ${user.name}?`, icon: "warning",
      showCancelButton: true, confirmButtonColor: "#dc3545", confirmButtonText: "Yes, delete",
    });
    if (result.isConfirmed) {
      try {
        await baseApi.delete(`/api/users/${user.id}`);
        Swal.fire("Deleted", "User has been deleted", "success"); refetch();
      } catch { Swal.fire("Error", "Failed to delete user", "error"); }
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase())
      || user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "All" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Role", "Status", "Created Date"];
    const csvData = filteredUsers.map((u) => [
      u.name, u.email,
      ROLES.find((r) => r.value === u.role)?.label || u.role,
      u.is_active !== false ? "Active" : "Inactive",
      formatDate(u.created_at),
    ]);
    const csvContent = [headers.join(","), ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `users_export_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    Swal.fire({ icon: "success", title: "Export Successful", text: `Exported ${filteredUsers.length} users to CSV`, timer: 2000, showConfirmButton: false });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            <div className="col-md-5">
              <input type="text" className="form-control" placeholder={t("common.search") + "..."}
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="col-md-3">
              <select className="form-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="All">All Roles</option>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="col-md-4 text-end">
              <button className="btn btn-outline-primary" onClick={handleExportCSV}>
                <MdPersonAdd className="me-2" />{t("common.export")} CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #dee2e6" }}>
                <tr>
                  <th style={{ padding: "16px", fontWeight: 600 }}>Username</th>
                  <th style={{ padding: "16px", fontWeight: 600 }}>Email</th>
                  <th style={{ padding: "16px", fontWeight: 600 }}>Role</th>
                  <th style={{ padding: "16px", fontWeight: 600 }}>{t("common.status")}</th>
                  <th style={{ padding: "16px", fontWeight: 600 }}>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-4 text-muted">{t("common.noData")}</td></tr>
                ) : filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td style={{ padding: "16px" }}>{user.name}</td>
                    <td style={{ padding: "16px" }}>{user.email}</td>
                    <td style={{ padding: "16px" }}>
                      <span className="badge bg-primary">
                        {ROLES.find((r) => r.value === user.role)?.label || user.role}
                      </span>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <span className={`badge ${user.is_active !== false ? "bg-success" : "bg-secondary"}`}>
                        {user.is_active !== false ? t("status.active") : t("status.inactive")}
                      </span>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="btn btn-sm btn-outline-primary"  onClick={() => handleEditUser(user)}      title={t("common.edit")}><MdEdit size={16} /></button>
                        <button className="btn btn-sm btn-outline-warning"  onClick={() => handleResetPassword(user)} title="Reset Password"><MdLock size={16} /></button>
                        <button className="btn btn-sm btn-outline-danger"   onClick={() => handleDeleteUser(user)}    title={t("common.delete")}><MdDelete size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Edit User — {selectedUser?.name}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select value={editFormData.role} onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check type="checkbox" label="Active" checked={editFormData.is_active}
                onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })} />
            </Form.Group>
            <div className="border rounded-3 p-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <Form.Label className="mb-0 fw-semibold">Permissions</Form.Label>
                {editFormData.role === "system_admin" && <span className="badge bg-dark">All permissions</span>}
              </div>
              <div className="row g-3">
                {PERMISSION_GROUPS.map((group) => (
                  <div className="col-md-6" key={group.title}>
                    <div className="small fw-bold text-uppercase text-muted mb-2">{group.title}</div>
                    <div className="d-grid gap-2">
                      {group.permissions.map(([slug, label]) => (
                        <Form.Check
                          key={slug}
                          type="checkbox"
                          label={label}
                          checked={editFormData.role === "system_admin" || (editFormData.permissions || []).includes(slug)}
                          disabled={editFormData.role === "system_admin"}
                          onChange={(event) => togglePermission(slug, event.target.checked)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>{t("common.cancel")}</Button>
          <Button variant="primary" onClick={handleUpdateUser}>{t("common.save")}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showResetPasswordModal} onHide={() => setShowResetPasswordModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Reset Password — {selectedUser?.name}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control type="password" placeholder="Enter new password (min 8 characters)"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <Form.Text className="text-muted">Password must be at least 8 characters long</Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResetPasswordModal(false)}>{t("common.cancel")}</Button>
          <Button variant="warning" onClick={handleResetPasswordSubmit}>Reset Password</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

/* =========================
   MODULE / HRMS / ASSET MANAGEMENT / CRM CHOOSERS
========================= */
function ModulesChooser({ onSelect }) {
  const modules = [
    { key: "hrms",       title: "HRMS",       desc: "Human Resource Management" },
    { key: "payroll",    title: "Payroll",     desc: "Payroll configuration" },
    { key: "aims",       title: "Asset Management", desc: "Assets, inventory, procurement, stocktake, and suppliers" },
    { key: "moms",       title: "MOMS",        desc: "Operations management" },
    { key: "crm",        title: "CRM",         desc: "Customer & subscription management" },
    { key: "accounting", title: "Accounting",  desc: "Financial settings" },
  ];
  return <ModuleSettings title="System Modules" items={modules} onManage={onSelect} />;
}

function HRMSSettings({ onManage }) {
  const items = [
    { key: "departments",     title: "Departments",       desc: "Manage departments" },
    { key: "shifts",          title: "Shifts",            desc: "Work schedules" },
    { key: "employment",      title: "Employment Status", desc: "Employment types" },
    { key: "leave-types",     title: "Leave Types",       desc: "Manage leave types and codes" },
    { key: "overtime-types",  title: "Overtime Types",    desc: "Manage overtime types and pay multipliers" },
    { key: "public-holidays", title: "Public Holidays",   desc: "Manage public holiday calendar" },
  ];
  return <ModuleSettings title="HRMS Settings" items={items} onManage={onManage} />;
}

function AIMSSettings({ onManage }) {
  const navigate = useNavigate();
  const items = [
    { key: "suppliers",  title: "Suppliers",              desc: "Manage supplier contacts for purchase orders",  onManage: () => navigate("/aims/suppliers") },
    { key: "customers",  title: "Customers",              desc: "Manage customer records for sales orders",      onManage: () => navigate("/aims/setup/customers") },
    { key: "categories", title: "Item Categories",        desc: "Classify inventory items by category",          onManage: () => onManage("categories") },
    { key: "units",      title: "Units of Measure",       desc: "Define measurement units used in inventory",    onManage: () => onManage("units") },
    { key: "warehouses", title: "Warehouses & Locations", desc: "Manage storage locations for inventory items",  onManage: () => onManage("warehouses") },
  ];
  return (
    <div>
      <h3 className="mb-4">Asset Management Settings</h3>
      <div className="row g-3">
        {items.map((item) => (
          <div className="col-md-6" key={item.key}>
            <div className="card h-100">
              <div className="card-body">
                <h5>{item.title}</h5>
                <p className="text-muted">{item.desc}</p>
                <button className="btn btn-outline-primary btn-sm" onClick={item.onManage}>Manage</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── NEW: CRM Settings ────────────────────────────────────────────────────────
function CRMSettings() {
  const navigate = useNavigate();

  const items = [
    {
      key:   "services",
      title: "Services",
      desc:  "Manage service types available for client subscriptions (e.g. Internet Service, Domain Hosting, GPS).",
      icon:  "🌐",
      path:  "/crm/services",
    },
    {
      key:   "clients",
      title: "Clients",
      desc:  "View and manage all registered client accounts and their contact information.",
      icon:  "👥",
      path:  "/crm/clients",
    },
    {
      key:   "subscriptions",
      title: "Subscriptions",
      desc:  "View all active, expiring, and expired subscriptions across all clients.",
      icon:  "📋",
      path:  "/crm/subscriptions",
    },
    {
      key:   "renewals",
      title: "Renewal Management",
      desc:  "Track and process upcoming subscription renewals and overdue accounts.",
      icon:  "🔄",
      path:  "/crm/renewals",
    },
    {
      key:   "reports",
      title: "CRM Reports",
      desc:  "View revenue reports, expiry tracking, and service interruption credits.",
      icon:  "📊",
      path:  "/crm/reports",
    },
  ];

  return (
    <div>
      <div className="d-flex align-items-center gap-3 mb-4">
        <div>
          <h3 className="mb-0">CRM Settings</h3>
          <p className="text-muted mb-0" style={{ fontSize: 14 }}>
            Manage client subscriptions, services, and billing configuration
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="mb-4 p-3 rounded" style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
        <div className="fw-semibold mb-1" style={{ color: "#1d4ed8", fontSize: 14 }}>
          📌 CRM is managed directly from its own module
        </div>
        <div style={{ fontSize: 13, color: "#374151" }}>
          Use the shortcuts below to jump to specific CRM sections. Service types
          (Internet, Domain, GPS etc.) are the main configuration item — everything
          else is managed within the CRM module itself.
        </div>
      </div>

      <div className="row g-3">
        {items.map((item) => (
          <div className="col-md-6" key={item.key}>
            <div
              className="card h-100"
              style={{ cursor: "pointer", transition: "box-shadow 0.2s" }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = ""}
              onClick={() => navigate(item.path)}
            >
              <div className="card-body">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <h5 className="mb-0" style={{ fontSize: 16, fontWeight: 600 }}>{item.title}</h5>
                </div>
                <p className="text-muted mb-3" style={{ fontSize: 13 }}>{item.desc}</p>
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={(e) => { e.stopPropagation(); navigate(item.path); }}
                >
                  Go to {item.title}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModuleSettings({ title, items, onManage }) {
  return (
    <div>
      <h3 className="mb-4">{title}</h3>
      <div className="row g-3">
        {items.map((item) => (
          <div className="col-md-6" key={item.title}>
            <div className="card h-100">
              <div className="card-body">
                <h5>{item.title}</h5>
                <p className="text-muted">{item.desc}</p>
                {onManage && (
                  <button className="btn btn-outline-primary btn-sm" onClick={() => onManage(item.key)}>
                    Manage
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingSpinner() { return <div className="spinner-border text-primary" />; }

function ComingSoon({ module }) {
  return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <MdSettings size={56} color="#9ca3af" />
      <h3>{module}</h3>
      <p>Configuration options will be available soon.</p>
    </div>
  );
}
