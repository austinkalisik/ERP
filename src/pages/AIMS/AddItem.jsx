import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../utils/permissions";
import { useSettings } from "../../contexts/SettingsContext";
import { MdSave, MdInfo } from "react-icons/md";
import SearchableSelect from "../../components/SearchableSelect";

export default function AddItem() {
  const navigate     = useNavigate();
  const { permissions } = useAuth();
  const { settings } = useSettings();
  const queryClient  = useQueryClient();
  const currency     = settings.currency || "PGK";

  useEffect(() => {
    if (!can(permissions, "aims.inventory.create")) navigate("/", { replace: true });
  }, [permissions, navigate]);

  // ── Suppliers — cached 5 min, shared with AIMSRequestOrderCreate ─────────
  const { data: suppliersRaw = [] } = useQuery({
    queryKey:  ["aims_suppliers"],
    queryFn:   () => baseApi.get("/api/aims/suppliers").then((r) => r.data?.data ?? r.data),
    staleTime: 5 * 60 * 1000,
  });
  const suppliers = Array.isArray(suppliersRaw) ? suppliersRaw : [];
  const supplierOptions = suppliers.map((s) => ({ value: String(s.id), label: s.name }));

  const [formData, setFormData] = useState({
    item_type: "Inventory Item", status: "Active", location: "Main Warehouse",
    name: "", sku: "", barcode: "", category: "", brand: "", unit: "",
    supplier_id: "", lead_time: "", preferred_purchase_qty: "",
    cost_price: "", selling_price: "", valuation_method: "FIFO",
    opening_stock: 0, minimum_stock: 0, maximum_stock: 0, reorder_quantity: 0, notes: "",
  });

  const [loading,      setLoading]      = useState(false);
  const [errors,       setErrors]       = useState({});
  const [profitMargin, setProfitMargin] = useState(0);

  useEffect(() => {
    const cost    = parseFloat(formData.cost_price)    || 0;
    const selling = parseFloat(formData.selling_price) || 0;
    setProfitMargin(cost > 0 && selling > 0 ? ((selling - cost) / selling * 100).toFixed(2) : 0);
  }, [formData.cost_price, formData.selling_price]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name     = "Item name is required";
    if (!formData.sku.trim())  newErrors.sku      = "SKU is required";
    if (!formData.category)    newErrors.category = "Category is required";
    if (!formData.unit)        newErrors.unit     = "Unit is required";
    const cost = parseFloat(formData.cost_price), selling = parseFloat(formData.selling_price);
    if (!formData.cost_price    || cost    <= 0) newErrors.cost_price    = "Cost price must be greater than 0";
    if (!formData.selling_price || selling <= 0) newErrors.selling_price = "Selling price must be greater than 0";
    if (cost > 0 && selling > 0 && selling < cost) newErrors.selling_price = "Selling price should be greater than cost price";
    const minStock = parseFloat(formData.minimum_stock), maxStock = parseFloat(formData.maximum_stock);
    if (maxStock > 0 && minStock > maxStock) newErrors.minimum_stock = "Minimum stock cannot exceed maximum stock";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
  };

  const generateSKU = () => {
    const prefix    = formData.category ? formData.category.substring(0, 3).toUpperCase() : "ITM";
    const timestamp = Date.now().toString().slice(-6);
    const random    = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    setFormData((prev) => ({ ...prev, sku: `${prefix}-${timestamp}-${random}` }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      Swal.fire({ icon: "warning", title: "Validation Error", text: "Please correct the highlighted fields.", confirmButtonColor: "#f39c12" });
      return;
    }
    setLoading(true);
    try {
      await baseApi.post("/api/aims/items", {
        ...formData,
        supplier_id:            formData.supplier_id || null,
        lead_time:              formData.lead_time              !== "" ? Number(formData.lead_time)              : null,
        preferred_purchase_qty: formData.preferred_purchase_qty !== "" ? Number(formData.preferred_purchase_qty) : null,
        cost_price:       Number(formData.cost_price),
        selling_price:    Number(formData.selling_price),
        opening_stock:    Number(formData.opening_stock),
        minimum_stock:    Number(formData.minimum_stock),
        maximum_stock:    Number(formData.maximum_stock),
        reorder_quantity: Number(formData.reorder_quantity),
      });
      queryClient.invalidateQueries({ queryKey: ["aims_kpis"] });
      queryClient.invalidateQueries({ queryKey: ["aims_inventory"] });
      await Swal.fire({ icon: "success", title: "Item Added Successfully", text: `${formData.name} has been registered.`, confirmButtonColor: "#28a745" });
      navigate("/aims/inventory");
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed to Save Item", text: err.response?.data?.message || "An error occurred.", confirmButtonColor: "#d33" });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle   = { height: "48px", borderRadius: "8px", fontSize: "14px", border: "1px solid #dee2e6" };
  const labelStyle   = { fontWeight: 600, fontSize: "13px", marginBottom: "8px", color: "#2c3e50" };
  const sectionTitle = { fontWeight: 700, fontSize: "16px", marginBottom: "16px", color: "#1a252f", display: "flex", alignItems: "center", gap: "8px" };
  const errorStyle   = { fontSize: "12px", color: "#dc3545", marginTop: "4px" };
  const numBadge     = { width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" };

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4 py-4">
        <div className="row mb-4 align-items-center">
          <div className="col">
            <h1 className="fw-bold mb-2" style={{ fontSize: "28px", color: "#1a252f" }}>Add New Inventory Item</h1>
            <p className="text-muted mb-0" style={{ fontSize: "14px" }}>Complete the form below to register a new item</p>
          </div>
          <div className="col-auto">
            <button className="btn btn-outline-danger" onClick={() => navigate("/aims")}>Close</button>
          </div>
        </div>

        <div className="card shadow-sm border-0" style={{ borderRadius: "12px" }}>
          <div className="card-body p-4 p-md-5">
            <form className="row g-4" onSubmit={handleSubmit}>

              {/* Section 1 */}
              <div className="col-12"><div style={sectionTitle}><div className="badge bg-primary" style={numBadge}>1</div> Item Classification</div></div>
              <div className="col-md-4">
                <label style={labelStyle}>Item Type</label>
                <select name="item_type" value={formData.item_type} onChange={handleChange} className="form-select" style={inputStyle}>
                  <option>Inventory Item</option><option>Consumable</option><option>Fixed Asset</option><option>Service</option>
                </select>
              </div>
              <div className="col-md-4">
                <label style={labelStyle}>Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="form-select" style={inputStyle}>
                  <option>Active</option><option>Inactive</option><option>Discontinued</option>
                </select>
              </div>
              <div className="col-md-4">
                <label style={labelStyle}>Warehouse Location</label>
                <select name="location" value={formData.location} onChange={handleChange} className="form-select" style={inputStyle}>
                  <option>Main Warehouse</option><option>Secondary Storage</option><option>Showroom</option><option>Transit</option>
                </select>
              </div>

              {/* Section 2 */}
              <div className="col-12 mt-5"><div style={sectionTitle}><div className="badge bg-primary" style={numBadge}>2</div> Basic Information</div></div>
              <div className="col-md-8">
                <label style={labelStyle}>Item Name <span className="text-danger">*</span></label>
                <input name="name" value={formData.name} onChange={handleChange} className={`form-control ${errors?.name ? "is-invalid" : ""}`} style={inputStyle} placeholder="Enter descriptive item name" />
                {errors.name && <div style={errorStyle}>{errors.name}</div>}
              </div>
              <div className="col-md-4">
                <label style={labelStyle}>SKU <span className="text-danger">*</span></label>
                <div className="input-group">
                  <input name="sku" value={formData.sku} onChange={handleChange} className={`form-control ${errors?.sku ? "is-invalid" : ""}`} style={{ ...inputStyle, borderRadius: "8px 0 0 8px" }} placeholder="Auto-generate or enter" />
                  <button className="btn btn-primary" type="button" onClick={generateSKU} style={{ borderRadius: "0 8px 8px 0", height: "48px" }}>Generate</button>
                </div>
                {errors.sku && <div style={errorStyle}>{errors.sku}</div>}
              </div>
              <div className="col-md-4">
                <label style={labelStyle}>Barcode / EAN</label>
                <input name="barcode" value={formData.barcode} onChange={handleChange} className="form-control" style={inputStyle} placeholder="Scan or enter barcode" />
              </div>
              <div className="col-md-4">
                <label style={labelStyle}>Category <span className="text-danger">*</span></label>
                <select name="category" value={formData.category} onChange={handleChange} className={`form-select ${errors.category ? "is-invalid" : ""}`} style={inputStyle}>
                  <option value="">Select Category</option>
                  <option>Spare Parts</option><option>Consumables</option><option>Tools & Equipment</option>
                  <option>Electronics</option><option>Raw Materials</option><option>Finished Goods</option>
                </select>
                {errors.category && <div style={errorStyle}>{errors.category}</div>}
              </div>
              <div className="col-md-2">
                <label style={labelStyle}>Unit <span className="text-danger">*</span></label>
                <select name="unit" value={formData.unit} onChange={handleChange} className={`form-select ${errors.unit ? "is-invalid" : ""}`} style={inputStyle}>
                  <option value="">Select</option>
                  <option>Pieces</option><option>Boxes</option><option>Liters</option>
                  <option>Kilograms</option><option>Meters</option><option>Sets</option>
                </select>
                {errors.unit && <div style={errorStyle}>{errors.unit}</div>}
              </div>
              <div className="col-md-2">
                <label style={labelStyle}>Brand</label>
                <input name="brand" value={formData.brand} onChange={handleChange} className="form-control" style={inputStyle} placeholder="Optional" />
              </div>

              {/* Section 3 */}
              <div className="col-12 mt-5"><div style={sectionTitle}><div className="badge bg-primary" style={numBadge}>3</div> Pricing & Valuation</div></div>
              <div className="col-md-4">
                <label style={labelStyle}>Cost Price <span className="text-danger">*</span></label>
                <div className="input-group">
                  <span className="input-group-text" style={{ borderRadius: "8px 0 0 8px" }}>{currency}</span>
                  <input type="number" step="0.01" min="0" name="cost_price" value={formData.cost_price} onChange={handleChange} className={`form-control ${errors?.cost_price ? "is-invalid" : ""}`} style={{ ...inputStyle, borderLeft: "none", borderRadius: "0 8px 8px 0" }} placeholder="0.00" />
                </div>
                {errors.cost_price && <div style={errorStyle}>{errors.cost_price}</div>}
              </div>
              <div className="col-md-4">
                <label style={labelStyle}>Selling Price <span className="text-danger">*</span></label>
                <div className="input-group">
                  <span className="input-group-text" style={{ borderRadius: "8px 0 0 8px" }}>{currency}</span>
                  <input type="number" step="0.01" min="0" name="selling_price" value={formData.selling_price} onChange={handleChange} className={`form-control ${errors?.selling_price ? "is-invalid" : ""}`} style={{ ...inputStyle, borderLeft: "none", borderRadius: "0 8px 8px 0" }} placeholder="0.00" />
                </div>
                {errors.selling_price && <div style={errorStyle}>{errors.selling_price}</div>}
              </div>
              <div className="col-md-4">
                <label style={labelStyle}>Profit Margin</label>
                <div className="form-control d-flex align-items-center justify-content-center fw-bold" style={{ ...inputStyle, backgroundColor: profitMargin > 0 ? "#d4edda" : "#f8f9fa", color: profitMargin > 0 ? "#155724" : "#6c757d", border: profitMargin > 0 ? "1px solid #c3e6cb" : "1px solid #dee2e6" }}>
                  {profitMargin}%
                </div>
              </div>
              <div className="col-md-4">
                <label style={labelStyle}>Valuation Method</label>
                <select name="valuation_method" value={formData.valuation_method} onChange={handleChange} className="form-select" style={inputStyle}>
                  <option>FIFO</option><option>LIFO</option><option>Weighted Average</option>
                </select>
              </div>

              {/* Section 4 */}
              <div className="col-12 mt-5"><div style={sectionTitle}><div className="badge bg-primary" style={numBadge}>4</div> Stock Control & Thresholds</div></div>
              <div className="col-md-3">
                <label style={labelStyle}>Opening Stock <span className="text-danger">*</span></label>
                <small className="text-muted d-block">Creates an automatic stock-in record</small>
                <input type="number" min="0" name="opening_stock" value={formData.opening_stock} onChange={handleChange} className="form-control" style={inputStyle} placeholder="0" />
              </div>
              <div className="col-md-3">
                <label style={labelStyle}>Minimum Stock Level</label>
                <input type="number" min="0" name="minimum_stock" value={formData.minimum_stock} onChange={handleChange} className={`form-control ${errors?.minimum_stock ? "is-invalid" : ""}`} style={inputStyle} placeholder="0" />
                {errors.minimum_stock && <div style={errorStyle}>{errors.minimum_stock}</div>}
              </div>
              <div className="col-md-3">
                <label style={labelStyle}>Maximum Stock Level</label>
                <input type="number" min="0" name="maximum_stock" value={formData.maximum_stock} onChange={handleChange} className="form-control" style={inputStyle} placeholder="0" />
              </div>
              <div className="col-md-3">
                <label style={labelStyle}>Reorder Quantity</label>
                <input type="number" min="0" name="reorder_quantity" value={formData.reorder_quantity} onChange={handleChange} className="form-control" style={inputStyle} placeholder="0" />
              </div>
              <div className="col-12">
                <div className="alert alert-info d-flex align-items-start gap-2" style={{ borderRadius: "8px", backgroundColor: "#e7f3ff", border: "1px solid #b3d9ff" }}>
                  <MdInfo size={20} style={{ marginTop: "2px", color: "#0066cc" }} />
                  <div style={{ fontSize: "13px", color: "#004085" }}>
                    <strong>Stock Thresholds:</strong> Set minimum stock to trigger low stock alerts. Maximum stock helps prevent overstocking.
                  </div>
                </div>
              </div>

              {/* Section 5 */}
              <div className="col-12 mt-5"><div style={sectionTitle}><div className="badge bg-primary" style={numBadge}>5</div> Supplier & Procurement (Optional)</div></div>
              <div className="col-md-4">
                <label style={labelStyle}>Preferred Supplier</label>
                {/* SearchableSelect — supplier list can grow significantly */}
                <div style={{ height: "48px", display: "flex", alignItems: "center" }}>
                  <SearchableSelect
                    options={supplierOptions}
                    value={formData.supplier_id}
                    onChange={(v) => setFormData((p) => ({ ...p, supplier_id: v }))}
                    placeholder={suppliers.length === 0 ? "No suppliers available" : "Search supplier..."}
                    disabled={suppliers.length === 0}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <label style={labelStyle}>Lead Time (Days)</label>
                <input type="number" min="0" name="lead_time" value={formData.lead_time} onChange={handleChange} className="form-control" style={inputStyle} placeholder="0" />
              </div>
              <div className="col-md-4">
                <label style={labelStyle}>Preferred Purchase Quantity</label>
                <input type="number" min="0" name="preferred_purchase_qty" value={formData.preferred_purchase_qty} onChange={handleChange} className="form-control" style={inputStyle} placeholder="0" />
              </div>

              {/* Section 6 */}
              <div className="col-12 mt-5"><div style={sectionTitle}><div className="badge bg-primary" style={numBadge}>6</div> Additional Notes</div></div>
              <div className="col-12">
                <label style={labelStyle}>Internal Notes & Remarks</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} className="form-control" rows="4" style={{ borderRadius: "8px", fontSize: "14px" }} placeholder="Add any additional information about this item" />
              </div>

              <div className="col-12 d-flex justify-content-end gap-3 pt-4 mt-4 border-top">
                <button type="button" className="btn btn-danger" onClick={() => navigate("/aims")} disabled={loading}>Cancel</button>
                <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={loading} style={{ borderRadius: "8px", padding: "12px 32px" }}>
                  {loading ? (<><span className="spinner-border spinner-border-sm" />{" "}Saving...</>) : (<><MdSave size={18} /> Save Item</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}