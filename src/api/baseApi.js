import axios from "axios";

const baseApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Suppress expected 401 console errors (unauthenticated check on page load)
baseApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 on /api/me is expected when not logged in — don't log it
    const is401OnMe =
      error.response?.status === 401 &&
      error.config?.url?.includes("/api/me");

    if (!is401OnMe) {
      // Let other errors propagate normally
    }

    return Promise.reject(error);
  }
);

export default baseApi;
