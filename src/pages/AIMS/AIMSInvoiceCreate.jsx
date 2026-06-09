import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";

import { MdAdd, MdDelete } from "react-icons/md";

export default function AIMSInvoiceCreate() {
  
    const { id } = useParams();
    const initialpo= {
    po_number: "",
   
    status:"",
    order_date: "",
    total_amount:0,

    };
    
    const [po, setPo] = useState(initialpo);
    const [items, setItems] = useState([]);
    //const [ponumber, setPonumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState("");
    const [rows, setRows] = useState([]);
    const [paymentTerms, setPaymentTerms] = useState([]);


    const [form, setForm] = useState({
      invoice_number:"",
      request_order_id:"",
      po_number: "",
      supplier_id: "",
      invoice_date: new Date().toISOString().split("T")[0],
      order_date: new Date().toISOString().split("T")[0],
      payment_term_id: "",
    });

    const fetchPaymentTerms = async () => {
      try {
        const res = await baseApi.get(`/api/aims/payment-terms`);
        setPaymentTerms(res.data.data || []);
      } catch (err) {
        console.error("Failed to load payment terms", err);
      }
    };

  useEffect(() => {
    fetchPaymentTerms();
  }, []); 

  

 /*    const fetchOrder = async () => {
    try {
      const res = await baseApi.get(`/api/aims/request-orders/1`);
      setPo(res.data.data);

        setItems(res.data.data.items.map(i => ({
          request_order_item_id: i.item_id,
          quantity: 0,
          unit_price: i.unit_cost
        })))

    } catch (err) {
      console.error("Failed to load invoice", err);
    } finally {
      //setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, []); */


/*   useEffect(() => {
    baseApi.get(`/api/request-orders/${id}`) 
      baseApi.get(`/api/aims/request-orders/1`)
      .then(res => {
        setPo(res.data.data);


        setItems(res.data.data.items.map(i => ({
          request_order_item_id: i.item_id,
          quantity: 0,
          unit_price: i.unit_cost
        }))
    
    );

       
      });

     
  }, []); */

 /*  const handleSubmit = async () => {
    await baseApi.post('/api/aims/invoices', {
      request_order_id: 1,
      invoice_number: "INV-001",
      po_number:"PO-2026-2220",
      supplier_id:1,
      total_amount:100,
      status:"pending",
      invoice_date: new Date().toISOString().split("T")[0],
      items,
    });
  }; */

/* ===============================
     SUBMIT
  =============================== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rows.length === 0) {
      return Swal.fire("Error", "Add at least one item", "error");
    }

      try {

           // Compute totals
            const subtotal_amount = rows.reduce(
              (sum, r) => sum + r.quantity * r.unit_price,
              0
            );
            const tax_amount = rows.reduce((sum, r) => sum + (r.tax || 0), 0);
            const total_amount = subtotal_amount + tax_amount;

         const response =  await baseApi.post("/api/aims/invoices", {
              ...form,
              subtotal_amount,
              tax_amount,
              total_amount,
              items: rows.map(r => ({
                request_order_item_id: r.item_id,
                description: r.name,
                quantity: r.quantity,
                unit_price: r.unit_price,
                tax: r.tax || 0,
                subtotal: (r.quantity * r.unit_price) + (r.tax || 0),
              })),
            });

          

          Swal.fire({
              icon: "success",
              title: "Invoice Created",
              timer: 2000,
              showConfirmButton: false,
            });

 
            
      } catch (err) {

        Swal.fire("Error", err.response?.data?.message , "error");
      }
  };

    /* ===============================
     TOTAL
  =============================== */
  const totalAmount = rows.reduce(
    (sum, r) => sum + r.quantity * r.unit_price + (r.tax || 0),
  0
  );


    /* ===============================
     VERIFY PO
  =============================== */
  const verifyPO = async () => {
    if (!form.po_number.trim()) {

        return Swal.fire("Error", "Please enter a PO number.", "error");
 
    }

    setVerifying(true);
    setError("");
    setPo(initialpo);
   
  

    try {
        const res = await baseApi.get(`/api/aims/request-orders/verify/${form.po_number}`);

    setPo(res.data);

    setForm((prev) => ({
      ...prev,
      request_order_id: res.data.id,
      supplier_id: res.data.supplier_id,
    }));

    const poItems = res.data.items.map(i => ({
      id: i.item_id,
      item_id: i.item_id,
      name: i.name,
      po_quantity: i.po_quantity,
      remaining_qty: i.remaining_qty, // <-- NEW
      quantity: i.remaining_qty,       // default quantity for invoice
      unit_price: i.unit_price || 0,
    }));

    setItems(poItems);

    // Populate invoice rows with remaining quantity
    setRows(poItems.map(item => ({
      item_id: item.item_id,
      name: item.name,
      quantity: item.remaining_qty,   // default to remaining
      unit_price: item.unit_price || 0,
      remaining_qty: item.remaining_qty, // keep track in row
    })));

    } catch (err) {

      return Swal.fire("Error",  err.response?.data?.message || "PO not found or already invoiced.", "error");
       
    } finally {
      setVerifying(false);
    }
  };

    /* ===============================
     ROW HANDLERS
  =============================== */
/*   const addRow = () => {
    setRows((prev) => [
      ...prev,
      { item_id: "", quantity: 1, unit_price: 0 },
    ]);
  }; */


   const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index, field, value) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };



