import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../utils/permissions";
import { useSettings } from "../../contexts/SettingsContext";
import CurrencyReceiveModal from "./CurrencyReceiveModal";

export default function AIMSRequestOrderView() {
  const { id }             = useParams();
  const navigate           = useNavigate();
  const { permissions }    = useAuth();
  const { formatCurrency } = useSettings();
  const queryClient        = useQueryClient();

  const canApprove = can(permissions, "aims.purchase_orders.approve");

  // ── state ──────────────────────────────────────────────────────────────────
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  // ── fetch ──────────────────────────────────────────────────────────────────
  const cacheKey = ["aims_request_order", id];
  const { data: order, isLoading: loading } = useQuery({
    queryKey: cacheKey,
    queryFn:  () => baseApi.get(`/api/aims/request-orders/${id}`).then((r) => r.data.data),
    staleTime: 2 * 60 * 1000,
    enabled:  !!id,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: cacheKey });

  // ── actions ────────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    const confirm = await Swal.fire({
      title: "Approve Request Order?",
      text: "Approving will allow this order to be received into inventory.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Approve",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#198754",
      cancelButtonColor: "#dc3545",
    });
    if (!confirm.isConfirmed) return;
    try {
      await baseApi.post(`/api/aims/request-orders/${order.id}/approve`);
      Swal.fire({ icon: "success", title: "Approved", text: "Request order approved successfully.", timer: 1500, showConfirmButton: false });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["aims_request_orders"] });
      queryClient.invalidateQueries({ queryKey: ["aims_kpis"] });
    } catch {
      Swal.fire("Error", "Failed to approve request order", "error");
    }
  };

  // Called by CurrencyReceiveModal on success
  const handleReceiveSuccess = () => {
    Swal.fire({ icon: "success", title: "Goods Received", text: "Inventory and stock movements updated.", timer: 1500, showConfirmButton: false });
    queryClient.invalidateQueries({ queryKey: ["aims_request_orders"] });
    queryClient.invalidateQueries({ queryKey: ["aims_inventory"] });
    queryClient.invalidateQueries({ queryKey: ["aims_kpis"] });
    queryClient.invalidateQueries({ queryKey: ["aims_stock_movements"] });
    navigate("/aims/stock-movements");
  };

  // ── helpers ────────────────────────────────────────────────────────────────
  const statusBadge = (status) => {
    const map = {
      approved:  "success",
      pending:   "warning",
      cancelled: "danger",
      received:  "primary",
    };
    return (
      <span className={`badge rounded-pill bg-${map[status] ?? "secondary"}`}>
        {status}
      </span>
    );
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="row mb-3 align-items-center">
          <div className="col">
            <h1 className="fw-bold">View Request Order</h1>
            <p className="text-muted mb-0">Purchase Order Details</p>
          </div>
          <div className="col-auto">
            <button className="btn btn-outline-danger" onClick={() => navigate(-1)}>Back</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-4">Loading…</div>
        ) : !order ? (
          <div className="text-center text-muted py-4">Request order not found</div>
        ) : (
          <div className="card shadow-sm">
            <div className="card-body">

              {/* ── Header info ─────────────────────────────────────────── */}
              <div className="row mb-3">
                <div className="col-md-4">
                  <strong>PO Number</strong>
                  <div>{order.po_number}</div>
                </div>
                <div className="col-md-4">
                  <strong>Supplier</strong>
                  <div>{order.supplier?.name || order.supplier}</div>
                </div>
                <div className="col-md-4">
                  <strong>Status</strong>
                  <div>{statusBadge(order.status)}</div>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <strong>Order Date</strong>
                  <div>{order.order_date}</div>
                </div>
                <div className="col-md-4">
                  <strong>Total Amount</strong>
                  <div>{formatCurrency(order.total_amount)}</div>
                </div>
                {/* Show foreign currency info if this was an overseas order */}
                {order.foreign_currency && (
                  <div className="col-md-4">
                    <strong>Foreign Currency</strong>
                    <div style={{ fontSize: 13 }}>
                      {order.foreign_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {order.foreign_currency}
                      {" "}@ {parseFloat(order.exchange_rate).toFixed(4)}
                      {" "}= <strong>{formatCurrency(order.local_amount)}</strong>
                    </div>
                    {order.currency_note && (
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{order.currency_note}</div>
                    )}
                  </div>
                )}
              </div>

              {order.receive_notes && (
                <div className="mb-3">
                  <strong>Receive Notes</strong>
                  <div style={{ fontSize: 13, color: "#374151" }}>{order.receive_notes}</div>
                </div>
              )}

              <hr />

              {/* ── Items table ─────────────────────────────────────────── */}
              <h6 className="fw-bold mb-3">Items</h6>
              <div className="table-responsive">
                <table className="table table-sm table-bordered align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Item</th>
                      <th className="text-center">Quantity</th>
                      <th className="text-end">Unit Cost</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((row) => (
                      <tr key={row.id}>
                        <td>{row.item?.name}</td>
                        <td className="text-center">{row.quantity}</td>
                        <td className="text-end">{formatCurrency(row.unit_cost)}</td>
                        <td className="text-end">{formatCurrency(row.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Action buttons ──────────────────────────────────────── */}
              {order.status === "pending" && canApprove && (
                <div className="d-flex justify-content-end mt-3">
                  <button className="btn btn-success" onClick={handleApprove}>
                    Approve Order
                  </button>
                </div>
              )}

              {order.status === "approved" && canApprove && (
                <div className="d-flex justify-content-end mt-3">
                  {/* Opens the currency-aware receive modal */}
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowReceiveModal(true)}
                  >
                    Receive Goods
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Currency-aware receive modal ───────────────────────────────────── */}
      <CurrencyReceiveModal
        show={showReceiveModal}
        onHide={() => setShowReceiveModal(false)}
        orderId={id}
        orderTotal={order?.total_amount ?? 0}
        onSuccess={handleReceiveSuccess}
      />
    </Layout>
  );
}
