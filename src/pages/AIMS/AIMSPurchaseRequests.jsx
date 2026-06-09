import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../utils/permissions";
import { MdSearch, MdAdd, MdVisibility } from "react-icons/md";

export default function AIMSPurchaseRequests() {
  const navigate     = useNavigate();
  const { permissions } = useAuth();

  const canCreate  = can(permissions, "aims.purchase_orders.create");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  // ── Purchase requests — cached 2 min ─────────────────────────────────────
  const { data: raw = [], isLoading: loading } = useQuery({
    queryKey:  ["aims_purchase_requests"],
    queryFn:   () => baseApi.get("/api/aims/purchase-requests").then((r) => {
      const data = Array.isArray(r.data) ? r.data : [];
      return data.map((req) => {
        const firstItem = req.items?.[0];
        return {
          id:           req.id,
          pr_number:    req.pr_number,
          item_name:    firstItem?.item?.name || "—",
          quantity:     firstItem?.quantity   || 0,
          request_date: req.request_date,
          requested:    req.requester?.name   || "—",
          status:       req.status,
          has_po:       req.request_orders?.length > 0,
        };
      });
    }),
    staleTime: 2 * 60 * 1000,
  });

  // Client-side filter — no network requests when typing/filtering
  const filteredRequests = useMemo(() => {
    let data = raw;
    if (search.trim()) {
      const keyword = search.toLowerCase();
      data = data.filter((r) =>
        r.pr_number?.toLowerCase().includes(keyword) ||
        r.item_name?.toLowerCase().includes(keyword)
      );
    }
    if (status !== "All") data = data.filter((r) => r.status === status);
    return data;
  }, [raw, search, status]);

  const getStatusBadgeClass = (s) => {
    switch (s?.toLowerCase()) {
      case "pending":  return "bg-warning text-dark";
      case "approved": return "bg-success";
      case "rejected": return "bg-danger";
      default:         return "bg-secondary";
    }
  };

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="row mb-3 align-items-center">
          <div className="col">
            <h1 className="fw-bold">Purchase Requests</h1>
            <p className="text-muted mb-0">Track and manage inventory purchase requests</p>
          </div>
          <div className="col-auto">
            <button className="btn btn-outline-danger" onClick={() => navigate("/aims")}>Close</button>
          </div>
        </div>

        <div className="card shadow-sm mb-3">
          <div className="card-body">
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-4">
                <div className="input-group">
                  <span className="input-group-text bg-white"><MdSearch /></span>
                  <input className="form-control" placeholder="Search by PR number or item" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="col-6 col-md-3">
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="All">Status: All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              {canCreate && (
                <div className="col-6 col-md-5 text-end">
                  <button className="btn btn-primary" onClick={() => navigate("/aims/purchase-requests/create")}>
                    <MdAdd className="me-1" /> Create Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>PR Number</th><th>Item Name</th><th>Quantity</th>
                  <th>Request Date</th><th>Requested By</th><th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="text-center py-4">Loading purchase requests...</td></tr>
                ) : filteredRequests.length === 0 ? (
                  <tr><td colSpan="7" className="text-center text-muted py-4">No purchase requests found</td></tr>
                ) : (
                  filteredRequests.map((pr) => (
                    <tr key={pr.id}>
                      <td className="fw-semibold">{pr.pr_number}</td>
                      <td>{pr.item_name}</td>
                      <td>{pr.quantity}</td>
                      <td>{pr.request_date}</td>
                      <td>{pr.requested}</td>
                      <td>
                        <span className={`badge rounded-pill ${getStatusBadgeClass(pr.status)}`}>{pr.status}</span>
                      </td>
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-1">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/aims/purchase-requests/${pr.id}`)}>
                            <MdVisibility />
                          </button>
                          {pr.status === "approved" && !pr.has_po && canCreate && (
                            <button className="btn btn-sm btn-outline-success" onClick={() => navigate(`/aims/request-orders/create?pr_id=${pr.id}`)}>
                              Generate PO
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
