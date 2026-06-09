import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./styles.css";
import App from "./App.jsx";

import { AuthProvider }     from "./contexts/AuthContext.jsx";
import { SettingsProvider } from "./contexts/SettingsContext.jsx";

import "./i18n/index";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "admin-lte/dist/css/adminlte.min.css";
import "admin-lte/dist/js/adminlte.min.js";
import "@fortawesome/fontawesome-free/css/all.min.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime:    10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});


createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);
