import { createContext, useContext, useEffect, useState } from "react";
import settingsApi from "../api/settingsApi";
import i18n from "../i18n/index";
import { useAuth } from "./AuthContext";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const { authReady, user } = useAuth();

  const [settings, setSettings] = useState({
    company_name:    "",
    company_address: "",
    email:           "",
    phone:           "",
    country:         "Papua New Guinea",
    timezone:        "Pacific/Port_Moresby",
    currency:        "USD",
    date_format:     "MM/DD/YYYY",
    language:        "en",
    theme:           "light",
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!authReady || !user) return;

    // system_admin gets full settings (all fields, read+write access)
    // all other roles get the public subset (formatting fields only, read-only)
    const loader = user.role === "system_admin"
      ? settingsApi.getGeneral()
      : settingsApi.getPublic();

    loader
      .then(res => {
        const sanitized = Object.fromEntries(
          Object.entries(res.data).map(([k, v]) => [k, v ?? ""])
        );
        setSettings(prev => ({ ...prev, ...sanitized }));
        applyTheme(res.data.theme);
        applyLanguage(res.data.language);
      })
      .catch(() => {
        // Silently fall back to defaults if request fails
      })
      .finally(() => setLoaded(true));
  }, [authReady, user]);

  const applyTheme    = (theme) => document.documentElement.setAttribute("data-theme", theme || "light");
  const applyLanguage = (lang)  => i18n.changeLanguage(lang || "en");

  const refreshSettings = async () => {
    try {
      // Only system_admin can refresh full settings
      const loader = user?.role === "system_admin"
        ? settingsApi.getGeneral()
        : settingsApi.getPublic();

      const res = await loader;
      setSettings(prev => ({ ...prev, ...res.data }));
      applyTheme(res.data.theme);
      applyLanguage(res.data.language);
    } catch {
      // Silently ignore
    }
  };

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat(settings.language || "en", {
        style:    "currency",
        currency: settings.currency || "USD",
      }).format(amount ?? 0);
    } catch {
      return `${settings.currency} ${amount}`;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const pad = n => String(n).padStart(2, "0");
    const tz  = settings.timezone || "UTC";

    try {
      const isBareDate = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ||
                         /^\d{4}-\d{2}-\d{2}T00:00:00/.test(dateStr);
      let Y, M, D;

      if (isBareDate) {
        [Y, M, D] = dateStr.split("T")[0].split("-").map(Number);
      } else {
        const dt = new Date(dateStr);
        if (isNaN(dt)) return String(dateStr);
        const parts = new Intl.DateTimeFormat("en-US", {
          timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
        }).formatToParts(dt);
        Y = Number(parts.find(p => p.type === "year").value);
        M = Number(parts.find(p => p.type === "month").value);
        D = Number(parts.find(p => p.type === "day").value);
      }

      const Dp = pad(D), Mp = pad(M);
      const map = {
        "MM/DD/YYYY": `${Mp}/${Dp}/${Y}`,
        "DD/MM/YYYY": `${Dp}/${Mp}/${Y}`,
        "YYYY-MM-DD": `${Y}-${Mp}-${Dp}`,
        "DD-MM-YYYY": `${Dp}-${Mp}-${Y}`,
        "MM-DD-YYYY": `${Mp}-${Dp}-${Y}`,
        "DD.MM.YYYY": `${Dp}.${Mp}.${Y}`,
      };
      return map[settings.date_format] || `${Mp}/${Dp}/${Y}`;
    } catch {
      return String(dateStr);
    }
  };

  const formatTime = (value) => {
    if (!value) return "";
    try {
      const iso = /^\d{2}:\d{2}/.test(value) ? `1970-01-01T${value}` : value;
      const dt  = new Date(iso);
      if (isNaN(dt)) return String(value);
      return dt.toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit", hour12: true,
        timeZone: settings.timezone || "UTC",
      });
    } catch {
      return String(value);
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "";
    try {
      const dt = new Date(value);
      if (isNaN(dt)) return String(value);
      const timePart = dt.toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit", hour12: true,
        timeZone: settings.timezone || "UTC",
      });
      return `${formatDate(value)} ${timePart}`;
    } catch {
      return String(value);
    }
  };

  return (
    <SettingsContext.Provider
      value={{ settings, loaded, refreshSettings, formatCurrency, formatDate, formatTime, formatDateTime }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);