import baseApi from "./baseApi";

const settingsApi = {
  // ── system_admin only — full settings with all fields ──────────────────────
  getGeneral:  ()     => baseApi.get("/api/settings/general"),
  saveGeneral: (data) => baseApi.post("/api/settings/general", data),
  saveModules: (data) => baseApi.post("/api/settings/modules", data),

  // ── all authenticated roles — read-only formatting subset ──────────────────
  // Used by SettingsContext so non-admins get company timezone/currency/date format
  getPublic: () => baseApi.get("/api/settings/public"),
};

export default settingsApi;