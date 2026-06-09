import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import baseApi from "../../api/baseApi";
import {
  MdNotifications,
  MdClose,
  MdDoneAll,
  MdBuild,
  MdPeople,
  MdInventory,
  MdWarning,
  MdCheckCircle,
  MdCancel,
  MdPayments,
  MdDescription,
  MdContactPhone,
  MdSubscriptions,
} from "react-icons/md";
import { useAuth } from "../../contexts/AuthContext";

const fetchNotifications = () =>
  baseApi.get("/api/notifications").then((r) => r.data);

// ── Icon + color per module/type ─────────────────────────────────────────────
function getNotificationStyle(module, type) {
  if (module === "moms") {
    return { icon: <MdBuild size={16} />, color: "#3b82f6", bg: "#eff6ff" };
  }

  if (module === "hrms") {
    if (type?.includes("rejected"))
      return { icon: <MdCancel size={16} />,      color: "#dc2626", bg: "#fee2e2" };
    if (type?.includes("approved") || type?.includes("posted"))
      return { icon: <MdCheckCircle size={16} />, color: "#16a34a", bg: "#dcfce7" };
    return   { icon: <MdPeople size={16} />,      color: "#7c3aed", bg: "#f3e8ff" };
  }

  if (module === "aims") {
    if (type === "low_stock")
      return { icon: <MdWarning size={16} />,     color: "#ca8a04", bg: "#fef9c3" };
    if (type?.includes("approved"))
      return { icon: <MdCheckCircle size={16} />, color: "#16a34a", bg: "#dcfce7" };
    if (type?.includes("rejected"))
      return { icon: <MdCancel size={16} />,      color: "#dc2626", bg: "#fee2e2" };
    return   { icon: <MdInventory size={16} />,   color: "#0891b2", bg: "#e0f2fe" };
  }

  if (module === "payroll") {
    if (type === "cash_advance_approved")
      return { icon: <MdCheckCircle size={16} />, color: "#16a34a", bg: "#dcfce7" };
    if (type === "cash_advance_rejected")
      return { icon: <MdCancel size={16} />,      color: "#dc2626", bg: "#fee2e2" };
    return   { icon: <MdPayments size={16} />,    color: "#0369a1", bg: "#e0f2fe" };
  }

  // CRM — subscription & billing notifications
  if (module === "crm") {
    if (type === "subscription_expired")
      return { icon: <MdCancel size={16} />,       color: "#dc2626", bg: "#fee2e2" };
    if (type === "subscription_expiring")
      return { icon: <MdWarning size={16} />,      color: "#ca8a04", bg: "#fef9c3" };
    if (type === "subscription_renewed")
      return { icon: <MdCheckCircle size={16} />,  color: "#16a34a", bg: "#dcfce7" };
    if (type === "payment_recorded")
      return { icon: <MdPayments size={16} />,     color: "#0369a1", bg: "#e0f2fe" };
    return   { icon: <MdSubscriptions size={16} />, color: "#6366f1", bg: "#ede9fe" };
  }

  return { icon: <MdDescription size={16} />, color: "#6b7280", bg: "#f3f4f6" };
}

// ── Module badge ─────────────────────────────────────────────────────────────
function ModuleBadge({ module }) {
  const map = {
    moms:    { label: "MOMS",    bg: "#dbeafe", color: "#1e40af" },
    hrms:    { label: "HRMS",    bg: "#f3e8ff", color: "#6d28d9" },
    aims:    { label: "AIMS",    bg: "#e0f2fe", color: "#0369a1" },
    payroll: { label: "PAYROLL", bg: "#dcfce7", color: "#166534" },
    crm:     { label: "CRM",     bg: "#ede9fe", color: "#4338ca" },
    system:  { label: "SYSTEM",  bg: "#f3f4f6", color: "#374151" },
  };
  const s = map[module] || map.system;
  return (
    <span style={{
      fontSize: "9px", fontWeight: "700", padding: "1px 5px",
      borderRadius: "4px", backgroundColor: s.bg, color: s.color,
      flexShrink: 0,
    }}>
      {s.label}
    </span>
  );
}

