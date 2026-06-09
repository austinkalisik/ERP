import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import baseApi from "../api/baseApi";

const AuthContext = createContext();

export function getRoleHomePath(role) {
  // ⚠️ crm roles MUST come before the default return
  if (["crm_manager", "crm_staff"].includes(role))             return "/crm";
  if (["moms_manager", "moms_supervisor", "moms_operator"].includes(role)) return "/moms";
  if (["aims_manager", "aims_staff"].includes(role))           return "/aims";
  if (["hr", "dept_head", "employee"].includes(role))          return "/hrms";
  return "/dashboard";
}

const PUBLIC_PATHS = ["/login", "/"];

export function AuthProvider({ children }) {
  const location = useLocation();
  const navigate  = useNavigate();

  const isPublic = PUBLIC_PATHS.includes(location.pathname);

  const [user,      setUser]      = useState(null);
  const [loading,   setLoading]   = useState(!isPublic);
  const [authReady, setAuthReady] = useState(isPublic);
  const hasFetched = useRef(isPublic);

  const fetchUser = async () => {
    try {
      const res = await baseApi.get("/api/me");
      setUser(res.data);
      return res.data;
    } catch {
      return null;
    } finally {
      setLoading(false);
      setAuthReady(true);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await baseApi.get("/api/me");
      setUser(res.data);
    } catch {
      // silent fail — user stays as-is
    }
  };

  useEffect(() => {
    if (PUBLIC_PATHS.includes(location.pathname)) {
      setLoading(false);
      setAuthReady(true);
      hasFetched.current = true;
      return;
    }

    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchUser().then((userData) => {
      if (!userData) return;
      if (location.pathname === "/dashboard") {
        navigate(getRoleHomePath(userData.role), { replace: true });
      }
    });
  }, [location.pathname]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role:            user?.role,
        permissions:     user?.permissions || [],
        isAuthenticated: !!user,
        loading,
        authReady,
        fetchUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);