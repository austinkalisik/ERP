import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../utils/permissions";
import { useSettings } from "../../contexts/SettingsContext";
import { MdAdd, MdDelete } from "react-icons/md";
import SearchableSelect from "../../components/SearchableSelect";

export default function AIMSSalesOrderCreate() {
  const navigate           = useNavigate();
  const { permissions }    = useAuth();
  const { formatCurrency } = useSettings();
  const queryClient        = useQueryClient();

  useEffect(() => {
    if (!can(permissions, "aims.inventory.create")) {
      Swal.fire({ icon: "error", title: "Access Denied", text: "You don't have permission to create sales orders.", confirmButtonColor: "#dc2626" })
        .then(() => navigate("/aims/setup/sales-order"));
    }
  }, [permissions, navigate]);

  const [form, setForm] = useState({
    so_number:   `SO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    customer_id: "",
    order_date:  new Date().toISOString().split("T")[0],
  });
  const [rows,       setRows]       = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // ── Items — reuses aims_inventory cache ──────────────────────────────────
  const { data: itemsRaw = [], isLoading: loadingItems } = useQuery({
    queryKey:  ["aims_inventory"],
    queryFn:   () => baseApi.get("/api/aims/items").then((r) => {
      const d = r.data?.data || r.data?.items || r.data || [];
      return Array.isArray(d) ? d : [];
    }),
    staleTime: 2 * 60 * 1000,
  });

  // ── Customers — reuses aims_customers cache shared with AIMSCustomers ────
  const { data: customersRaw = [], isLoading: loadingCustomers } = useQuery({
    queryKey:  ["aims_customers"],
    queryFn:   () => baseApi.get("/api/aims/customers").then((r) => {
      const d = r.data?.data || r.data?.customers || r.data || [];
      return Array.isArray(d) ? d : [];
    }),
    staleTime: 5 * 60 * 1000,
  });

  const items     = Array.isArray(itemsRaw)     ? itemsRaw     : [];
  const customers = Array.isArray(customersRaw) ? customersRaw : [];

  const itemOptions     = items.map((item) => ({ value: String(item.id), label: item.name }));
  const customerOptions = customers.map((c)  => ({ value: String(c.id),  label: c.name }));

  const addRow    = () => setRows((prev) => [...prev, { item_id: "", quantity: 1, selling_price: 0 }]);
  const removeRow = (index) => setRows((prev) => prev.filter((_, i) => i !== index));
  const updateRow = (index, field, value) => setRows((prev) => {
    const updated = [...prev]; updated[index][field] = value; return updated;
  });

  const totalAmount = rows.reduce((sum, r) => sum + r.quantity * r.selling_price, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_id) return Swal.fire("Error", "Please select a customer", "error");
    if (rows.length === 0)  return Swal.fire("Error", "Add at least one item", "error");
    setSubmitting(true);
    try {
      await baseApi.post("/api/aims/sales-orders", {
        ...form,
        items: rows.map((row) => ({ item_id: row.item_id, quantity: row.quantity, unit_price: row.selling_price })),
      });

      // Invalidate cache so AIMSSalesOrders shows the new record immediately
      queryClient.invalidateQueries({ queryKey: ["aims_sales_orders"] });

      Swal.fire({ icon: "success", title: "Sales Order Created", timer: 1500, showConfirmButton: false });
      navigate("/aims/setup/sales-order");
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to create sales order", "error");
    } finally { setSubmitting(false); }
  };

  if (loadingItems || loadingCustomers) {
    return <Layout><div className="container-fluid p-4 text-center text-muted">Loading data...</div></Layout>;
  }

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <h1 className="fw-bold mb-3">Create Sales Order</h1>
        <form onSubmit={handleSubmit}>
          <div className="card shadow-sm mb-3">
            <div className="card-body row g-3">
              <div className="col-md-4">
                <label className="form-label">SO Number</label>
                <input className="form-control" value={form.so_number} readOnly />
              </div>
              <div className="col-md-4">
                <label className="form-label">Customer <span className="text-danger">*</span></label>
                <SearchableSelect
                  options={customerOptions}
                  value={form.customer_id}
                  onChange={(v) => setForm({ ...form, customer_id: v })}
                  placeholder="Search customer..."
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
              <button type="button" className="btn btn-sm btn-primary ms-auto" onClick={addRow}>
                <MdAdd className="me-1" /> Add Item
              </button>
            </div>
            <div className="table-responsive">
              <table className="table mb-0">
                <thead className="table-light">
                  <tr><th>Item</th><th width="100">Qty</th><th width="150">Selling Price</th><th width="150">Total</th><th width="80"></th></tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan="5" className="text-center text-muted py-4">No items added. Click "Add Item" to begin.</td></tr>
                  ) : rows.map((row, i) => (
                    <tr key={i}>
                      <td>
                        <SearchableSelect
                          options={itemOptions}
                          value={String(row.item_id)}
                          onChange={(v) => updateRow(i, "item_id", v)}
                          placeholder="Search item..."
                          size="sm"
                        />
                      </td>
                      <td>
                        <input type="number" min="1" className="form-control form-control-sm" value={row.quantity} onChange={(e) => updateRow(i, "quantity", Number(e.target.value))} />
                      </td>
                      <td>
                        <input type="number" step="0.01" className="form-control form-control-sm" value={row.selling_price} onChange={(e) => updateRow(i, "selling_price", Number(e.target.value))} />
                      </td>
                      <td style={{ fontSize: "14px" }}>{formatCurrency(row.quantity * row.selling_price)}</td>
                      <td>
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeRow(i)}><MdDelete /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center">
            <strong>Total: {formatCurrency(totalAmount)}</strong>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-danger" onClick={() => navigate("/aims/setup/sales-order")}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? "Creating..." : "Create Sales Order"}</button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