export default function NotificationBell() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const dropdownRef     = useRef(null);
  const { authReady, isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey:        ["notifications"],
    queryFn:         fetchNotifications,
    enabled:         authReady && isAuthenticated,
    staleTime:       55 * 1000,
    refetchInterval: authReady && isAuthenticated ? 60 * 1000 : false,
    retry:           false,
  });

  const notifications = data?.notifications || [];
  const unreadCount   = data?.unread_count  || 0;

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAsRead = async (id) => {
    try {
      await baseApi.post(`/api/notifications/${id}/read`);
      queryClient.setQueryData(["notifications"], (old) => {
        if (!old) return old;
        return {
          ...old,
          notifications: old.notifications.filter((n) => n.id !== id),
          unread_count:  Math.max(0, (old.unread_count || 0) - 1),
        };
      });
    } catch (err) { console.error("Failed to mark as read", err); }
  };

  const markAllAsRead = async () => {
    try {
      await baseApi.post("/api/notifications/read-all");
      queryClient.setQueryData(["notifications"], (old) => ({
        ...old, notifications: [], unread_count: 0,
      }));
    } catch (err) { console.error("Failed to mark all as read", err); }
  };

  const handleClick = async (notification) => {
    await markAsRead(notification.id);
    setOpen(false);
    navigate(notification.url || "/");
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>

      {/* Bell */}
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          position: "relative", background: "none", border: "none",
          cursor: "pointer", padding: "6px", borderRadius: "8px",
          color: "#374151", display: "flex", alignItems: "center", justifyContent: "center",
        }}
        title="Notifications"
      >
        <MdNotifications size={24} />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: "2px", right: "2px",
            backgroundColor: "#dc2626", color: "#fff", borderRadius: "999px",
            fontSize: "10px", fontWeight: "700", minWidth: "16px", height: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 3px", lineHeight: 1,
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: "390px", backgroundColor: "#fff", borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", border: "1px solid #e5e7eb",
          zIndex: 2000, overflow: "hidden",
        }}>

          {/* Header */}
          <div style={{
            padding: "14px 16px", borderBottom: "1px solid #e5e7eb",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <span style={{ fontWeight: "700", fontSize: "15px" }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: "8px", backgroundColor: "#fee2e2", color: "#dc2626",
                  borderRadius: "999px", fontSize: "11px", fontWeight: "700", padding: "2px 8px",
                }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#3b82f6", fontSize: "12px", fontWeight: "600",
                  display: "flex", alignItems: "center", gap: "4px",
                }}
              >
                <MdDoneAll size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: "440px", overflowY: "auto" }}>
            {isLoading && notifications.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#9ca3af" }}>Loading...</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <MdNotifications size={36} color="#d1d5db" />
                <p style={{ color: "#9ca3af", marginTop: "8px", fontSize: "13px" }}>No new notifications</p>
              </div>
            ) : notifications.map((n) => {
              const { icon, color, bg } = getNotificationStyle(n.module, n.type);
              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  style={{
                    padding: "12px 16px", borderBottom: "1px solid #f3f4f6",
                    cursor: "pointer", display: "flex", gap: "12px", alignItems: "flex-start",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    backgroundColor: bg, color,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px", flexWrap: "wrap" }}>
                      <ModuleBadge module={n.module} />
                      <span style={{ fontWeight: "600", fontSize: "12px", color: "#111827" }}>
                        {n.title}
                      </span>
                    </div>
                    <p style={{ fontSize: "11px", color: "#6b7280", margin: 0, lineHeight: 1.4 }}>
                      {n.message}
                    </p>
                    <p style={{ fontSize: "10px", color: "#9ca3af", margin: "3px 0 0 0" }}>
                      {n.created_at}
                    </p>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "#d1d5db", flexShrink: 0, padding: "2px",
                    }}
                    title="Dismiss"
                  >
                    <MdClose size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          {notifications.length > 0 && (
            <div style={{ padding: "10px 16px", borderTop: "1px solid #f3f4f6", textAlign: "center" }}>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", color: "#9ca3af", fontSize: "12px", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}