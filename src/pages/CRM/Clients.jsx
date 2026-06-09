import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../utils/permissions";
import { MdAdd, MdSearch, MdPeople, MdPerson, MdPhone, MdEmail, MdBusiness } from "react-icons/md";

const fetchClients = (page, search) =>
  baseApi.get(`/api/crm/clients?page=${page}&per_page=15&search=${encodeURIComponent(search)}`).then((r) => r.data);

export default function Clients() {
  const navigate = useNavigate();
  const { user, permissions } = useAuth();
  const canManage = can(permissions, "crm.manage") || user?.role === "system_admin";

  const [page,   setPage]   = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey:  ["crm_clients", page, search],
    queryFn:   () => fetchClients(page, search),
    staleTime: 60 * 1000,
    keepPreviousData: true,
  });

  const clients  = data?.data      || [];
  const lastPage = data?.last_page || 1;
  const total    = data?.total     || 0;

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">

        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div>
            <h1 style={{ fontWeight: "bold", fontSize: "clamp(18px, 4vw, 26px)", margin: 0 }}>Clients</h1>
            <p className="text-muted mb-0" style={{ fontSize: "14px" }}>All registered clients and their subscriptions</p>
          </div>
          {canManage && (
            <button
              className="btn btn-sm"
              style={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: "8px", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px" }}
              onClick={() => navigate("/crm/clients/create")}
            >
              <MdAdd size={16} /> New Client
            </button>
          )}
        </div>

        {/* Search */}
        <div className="card shadow-sm mb-3" style={{ borderRadius: "12px" }}>
          <div className="card-body p-3">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-7">
                <div style={{ position: "relative" }}>
                  <MdSearch size={18} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search by name, contact person, email..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    style={{ paddingLeft: "34px", borderRadius: "8px" }}
                  />
                </div>
              </div>
              <div className="col-12 col-md-5 text-md-end">
                <span className="text-muted" style={{ fontSize: "13px" }}>{total} client{total !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Client Cards */}
        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border spinner-border-sm text-secondary" />
            <p className="text-muted mt-2">Loading clients...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
            <div className="card-body text-center py-5">
              <MdPeople size={40} style={{ color: "#d1d5db", marginBottom: "8px" }} />
              <p className="text-muted mb-1">No clients found</p>
              {canManage && (
                <button className="btn btn-sm mt-1" style={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: "8px" }} onClick={() => navigate("/crm/clients/create")}>
                  Add First Client
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="row g-3 mb-3">
              {clients.map((client) => (
                <div key={client.id} className="col-12 col-md-6 col-lg-4">
                  <div
                    className="card shadow-sm h-100"
                    style={{ borderRadius: "12px", cursor: "pointer", transition: "box-shadow 0.2s, transform 0.15s" }}
                    onClick={() => navigate(`/crm/clients/${client.id}`)}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(99,102,241,0.15)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}
                  >
                    <div className="card-body p-4">
                      {/* Client name + initials */}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                        <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontWeight: "700", fontSize: "16px", color: "#6366f1" }}>
                            {client.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: "700", fontSize: "14px", color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</p>
                          {client.contact_person && (
                            <p style={{ margin: 0, fontSize: "12px", color: "#6b7280", display: "flex", alignItems: "center", gap: "4px" }}>
                              <MdPerson size={12} /> {client.contact_person}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Contact info */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "14px" }}>
                        {client.email && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6b7280" }}>
                            <MdEmail size={13} color="#9ca3af" /> {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6b7280" }}>
                            <MdPhone size={13} color="#9ca3af" /> {client.phone}
                          </div>
                        )}
                        {client.address && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#6b7280" }}>
                            <MdBusiness size={13} color="#9ca3af" /> {client.address}
                          </div>
                        )}
                      </div>

                      {/* Subscription count badges */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {client.active_subscriptions > 0 && (
                          <span style={{ backgroundColor: "#dcfce7", color: "#166534", fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "999px" }}>
                            {client.active_subscriptions} active
                          </span>
                        )}
                        {client.expiring_subscriptions > 0 && (
                          <span style={{ backgroundColor: "#fef3c7", color: "#92400e", fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "999px" }}>
                            {client.expiring_subscriptions} expiring
                          </span>
                        )}
                        {client.expired_subscriptions > 0 && (
                          <span style={{ backgroundColor: "#fee2e2", color: "#991b1b", fontSize: "11px", fontWeight: "700", padding: "3px 10px", borderRadius: "999px" }}>
                            {client.expired_subscriptions} expired
                          </span>
                        )}
                        {client.active_subscriptions === 0 && client.expiring_subscriptions === 0 && client.expired_subscriptions === 0 && (
                          <span style={{ backgroundColor: "#f3f4f6", color: "#6b7280", fontSize: "11px", fontWeight: "600", padding: "3px 10px", borderRadius: "999px" }}>
                            No subscriptions
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {lastPage > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-2">
                <button className="btn btn-sm btn-outline-secondary" style={{ borderRadius: "8px" }} disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <span style={{ fontSize: "13px", color: "#6b7280" }}>Page {page} of {lastPage}</span>
                <button className="btn btn-sm btn-outline-secondary" style={{ borderRadius: "8px" }} disabled={page === lastPage} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}