import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";

export default function AIMSInvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ==========================================================
     FETCH VIEW INVOICE
  ========================================================== */
  const fetchOrder = async () => {
    try {
      const res = await baseApi.get(`/api/aims/invoices/${id}`);
      setInvoice(res.data.data);
    } catch (err) {
      console.error("Failed to load invoice", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  /* ==========================================================
     APPROVE REQUEST ORDER (NO STOCK IN)
  ========================================================== */
  const handleApprove = async () => {
    const confirm = await Swal.fire({
      title: "Approve Invoice?",
      text: "Approving will allow this invoice to be received into general ledger.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Approve",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#198754",
      cancelButtonColor: "#dc3545",
    });

    if (!confirm.isConfirmed) return;

    try {
      await baseApi.post(`/api/aims/invoices/${invoice.id}/approve`);

      Swal.fire({
        icon: "success",
        title: "Approved",
        text: "Request order approved successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      fetchOrder();
    } catch {
      Swal.fire("Error", "Failed to approve request order", "error");
    }
  };

/* ==========================================================
   POST INVOICE
========================================================== */
const handlePost = async () => {
  const confirm = await Swal.fire({
    title: "Post Invoice?",
    text: "Posting will finalize this invoice in the system.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Post",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#0d6efd",
    cancelButtonColor: "#dc3545",
  });

  if (!confirm.isConfirmed) return;

  try {
    await baseApi.post(`/api/aims/invoices/${invoice.id}/post`);

    Swal.fire({
      icon: "success",
      title: "Posted",
      text: "Invoice posted successfully.",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchOrder(); // Refresh invoice status
  } catch {
    Swal.fire("Error", "Failed to post invoice", "error");
  }
};

  /* ==========================================================
     STATUS BADGE
  ========================================================== */
  const statusBadge = (status) => {
    let badge = "secondary";
    if (status === "approved") badge = "success";
    if (status === "pending") badge = "warning";
    if (status === "cancelled") badge = "danger";
    if (status === "received") badge = "primary";

    return (
      <span className={`badge rounded-pill bg-${badge}`}>
        {status}
      </span>
    );
  };

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">

        {/* HEADER */}
        <div className="row mb-3 align-items-center">
          <div className="col">
            <h1 className="fw-bold">View Invoice </h1>
            <p className="text-muted mb-0">Invoice Details</p>
          </div>

          <div className="col-auto">
            <button
              className="btn btn-outline-danger"
              onClick={() => navigate(-1)}
            >
              Back
            </button>
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : !invoice ? (
          <div className="text-center text-muted py-4">
            Invoice not found
          </div>
        ) : (
          <div className="card shadow-sm">
            <div className="card-body">

              {/* INVOICE INFO */}
              <div className="row mb-3">
                <div className="col-md-4">
                  <strong>PO Number</strong>
                  <div>{invoice.po_number}</div>
                </div>

                <div className="col-md-4">
                  <strong>Supplier</strong>
                  <div>{invoice.supplier?.name || invoice.supplier}</div>
                </div>

                <div className="col-md-4">
                  <strong>Status</strong>
                  <div>{statusBadge(invoice.status)}</div>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <strong>Invoice Create Date</strong>
                  <div>{invoice.created_at}</div>
                </div>

                <div className="col-md-4">
                  <strong>Total Amount</strong>
                  <div>{Number(invoice.total_amount).toFixed(2)}</div>
                </div>
              </div>

              <hr />

              {/* ITEMS */}
              <h6 className="fw-bold mb-3">Items</h6>
              <div className="table-responsive">
                <table className="table table-sm table-bordered align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Item</th>
                      <th className="text-center">Quantity</th>
                      <th className="text-end">Unit Cost</th>
                
                      <th className="text-end">Tax</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.map((row) => (
                      <tr key={row.id}>
                        <td>{row.items_info.name}</td>
                        <td className="text-center">{row.quantity}</td>
                        <td className="text-end">
                          {Number(row.unit_price).toFixed(2)}
                        </td>
                         <td className="text-end">
                          {Number(row.tax).toFixed(2)}
                        </td>
                
                        <td className="text-end">
                          {Number(row.subtotal).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ACTIONS */}
              {invoice.status === "pending" && (
                <div className="d-flex justify-content-end mt-3">
                  <button className="btn btn-success" onClick={handleApprove}  
                  >
                    Approve Invoice
                  </button>
                </div>
              )}

              {invoice.status === "approved" && (
                <div className="d-flex justify-content-end mt-3">
                  <button className="btn btn-primary" onClick={handlePost}
                  
                  >
                    Post
                  </button>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
