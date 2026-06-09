import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../utils/permissions";
import { useSettings } from "../../contexts/SettingsContext";
import { MdSearch, MdAdd, MdVisibility } from "react-icons/md";

export default function AIMSRequestOrders() {
  const navigate     = useNavigate();
  const { permissions }    = useAuth();
  const { formatCurrency } = useSettings();
  const queryClient  = useQueryClient();

  const canCreate  = can(permissions, "aims.purchase_orders.create");
  const canApprove = can(permissions, "aims.purchase_orders.approve");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  // ── Request orders — cached 2 min ────────────────────────────────────────
  const cacheKey = ["aims_request_orders"];
  const { data: orders = [], isLoading: loading } = useQuery({
    queryKey: cacheKey,
    queryFn:  () => baseApi.get("/api/aims/request-orders").then((r) =>
      (r.data?.data || []).map((o) => ({
        ...o,
        supplier: typeof o.supplier === "object" ? o.supplier?.name : o.supplier,
      }))
    ),
    staleTime: 2 * 60 * 1000,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: cacheKey });

  // Client-side filter — no network requests when typing/filtering
  const filteredOrders = useMemo(() => {
    let data = orders;
    if (search.trim()) {
      const keyword = search.toLowerCase();
      data = data.filter((o) =>
        o.po_number?.toLowerCase().includes(keyword) ||
        (typeof o.supplier === "string" && o.supplier.toLowerCase().includes(keyword))
      );
    }
    if (status !== "All") data = data.filter((o) => o.status === status);
    return data;
  }, [orders, search, status]);

  const handleApprove = async (orderId) => {
    const confirm = await Swal.fire({
      title: "Approve Request Order?", text: "Approving will allow this order to be received into inventory.",
      icon: "warning", showCancelButton: true, confirmButtonText: "Approve", cancelButtonText: "Cancel",
      confirmButtonColor: "#198754", cancelButtonColor: "#dc3545",
    });
    if (!confirm.isConfirmed) return;
    try {
      await baseApi.post(`/api/aims/request-orders/${orderId}/approve`);
      Swal.fire({ icon: "success", title: "Approved", text: "Stock updated successfully.", timer: 1500, showConfirmButton: false });
      refetch();
      // Also invalidate inventory since stock levels changed
      queryClient.invalidateQueries({ queryKey: ["aims_inventory"] });
      queryClient.invalidateQueries({ queryKey: ["aims_kpis"] });
    } catch {
      Swal.fire("Error", "Failed to approve request order", "error");
    }
  };

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="row mb-3 align-items-center">
          <div className="col">
            <h1 className="fw-bold">Request Orders</h1>
            <p className="text-muted mb-0">Manage and track purchase order requests</p>
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
                  <input className="form-control" placeholder="Search by PO number or supplier" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="col-6 col-md-3">
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="All">Status: All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              {canCreate && (
                <div className="col-6 col-md-5 text-end">
                  <button className="btn btn-primary" onClick={() => navigate("/aims/request-orders/create")}>
                    <MdAdd className="me-1" /> Create Order
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
                  <th>PO Number</th><th>Supplier</th><th>Order Date</th>
                  <th>Status</th><th>Total Amount</th>
                  <th className="text-center" style={{ width: "160px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-4">Loading request orders...</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan="6" className="text-center text-muted py-4">No request orders found</td></tr>
                ) : (
                  filteredOrders.map((order) => {
                    let badge = "secondary";
                    if (order.status === "approved")  badge = "success";
                    if (order.status === "pending")   badge = "warning";
                    if (order.status === "cancelled") badge = "danger";
                    return (
                      <tr key={order.id}>
                        <td className="fw-semibold">{order.po_number}</td>
                        <td>{typeof order.supplier === "object" ? order.supplier?.name : order.supplier}</td>
                        <td>{order.order_date}</td>
                        <td><span className={`badge rounded-pill bg-${badge}`}>{order.status}</span></td>
                        <td>{formatCurrency(order.total_amount)}</td>
                        <td className="text-center">
                          <div className="d-flex justify-content-center gap-1">
                            <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/aims/request-orders/${order.id}`)}>
                              <MdVisibility />
                            </button>
                            {order.status === "pending" && canApprove && (
                              <button className="btn btn-sm btn-outline-success" onClick={() => handleApprove(order.id)}>Approve</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
