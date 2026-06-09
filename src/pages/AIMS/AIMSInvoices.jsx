import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";

import {
  MdSearch,
  MdAdd,
  MdVisibility,
} from "react-icons/md";

export default function AIMSRInvoices() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // FILTER STATES
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");



  /* ==========================================================
     FETCH INVOICES
  ========================================================== */
  const fetchInvoices = async () => {
    try {
      const res = await baseApi.get("/api/aims/invoices");

      const normalized = (res.data.data || []).map((o) => ({
        ...o,
        supplier:
          typeof o.supplier === "object" ? o.supplier?.name : o.supplier,
      }));

      setInvoices(normalized);
      setFilteredInvoices(normalized);
    } catch (err) {
      console.error("Failed to load request orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  /* ==========================================================
     AUTO FILTERING
  ========================================================== */
  useEffect(() => {
    let data = [...invoices];

    if (search.trim() !== "") {
      const keyword = search.toLowerCase();
      data = data.filter(
        (o) =>
          o.invoice_number?.toLowerCase().includes(keyword) ||
          o.supplier?.toLowerCase().includes(keyword)
      );
    }

    if (status !== "All") {
      data = data.filter((o) => o.status === status);
    }

    setFilteredInvoices(data);
  }, [search, status, invoices]);


  const handleApprove = async (id) => {
     await baseApi.post(`/api/aims/invoices/${id}/approve`);
   
    fetchInvoices();
  };

  const handleCancel  = async (id) => {
      await baseApi.put(`/api/aims/invoices/${id}/cancel`);

    fetchInvoices();
  };

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">

        {/* TITLE */}
        <div className="row mb-3 align-items-center">
          <div className="col">
            <h1 className="fw-bold">Invoices</h1>
            <p className="text-muted mb-0">
              Manage and track invoices
            </p>
          </div>

          <div className="col-auto">
            <button
              className="btn btn-outline-danger"
              onClick={() => navigate("/aims")}
            >
              Close
            </button>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="card shadow-sm mb-3">
          <div className="card-body">
            <div className="row g-3 align-items-center">

              <div className="col-12 col-md-4">
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <MdSearch />
                  </span>
                  <input
                    className="form-control"
                    placeholder="Search by Invoice number or supplier"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-6 col-md-3">
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="All">Status: All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="col-6 col-md-5 text-end">
                <button
                  className="btn btn-primary"
                 onClick={() => navigate("/aims/invoices/create")}
                >
                  <MdAdd className="me-1" />
                  Create Invoice
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Invoice Number</th>
                  <th>Status</th>
                  <th>Total Amount</th>
                  <th className="text-center" style={{ width: "160px" }}>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      Loading request orders...
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      No request orders found
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <InvoiceRow
                      key={invoice.id}
                
                      {...invoice}
                      onView={() =>
                        navigate(`/aims/invoices/${invoice.id}`)
                      }
                      onApprove={() => handleApprove(invoice.id)}
                       onCancel={() => handleCancel(invoice.id)}
                    />
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

/* ==========================================================
   TABLE ROW
========================================================== */
function InvoiceRow({
    po_number,
    supplier,
    invoice_number,
    status,
    total_amount,
    onView,
    onApprove,
   onCancel,
}) {
  let badge = "secondary";
  if (status === "approved") badge = "success";
  if (status === "pending") badge = "warning";
  if (status === "cancelled") badge = "danger";

  return (
    <tr>
      <td className="fw-semibold">{po_number}</td>
      {<td>{typeof supplier === "object" ? supplier?.name : supplier}</td>}
      <td>{invoice_number}</td>
      <td>
        <span className={`badge rounded-pill bg-${badge}`}>
          {status}
        </span>
      </td>
      <td>{Number(total_amount).toFixed(2)}</td>
      <td className="text-center">
        <div className="d-flex justify-content-center gap-1">
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={onView}
          >
            <MdVisibility />
          </button>
            {status === "pending" && (
              <>
                <button
                  className="btn btn-sm btn-outline-success"
                  onClick={onApprove}
                >
                  Approve
                </button>

                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={onCancel}
                >
                  Cancel
                </button>
              </>
            )}
        </div>
      </td>
    </tr>
  );
}
