import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../utils/permissions";
import { useSettings } from "../../contexts/SettingsContext";

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-PH", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true });
};

export default function AIMSSalesOrderView() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { permissions }    = useAuth();
  const { formatCurrency } = useSettings();
  const queryClient = useQueryClient();

  const canApprove = can(permissions, "aims.purchase_orders.approve");

  useEffect(() => {
    if (!can(permissions, "aims.purchase_orders.approve")) navigate("/", { replace: true });
  }, [permissions, navigate]);

  // ── Single sales order — cached 2 min per ID ─────────────────────────────
  const cacheKey = ["aims_sales_order", id];
  const { data: order, isLoading: loading } = useQuery({
    queryKey: cacheKey,
    queryFn:  () => baseApi.get(`/api/aims/sales-orders/${id}`).then((r) => r.data.data),
    staleTime: 2 * 60 * 1000,
    enabled:  !!id,
  });

  const handleFulfill = async () => {
    const confirm = await Swal.fire({
      title: "Fulfill Sales Order?", text: "Fulfilling will automatically stock out all items.",
      icon: "warning", showCancelButton: true, confirmButtonText: "Fulfill", cancelButtonText: "Cancel",
      confirmButtonColor: "#198754", cancelButtonColor: "#dc3545",
    });
    if (!confirm.isConfirmed) return;
    try {
      await baseApi.post(`/api/aims/sales-orders/${order.id}/fulfill`);
      Swal.fire({ icon: "success", title: "Fulfilled", text: "Stock updated successfully.", timer: 1500, showConfirmButton: false });
      // Invalidate related caches
      queryClient.invalidateQueries({ queryKey: ["aims_sales_orders"] });
      queryClient.invalidateQueries({ queryKey: ["aims_inventory"] });
      queryClient.invalidateQueries({ queryKey: ["aims_kpis"] });
      navigate("/aims/setup/sales-order");
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Failed to fulfill sales order", "error");
    }
  };

  const statusBadge = (status) => {
    let badge = "secondary";
    if (status === "fulfilled") badge = "success";
    if (status === "pending")   badge = "warning";
    if (status === "cancelled") badge = "danger";
    return <span className={`badge rounded-pill bg-${badge}`}>{status}</span>;
  };

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="row mb-3 align-items-center">
          <div className="col">
            <h1 className="fw-bold">View Sales Order</h1>
            <p className="text-muted mb-0">Sales Order Details</p>
          </div>
          <div className="col-auto">
            <button className="btn btn-outline-danger" onClick={() => navigate(-1)}>Back</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : !order ? (
          <div className="text-center text-muted py-4">Sales order not found</div>
        ) : (
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-4"><strong>SO Number</strong><div>{order.so_number}</div></div>
                <div className="col-md-4"><strong>Customer</strong><div>{order.customer?.name || order.customer}</div></div>
                <div className="col-md-4"><strong>Status</strong><div>{statusBadge(order.status)}</div></div>
              </div>
              <div className="row mb-3">
                <div className="col-md-4"><strong>Order Date</strong><div>{formatDateTime(order.order_date)}</div></div>
                <div className="col-md-4"><strong>Total Amount</strong><div>{formatCurrency(order.total_amount)}</div></div>
              </div>
              <hr />
              <h6 className="fw-bold mb-3">Items</h6>
              <div className="table-responsive">
                <table className="table table-sm table-bordered align-middle">
                  <thead className="table-light">
                    <tr><th>Item</th><th className="text-center">Quantity</th><th className="text-end">Unit Price</th><th className="text-end">Total</th></tr>
                  </thead>
                  <tbody>
                    {order.items?.map((row) => (
                      <tr key={row.id}>
                        <td>{row.item?.name}</td>
                        <td className="text-center">{row.quantity}</td>
                        <td className="text-end">{formatCurrency(row.unit_price)}</td>
                        <td className="text-end">{formatCurrency(row.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {order.status === "pending" && canApprove && (
                <div className="d-flex justify-content-end mt-3">
                  <button className="btn btn-success" onClick={handleFulfill}>Fulfill Order</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
