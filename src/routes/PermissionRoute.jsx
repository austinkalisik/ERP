import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { can } from "../utils/permissions";

export default function PermissionRoute({ permission }) {
  const { loading, isAuthenticated, permissions } = useAuth();

  if (loading) {
    return <div style={{ padding: 40 }}>Checking access...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!can(permissions, permission)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