/*   if (!po) return <div>Loading...</div>; */

  return (
  <Layout>
    <div className="container-fluid px-3 px-md-4">
      
      {/* PAGE HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">Create Invoice</h2>
          <small className="text-muted">Generate invoice from Purchase Order</small>
        </div>
      </div>

      {/* 🔍 SEARCH PO */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label fw-semibold">PO Number</label>
              <input
                className="form-control"
                placeholder="Enter PO Number..."
                value={form.po_number}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    po_number: e.target.value,
                  }))
                }
              />
            </div>

            <div className="col-md-2">
              <button
                className="btn btn-primary w-100"
                onClick={verifyPO}
              >
                🔍 Find PO
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger mt-3 py-2">
              {error}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit}>

        {/* 📦 PO DETAILS */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-light fw-semibold">
            Purchase Order Details
          </div>

          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <small className="text-muted">PO Number</small>
                <div className="fw-semibold">{po.po_number || "-"}</div>
              </div>

              <div className="col-md-3">
                <small className="text-muted">Supplier</small>
                <div className="fw-semibold">
                  {po.supplier?.name || "-"}
                </div>
              </div>

              <div className="col-md-3">
                <small className="text-muted">Order Date</small>
                <div>{po.order_date || "-"}</div>
              </div>

              <div className="col-md-3">
                <small className="text-muted">PO Total</small>
                <div className="fw-bold text-primary">
                  ₱ {Number(po.total_amount || 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🧾 INVOICE INFO */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-light fw-semibold">
            Invoice Information
          </div>

          <div className="card-body row g-3">
            <div className="col-md-4">
              <label className="form-label">Invoice Number</label>
              <input
                className="form-control"
                placeholder="INV-XXXX"
                value={form.invoice_number}
                    onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    invoice_number: e.target.value,
                  }))
                }
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Invoice Date</label>
              <input
                type="date"
                className="form-control"
                value={form.invoice_date}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    invoice_date: e.target.value,
                  }))
                }
              />
            </div>

          {/* Payment Term for due date */}
             <div className="col-md-4">
                <label className="form-label">Payment Term</label>
                <select
                  className="form-select"
                  value={form.payment_term_id}

                onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                payment_term_id: e.target.value,
                              }))
                            }

                >
                  <option value="">Select Term</option>
                  {paymentTerms.map(term => (
                    <option key={term.id} value={term.id}>{term.name}</option>
                  ))}
                </select>
            </div>


          <div className="col-md-4">
          <label className="form-label">Remarks</label>
          <input
            type="text"
            className="form-control"
            value={form.remarks}
            onChange={(e) =>
              setForm(prev => ({ ...prev, remarks: e.target.value }))
            }
          />
        </div>
            
          </div>


        </div>

        {/* 📋 ITEMS */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header d-flex align-items-center bg-light">
            <span className="fw-semibold">Invoice Items</span>

           {/*  <button
              type="button"
              className="btn btn-sm btn-primary ms-auto"
              onClick={addRow}
            >
              <MdAdd className="me-1" />
              Add Item
            </button> */}
          </div>

          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="table-light">
                <tr>
              <th>Item</th>
              <th width="120">Qty</th>
              <th width="120">Remaining</th> {/* New */}
              <th width="150">Unit Price</th>
              <th width="120">Tax</th> {/* New */}
              <th width="150">Total</th>
              <th width="80"></th>
                </tr>
              </thead>

             <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      No items yet. Click <b>Add Item</b>.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, i) => (
                    <tr key={i}>
                      <td>{row.name}</td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          max={row.remaining_qty}  // prevent over-invoicing
                          className="form-control"
                          value={row.quantity}
                          onChange={(e) => updateRow(i, "quantity", Number(e.target.value))}
                        />
                      </td>
                      <td>{row.remaining_qty}</td> {/* display remaining */}
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={row.unit_price}
                          onChange={(e) => updateRow(i, "unit_price", Number(e.target.value))}
                        />
                      </td>
                          <td>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={row.tax || 0}
                            onChange={(e) =>
                              updateRow(i, "tax", Number(e.target.value))
                            }
                          />
                        </td>
                      <td className="fw-semibold">
                        ₱ {(row.quantity * row.unit_price).toFixed(2)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeRow(i)}
                        >
                          <MdDelete />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 💰 SUMMARY */}
        <div className="card shadow-sm border-0">
          <div className="card-body d-flex justify-content-between align-items-center">
            <div>
              <div className="text-muted">Total Amount</div>
              <h4 className="fw-bold text-success mb-0">
                ₱ {totalAmount.toFixed(2)}
              </h4>
            </div>

            <button type="submit" className="btn btn-success px-4">
              ✅ Create Invoice
            </button>
          </div>
        </div>

      </form>
    </div>
  </Layout>
);
}
