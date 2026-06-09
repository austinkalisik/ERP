import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en  from "./locales/en.json";
import ja  from "./locales/ja.json";
import tpi from "./locales/tpi.json";
import tl  from "./locales/tl.json";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en:  { translation: en  },
      ja:  { translation: ja  },
      tpi: { translation: tpi },
      tl:  { translation: tl  },
    },
    lng:      "en",       // default — overridden by SettingsContext on load
    fallbackLng: "en",

    // ✅ Show key name for missing translations (dev mode)
    // e.g. missing key shows as "payroll.runPayroll" instead of blank
    parseMissingKeyHandler: (key) => `[${key}]`,

    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;