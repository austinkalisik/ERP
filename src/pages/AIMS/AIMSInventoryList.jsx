import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { useAuth } from "../../contexts/AuthContext";
import { can } from "../../utils/permissions";
import { useSettings } from "../../contexts/SettingsContext";
import Swal from "sweetalert2";

import {
  MdRemoveCircle, MdInventory, MdWarning, MdCheckCircle,
  MdEdit, MdDelete, MdAdd, MdAttachMoney, MdTrendingDown,
} from "react-icons/md";

export default function AIMSInventoryList() {
  const navigate    = useNavigate();
  const { permissions } = useAuth();
  const { formatCurrency } = useSettings();
  const queryClient = useQueryClient();

  const canCreate = can(permissions, "aims.inventory.create");
  const canUpdate = can(permissions, "aims.inventory.update");
  const canDelete = can(permissions, "aims.inventory.delete");

  const [search,         setSearch]         = useState("");
  const [category,       setCategory]       = useState("All");
  const [status,         setStatus]         = useState("All");
  const [itemType,       setItemType]       = useState("All");
  const [selectedItems,  setSelectedItems]  = useState([]);

  // ── Inventory items — cached 2 min ───────────────────────────────────────
  const cacheKey = ["aims_inventory"];
  const { data: inventory = [], isLoading: loading } = useQuery({
    queryKey:  cacheKey,
    queryFn:   () => baseApi.get("/api/aims/items").then((r) => r.data?.data || r.data),
    staleTime: 2 * 60 * 1000,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: cacheKey });

  // Client-side filtering — no network requests when filters change
  const filteredInventory = useMemo(() => {
    let data = [...inventory];
    if (search.trim()) {
      const keyword = search.toLowerCase();
      data = data.filter((i) =>
        i.name?.toLowerCase().includes(keyword)     ||
        i.sku?.toLowerCase().includes(keyword)      ||
        i.category?.toLowerCase().includes(keyword) ||
        i.brand?.toLowerCase().includes(keyword)
      );
    }
    if (category !== "All") data = data.filter((i) => i.category === category);
    if (itemType !== "All") data = data.filter((i) => i.item_type === itemType);
    if (status !== "All") {
      data = data.filter((i) => {
        const current = i.current_stock || 0, min = i.minimum_stock || 0, max = i.maximum_stock || 0;
        if (status === "In Stock")     return current > min;
        if (status === "Low Stock")    return current > 0 && current <= min;
        if (status === "Out of Stock") return current === 0;
        if (status === "Overstock")    return max > 0 && current > max;
        return true;
      });
    }
    return data;
  }, [inventory, search, category, status, itemType]);

  // Reset selection when filter changes
  useEffect(() => { setSelectedItems([]); }, [search, category, status, itemType]);

  const categories = useMemo(() => ["All", ...new Set(inventory.map((i) => i.category).filter(Boolean))], [inventory]);
  const itemTypes  = useMemo(() => ["All", ...new Set(inventory.map((i) => i.item_type).filter(Boolean))], [inventory]);

  const handleStockOut = async (item) => {
    if (!canUpdate) return;
    const { value: quantity } = await Swal.fire({
      title: "Stock Out", input: "number", inputLabel: `Current Stock: ${item.current_stock}`,
      inputPlaceholder: "Enter quantity to deduct", inputAttributes: { min: 1, step: 1 },
      showCancelButton: true, confirmButtonText: "Confirm", confirmButtonColor: "#198754", cancelButtonColor: "#dc3545",
    });
    const qty = Number(quantity);
    if (!qty || qty <= 0) return;
    if (qty > item.current_stock) return Swal.fire("Error", "Quantity exceeds available stock", "error");
    try {
      await baseApi.post("/api/aims/stock-out", { item_id: item.id, quantity: qty, remarks: "Manual stock out" });
      Swal.fire("Success", "Stock deducted successfully", "success");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["aims_kpis"] });
    } catch { Swal.fire("Error", "Failed to stock out item", "error"); }
  };

  const handleStockIn = async (item) => {
    if (!canUpdate) return;
    const { value: quantity } = await Swal.fire({
      title: "Stock In", input: "number", inputLabel: `Current Stock: ${item.current_stock}`,
      inputPlaceholder: "Enter quantity to add", inputAttributes: { min: 1, step: 1 },
      showCancelButton: true, confirmButtonText: "Confirm", confirmButtonColor: "#198754", cancelButtonColor: "#dc3545",
    });
    const qty = Number(quantity);
    if (!qty || qty <= 0) return;
    try {
      await baseApi.post("/api/aims/stock-in", { item_id: item.id, quantity: qty, remarks: "Manual stock in" });
      Swal.fire("Success", "Stock added successfully", "success");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["aims_kpis"] });
    } catch { Swal.fire("Error", "Failed to stock in item", "error"); }
  };

  const handleDelete = async (id) => {
    if (!canDelete) return;
    const confirm = await Swal.fire({
      title: "Delete Item?", text: "This action cannot be undone", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#dc2626", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, delete it",
    });
    if (!confirm.isConfirmed) return;
    await baseApi.delete(`/api/aims/items/${id}`);
    refetch();
    queryClient.invalidateQueries({ queryKey: ["aims_kpis"] });
    Swal.fire({ icon: "success", title: "Deleted", text: "Item removed", timer: 1500, showConfirmButton: false });
  };

  const handleBulkDelete = async () => {
    if (!canDelete) return;
    const confirm = await Swal.fire({
      title: `Delete ${selectedItems.length} Items?`, text: "This action cannot be undone", icon: "warning",
      showCancelButton: true, confirmButtonColor: "#dc2626", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, delete all",
    });
    if (!confirm.isConfirmed) return;
    await Promise.all(selectedItems.map((id) => baseApi.delete(`/api/aims/items/${id}`)));
    setSelectedItems([]);
    refetch();
    queryClient.invalidateQueries({ queryKey: ["aims_kpis"] });
    Swal.fire({ icon: "success", title: "Deleted", text: "Selected items removed", timer: 1500, showConfirmButton: false });
  };

  const toggleSelectAll  = (checked) => setSelectedItems(checked ? filteredInventory.map((i) => i.id) : []);
  const toggleSelectItem = (id) => setSelectedItems((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const totalItems = filteredInventory.length;
  const lowStock   = filteredInventory.filter((i) => { const c = i.current_stock || 0, m = i.minimum_stock || 0; return c > 0 && c <= m; }).length;
  const inStock    = filteredInventory.filter((i) => { const c = i.current_stock || 0, m = i.minimum_stock || 0; return c > m; }).length;
  const outOfStock = filteredInventory.filter((i) => (i.current_stock || 0) === 0).length;
  const totalValue = filteredInventory.reduce((sum, i) => sum + (i.current_stock || 0) * (i.cost_price || 0), 0);

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4 py-4">
        <div className="row mb-4 align-items-center">
          <div className="col">
            <h1 className="fw-bold mb-1">Inventory Management</h1>
            <p className="text-muted mb-0">Monitor stock levels and valuation</p>
          </div>
          {canCreate && (
            <div className="col-auto">
              <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => navigate("/aims/add-item")}>
                <MdAdd /> Add Item
              </button>
            </div>
          )}
        </div>

        <div className="row g-3 mb-4">
          <KPI title="Total Items"  value={totalItems}              icon={<MdInventory />}    color="primary" />
          <KPI title="Low Stock"    value={lowStock}                icon={<MdWarning />}      color="warning" />
          <KPI title="In Stock"     value={inStock}                 icon={<MdCheckCircle />}  color="success" />
          <KPI title="Out of Stock" value={outOfStock}              icon={<MdTrendingDown />} color="danger"  />
          <KPI title="Total Value"  value={formatCurrency(totalValue)} icon={<MdAttachMoney />} color="info" />
        </div>

        <div className="card mb-3 p-3">
          <div className="row g-2">
            <div className="col-md-4">
              <input className="form-control" placeholder="Search name, SKU, brand..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="col-md-2">
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select" value={itemType} onChange={(e) => setItemType(e.target.value)}>
                {itemTypes.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option>All</option><option>In Stock</option><option>Low Stock</option><option>Out of Stock</option><option>Overstock</option>
              </select>
            </div>
          </div>
        </div>

        {canDelete && selectedItems.length > 0 && (
          <div className="alert alert-light d-flex justify-content-between">
            <span>{selectedItems.length} selected</span>
            <button className="btn btn-sm btn-danger" onClick={handleBulkDelete}><MdDelete /> Delete Selected</button>
          </div>
        )}

        <div className="card shadow-sm border-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  {canDelete && (
                    <th>
                      <input type="checkbox" checked={filteredInventory.length > 0 && selectedItems.length === filteredInventory.length} onChange={(e) => toggleSelectAll(e.target.checked)} />
                    </th>
                  )}
                  <th>SKU</th><th>Name</th><th>Type</th><th>Category</th><th>Brand</th>
                  <th>Stock</th><th>Unit</th><th>Cost</th><th>Selling</th>
                  <th>Status</th><th>Location</th><th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={canDelete ? "13" : "12"} className="text-center py-4">Loading...</td></tr>
                ) : filteredInventory.length === 0 ? (
                  <tr><td colSpan={canDelete ? "13" : "12"} className="text-center py-4 text-muted">No items found</td></tr>
                ) : (
                  filteredInventory.map((item) => (
                    <InventoryRow
                      key={item.id} item={item}
                      isSelected={selectedItems.includes(item.id)}
                      onSelect={toggleSelectItem}
                      onEdit={() => navigate(`/aims/items/${item.id}/edit`)}
                      onDelete={handleDelete}
                      handleStockOut={handleStockOut}
                      handleStockIn={handleStockIn}
                      canUpdate={canUpdate} canDelete={canDelete}
                      showCheckbox={canDelete} formatCurrency={formatCurrency}
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

function KPI({ title, value, icon, color }) {
  return (
    <div className="col-md col-sm-6">
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body d-flex gap-3 align-items-center">
          <div className={`text-${color}`} style={{ fontSize: "28px" }}>{icon}</div>
          <div><div className="text-muted small">{title}</div><div className="fw-bold fs-4">{value}</div></div>
        </div>
      </div>
    </div>
  );
}

function InventoryRow({ item, onEdit, onDelete, isSelected, onSelect, handleStockOut, handleStockIn, canUpdate, canDelete, showCheckbox, formatCurrency }) {
  const current = item.current_stock || 0, min = item.minimum_stock || 0, max = item.maximum_stock || 0;
  let status = "In Stock", badge = "success";
  if (current === 0)                 { status = "Out of Stock"; badge = "danger";  }
  else if (current <= min)           { status = "Low Stock";    badge = "warning"; }
  else if (max > 0 && current > max) { status = "Overstock";    badge = "info";    }

  return (
    <tr>
      {showCheckbox && <td><input type="checkbox" checked={isSelected} onChange={() => onSelect(item.id)} /></td>}
      <td>{item.sku}</td>
      <td className="fw-semibold">{item.name}</td>
      <td>{item.item_type}</td>
      <td>{item.category}</td>
      <td>{item.brand || "-"}</td>
      <td>{current}</td>
      <td>{item.unit}</td>
      <td>{formatCurrency(item.cost_price || 0)}</td>
      <td>{formatCurrency(item.selling_price || 0)}</td>
      <td><span className={`badge bg-${badge}`}>{status}</span></td>
      <td>{item.location || "-"}</td>
      <td className="text-center">
        {canUpdate && (
          <>
            <button className="btn btn-sm btn-outline-success me-1" title="Stock In"  onClick={() => handleStockIn(item)}><MdAdd /></button>
            <button className="btn btn-sm btn-outline-danger me-1"  title="Stock Out" onClick={() => handleStockOut(item)} disabled={current === 0}><MdRemoveCircle /></button>
            <button className="btn btn-sm btn-outline-primary me-1" onClick={onEdit}><MdEdit /></button>
          </>
        )}
        {canDelete && <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(item.id)}><MdDelete /></button>}
        {!canUpdate && !canDelete && <span className="text-muted">—</span>}
      </td>
    </tr>
  );
}
