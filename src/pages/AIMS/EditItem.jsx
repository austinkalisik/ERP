import Layout from "../../components/layouts/DashboardLayout";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MdSave } from "react-icons/md";
import Swal from "sweetalert2";
import baseApi from "../../api/baseApi";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../utils/permissions";

export default function EditItem() {
  const navigate    = useNavigate();
  const { id }      = useParams();
  const { permissions } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!can(permissions, "aims.inventory.update")) navigate("/", { replace: true });
  }, [permissions, navigate]);

  // ── Single item — cached 5 min per ID ────────────────────────────────────
  const { data: item, isLoading: loading } = useQuery({
    queryKey:  ["aims_item", id],
    queryFn:   () => baseApi.get(`/api/aims/items/${id}`).then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
    enabled:   !!id,
    onError:   () => {
      Swal.fire("Error", "Failed to load item details", "error");
      navigate("/aims/inventory");
    },
  });

  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (!item || formData) return;
    setFormData({
      item_type:        item.item_type        || "Inventory Item",
      status:           item.status           || "Active",
      location:         item.location         || "Main Warehouse",
      name:             item.name             || "",
      sku:              item.sku              || "",
      category:         item.category         || "",
      brand:            item.brand            || "",
      unit:             item.unit             || "",
      cost_price:       item.cost_price       || "",
      selling_price:    item.selling_price    || "",
      valuation_method: item.valuation_method || "FIFO",
      minimum_stock:    item.minimum_stock    ?? 0,
      maximum_stock:    item.maximum_stock    ?? 0,
      reorder_quantity: item.reorder_quantity ?? 0,
      notes:            item.notes            || "",
    });
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await baseApi.put(`/api/aims/items/${id}`, {
        ...formData,
        cost_price:       Number(formData.cost_price),
        selling_price:    Number(formData.selling_price),
        minimum_stock:    Number(formData.minimum_stock),
        maximum_stock:    Number(formData.maximum_stock),
        reorder_quantity: Number(formData.reorder_quantity),
      });
      queryClient.invalidateQueries({ queryKey: ["aims_item",    id] });
      queryClient.invalidateQueries({ queryKey: ["aims_inventory"]   });
      queryClient.invalidateQueries({ queryKey: ["aims_kpis"]        });
      await Swal.fire({ icon: "success", title: "Item Updated", text: "Inventory item has been updated successfully." });
      navigate("/aims/inventory");
    } catch (err) {
      Swal.fire("Update Failed", err.response?.data?.message || "Please check input values.", "error");
    }
  };

  const inputStyle   = { height: "48px", borderRadius: "8px", fontSize: "14px" };
  const labelStyle   = { fontWeight: 600, fontSize: "13px", marginBottom: "8px", color: "#2c3e50" };
  const sectionTitle = { fontWeight: 700, fontSize: "16px", marginBottom: "16px", color: "#1a252f", display: "flex", alignItems: "center", gap: "8px" };

  if (loading || !formData) return <Layout><div className="text-center py-5">Loading item...</div></Layout>;

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4 py-4">
        <div className="row mb-4 align-items-center">
          <div className="col">
            <h1 className="fw-bold mb-2" style={{ fontSize: "28px" }}>Edit Inventory Item</h1>
            <p className="text-muted mb-0" style={{ fontSize: "14px" }}>Update item details and stock configuration</p>
          </div>
          <div className="col-auto">
            <button className="btn btn-outline-danger" onClick={() => navigate("/aims/inventory")}>Close</button>
          </div>
        </div>

        <div className="card shadow-sm border-0" style={{ borderRadius: "12px" }}>
          <div className="card-body p-4 p-md-5">
            <form className="row g-4" onSubmit={handleSubmit}>

              <div className="col-12"><div style={sectionTitle}>Item Classification</div></div>
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

              <div className="col-12 mt-5"><div style={sectionTitle}>Basic Information</div></div>
              <div className="col-md-8">
                <label style={labelStyle}>Item Name</label>
                <input name="name" value={formData.name} onChange={handleChange} className="form-control" style={inputStyle} />
              </div>
              <div className="col-md-4">
                <label style={labelStyle}>SKU</label>
                <input name="sku" value={formData.sku} disabled className="form-control bg-light" style={inputStyle} />
              </div>
              <div className="col-md-4">
                <label style={labelStyle}>Category</label>
                <input name="category" value={formData.category} onChange={handleChange} className="form-control" style={inputStyle} />
              </div>
              <div className="col-md-4">
                <label style={labelStyle}>Unit</label>
                <input name="unit" value={formData.unit} onChange={handleChange} className="form-control" style={inputStyle} />
              </div>
              <div className="col-md-4">
                <label style={labelStyle}>Brand</label>
                <input name="brand" value={formData.brand} onChange={handleChange} className="form-control" style={inputStyle} />
              </div>

              <div className="col-12 mt-5"><div style={sectionTitle}>Pricing & Valuation</div></div>
              <div className="col-md-4">
                <label style={labelStyle}>Cost Price</label>
                <input type="number" step="0.01" min="0" name="cost_price" value={formData.cost_price} onChange={handleChange} className="form-control" style={inputStyle} />
              </div>
              <div className="col-md-4">
                <label style={labelStyle}>Selling Price</label>
                <input type="number" step="0.01" min="0" name="selling_price" value={formData.selling_price} onChange={handleChange} className="form-control" style={inputStyle} />
              </div>
              <div className="col-md-4">
                <label style={labelStyle}>Valuation Method</label>
                <select name="valuation_method" value={formData.valuation_method} onChange={handleChange} className="form-select" style={inputStyle}>
                  <option>FIFO</option><option>LIFO</option><option>Weighted Average</option>
                </select>
              </div>

              <div className="col-12 mt-5"><div style={sectionTitle}>Stock Control</div></div>
              <div className="col-md-4">
                <label style={labelStyle}>Minimum Stock</label>
                <input type="number" min="0" name="minimum_stock" value={formData.minimum_stock} onChange={handleChange} className="form-control" style={inputStyle} />
              </div>
              <div className="col-md-4">
                <label style={labelStyle}>Maximum Stock</label>
                <input type="number" min="0" name="maximum_stock" value={formData.maximum_stock} onChange={handleChange} className="form-control" style={inputStyle} />
              </div>
              <div className="col-md-4">
                <label style={labelStyle}>Reorder Quantity</label>
                <input type="number" min="0" name="reorder_quantity" value={formData.reorder_quantity} onChange={handleChange} className="form-control" style={inputStyle} />
              </div>

              <div className="col-12 mt-5"><div style={sectionTitle}>Additional Notes</div></div>
              <div className="col-12">
                <textarea name="notes" value={formData.notes} onChange={handleChange} className="form-control" rows="4" style={{ borderRadius: "8px", fontSize: "14px" }} />
              </div>

              <div className="col-12 d-flex justify-content-end gap-3 pt-4 mt-4 border-top">
                <button type="button" className="btn btn-danger" onClick={() => navigate("/aims/inventory")}>Cancel</button>
                <button type="submit" className="btn btn-primary"><MdSave /> Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
