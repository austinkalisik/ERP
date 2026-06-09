import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../utils/permissions";
import { useSettings } from "../../contexts/SettingsContext";
import { MdSearch, MdAdd, MdVisibility } from "react-icons/md";

export default function AIMSSalesOrders() {
  const navigate               = useNavigate();
  const { permissions }        = useAuth();
  const { formatCurrency, formatDate } = useSettings(); // ✅ use formatDate from settings
  const queryClient            = useQueryClient();

  const canCreate  = can(permissions, "aims.inventory.create");
  const canApprove = can(permissions, "aims.purchase_orders.approve");

  useEffect(() => {
    if (!can(permissions, "aims.purchase_orders.approve")) navigate("/", { replace: true });
  }, [permissions, navigate]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const cacheKey = ["aims_sales_orders"];
  const { data: raw = [], isLoading: loading } = useQuery({
    queryKey: cacheKey,
    queryFn:  () => baseApi.get("/api/aims/sales-orders").then((r) =>
      (r.data?.data || []).map((o) => ({
        ...o,
        customer: typeof o.customer === "object" ? o.customer?.name : o.customer,
      }))
    ),
    staleTime: 2 * 60 * 1000,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: cacheKey });

  const filteredOrders = useMemo(() => {
    let data = raw;
    if (search.trim()) {
      const keyword = search.toLowerCase();
      data = data.filter((o) =>
        o.so_number?.toLowerCase().includes(keyword) ||
        (typeof o.customer === "string" && o.customer.toLowerCase().includes(keyword))
      );
    }
    if (status !== "All") data = data.filter((o) => o.status === status);
    return data;
  }, [raw, search, status]);

  const handleFulfill = async (orderId) => {
    const confirm = await Swal.fire({
      title: "Fulfill Sales Order?", text: "Fulfilling will automatically stock out all items.",
      icon: "warning", showCancelButton: true, confirmButtonText: "Fulfill", cancelButtonText: "Cancel",
      confirmButtonColor: "#198754", cancelButtonColor: "#dc3545",
    });
    if (!confirm.isConfirmed) return;
    try {
      await baseApi.post(`/api/aims/sales-orders/${orderId}/fulfill`);
      Swal.fire({ icon: "success", title: "Fulfilled", text: "Stock updated successfully.", timer: 1500, showConfirmButton: false });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["aims_inventory"] });
      queryClient.invalidateQueries({ queryKey: ["aims_kpis"] });
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Failed to fulfill sales order", "error");
    }
  };

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="row mb-3 align-items-center">
          <div className="col">
            <h1 className="fw-bold">Sales Orders</h1>
            <p className="text-muted mb-0">Manage and track customer sales orders</p>
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
                  <input className="form-control" placeholder="Search by SO number or customer" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="col-6 col-md-3">
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="All">Status: All</option>
                  <option value="pending">Pending</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              {canCreate && (
                <div className="col-6 col-md-5 text-end">
                  <button className="btn btn-primary" onClick={() => navigate("/aims/setup/sales-order/create")}>
                    <MdAdd className="me-1" /> Create Sales Order
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
                  <th>SO Number</th><th>Customer</th><th>Order Date</th>
                  <th>Status</th><th>Total Amount</th>
                  <th className="text-center" style={{ width: "160px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-4">Loading sales orders...</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan="6" className="text-center text-muted py-4">No sales orders found</td></tr>
                ) : (
                  filteredOrders.map((order) => {
                    let badge = "secondary";
                    if (order.status === "fulfilled") badge = "success";
                    if (order.status === "pending")   badge = "warning";
                    if (order.status === "cancelled") badge = "danger";
                    return (
                      <tr key={order.id}>
                        <td className="fw-semibold">{order.so_number}</td>
                        <td>{typeof order.customer === "object" ? order.customer?.name : order.customer}</td>
                        {/* ✅ use formatDate — respects timezone and date_format from settings */}
                        <td>{formatDate(order.order_date)}</td>
                        <td><span className={`badge rounded-pill bg-${badge}`}>{order.status}</span></td>
                        <td>{formatCurrency(parseFloat(order.total_amount) || 0)}</td>
                        <td className="text-center">
                          <div className="d-flex justify-content-center gap-1">
                            <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/aims/setup/sales-order/${order.id}`)}>
                              <MdVisibility />
                            </button>
                            {order.status === "pending" && canApprove && (
                              <button className="btn btn-sm btn-outline-success" onClick={() => handleFulfill(order.id)}>Fulfill</button>
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
