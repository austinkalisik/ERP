import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../utils/permissions";
import { useSettings } from "../../contexts/SettingsContext";
import { MdAdd, MdDelete } from "react-icons/md";
import SearchableSelect from "../../components/SearchableSelect";

export default function AIMSRequestOrderCreate() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { permissions }    = useAuth();
  const { formatCurrency } = useSettings();

  useEffect(() => {
    if (!can(permissions, "aims.purchase_orders.create")) {
      Swal.fire({ icon: "error", title: "Access Denied", text: "You don't have permission to create request orders.", confirmButtonColor: "#dc2626" })
        .then(() => navigate("/aims/request-orders"));
    }
  }, [permissions, navigate]);

  const params   = new URLSearchParams(location.search);
  const prId     = params.get("pr_id");
  const isFromPR = !!prId;

  const [form, setForm] = useState({
    po_number:           `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    supplier_id:         "",
    order_date:          new Date().toISOString().split("T")[0],
    purchase_request_id: null,
  });
  const [rows,       setRows]       = useState([]);
  const [prLoading,  setPrLoading]  = useState(!!prId);
  const [submitting, setSubmitting] = useState(false);

  // ── Items — reuses aims_inventory cache ──────────────────────────────────
  const { data: itemsRaw = [] } = useQuery({
    queryKey:  ["aims_inventory"],
    queryFn:   () => baseApi.get("/api/aims/items").then((r) => r.data?.data || r.data || []),
    staleTime: 2 * 60 * 1000,
  });

  // ── Suppliers — reuses aims_suppliers cache shared with AddItem ──────────
  const { data: suppliersRaw = [] } = useQuery({
    queryKey:  ["aims_suppliers"],
    queryFn:   () => baseApi.get("/api/aims/suppliers").then((r) => r.data?.data ?? r.data),
    staleTime: 5 * 60 * 1000,
  });

  const items    = Array.isArray(itemsRaw)    ? itemsRaw    : [];
  const suppliers = Array.isArray(suppliersRaw) ? suppliersRaw : [];

  const itemOptions     = items.map((item) => ({ value: String(item.id), label: item.name }));
  const supplierOptions = suppliers.map((s)  => ({ value: String(s.id),  label: s.name }));

  // Load PR items if navigating from a purchase request
  useEffect(() => {
    if (!prId) return;
    const loadPR = async () => {
      try {
        const res = await baseApi.get(`/api/aims/purchase-requests/${prId}`);
        const pr  = res.data.data;
        setRows(pr.items.map((item) => ({ item_id: item.item_id, quantity: item.quantity, unit_price: 0 })));
        setForm((prev) => ({ ...prev, purchase_request_id: pr.id }));
      } catch {
        Swal.fire("Error", "Failed to load purchase request", "error");
      } finally {
        setPrLoading(false);
      }
    };
    loadPR();
  }, [prId]);

  const addRow    = () => { if (isFromPR) return; setRows((prev) => [...prev, { item_id: "", quantity: 1, unit_price: 0 }]); };
  const removeRow = (index) => { if (isFromPR) return; setRows((prev) => prev.filter((_, i) => i !== index)); };
  const updateRow = (index, field, value) => setRows((prev) => {
    const updated = [...prev]; updated[index][field] = value; return updated;
  });

  const totalAmount = rows.reduce((sum, r) => sum + r.quantity * r.unit_price, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplier_id) return Swal.fire("Error", "Please select a supplier", "error");
    if (rows.length === 0)  return Swal.fire("Error", "Add at least one item", "error");
    setSubmitting(true);
    try {
      await baseApi.post("/api/aims/request-orders", { ...form, items: rows });
      Swal.fire({ icon: "success", title: "Order Created", timer: 1500, showConfirmButton: false });
      navigate("/aims/request-orders");
    } catch {
      Swal.fire("Error", "Failed to create order", "error");
    } finally { setSubmitting(false); }
  };

  if (prLoading) return <Layout><div className="container-fluid p-4 text-center text-muted">Loading data...</div></Layout>;

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <h1 className="fw-bold mb-3">Create Request Order</h1>
        {isFromPR && <div className="alert alert-info">Items auto-generated from Purchase Request. Quantity cannot be modified.</div>}
        <form onSubmit={handleSubmit}>
          <div className="card shadow-sm mb-3">
            <div className="card-body row g-3">
              <div className="col-md-4">
                <label className="form-label">PO Number</label>
                <input className="form-control" value={form.po_number} readOnly />
              </div>
              <div className="col-md-4">
                <label className="form-label">Supplier <span className="text-danger">*</span></label>
                {/* SearchableSelect — supplier list grows over time */}
                <SearchableSelect
                  options={supplierOptions}
                  value={form.supplier_id}
                  onChange={(v) => setForm({ ...form, supplier_id: v })}
                  placeholder="Search supplier..."
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Order Date</label>
                <input type="date" className="form-control" value={form.order_date} onChange={(e) => setForm({ ...form, order_date: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="card shadow-sm mb-3">
            <div className="card-header d-flex align-items-center">
              <span className="fw-semibold">Order Items</span>
              <button type="button" className="btn btn-sm btn-primary ms-auto" onClick={addRow} disabled={isFromPR}>
                <MdAdd className="me-1" /> Add Item
              </button>
            </div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr><th>Item</th><th width="100">Qty</th><th width="150">Unit Price</th><th width="150">Total</th><th width="80"></th></tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan="5" className="text-center text-muted py-4">No items added</td></tr>
                  ) : rows.map((row, i) => (
                    <tr key={i}>
                      <td>
                        {/* SearchableSelect — inventory can have hundreds of items */}
                        <SearchableSelect
                          options={itemOptions}
                          value={String(row.item_id)}
                          onChange={(v) => updateRow(i, "item_id", v)}
                          placeholder="Search item..."
                          disabled={isFromPR}
                          size="sm"
                        />
                      </td>
                      <td>
                        <input type="number" min="1" className="form-control form-control-sm" value={row.quantity} onChange={(e) => updateRow(i, "quantity", Number(e.target.value))} readOnly={isFromPR} />
                      </td>
                      <td>
                        <input type="number" step="0.01" className="form-control form-control-sm" value={row.unit_price} onChange={(e) => updateRow(i, "unit_price", Number(e.target.value))} />
                      </td>
                      <td style={{ fontSize: "14px" }}>{formatCurrency(row.quantity * row.unit_price)}</td>
                      <td>
                        {!isFromPR && (
                          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeRow(i)}><MdDelete /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center">
            <strong>Total: {formatCurrency(totalAmount)}</strong>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Creating..." : "Create Order"}</button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
