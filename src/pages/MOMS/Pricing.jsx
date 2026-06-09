import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { Form } from "react-bootstrap";
import Swal from "sweetalert2";
import { MdLocalGasStation, MdHistory, MdTrendingUp } from "react-icons/md";
import { useSettings } from "../../contexts/SettingsContext";

const getCurrentDateTime = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    const date  = new Date(dateString);
    const h = date.getHours(), m = date.getMinutes();
    if (h === 0 && m === 0) return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return "Invalid Date"; }
};

export default function Pricing() {
  const { formatCurrency } = useSettings();
  const queryClient = useQueryClient();

  const [submitting, setSubmitting] = useState(false);
  const [formData,   setFormData]   = useState({ cost_per_litre: "", effective_date: getCurrentDateTime(), notes: "" });

  // ── Fuel pricing — cached 30 min, shared key with Fuel.jsx ───────────────
  // When Pricing sets a new price and invalidates moms_fuel_price,
  // Fuel.jsx automatically gets the updated price next time it renders
  const pricingCacheKey = ["moms_fuel_price"];
  const { data: pricingData, isLoading: loading } = useQuery({
    queryKey:  pricingCacheKey,
    queryFn:   () => baseApi.get("/api/moms/finance/fuel-pricing").then((r) => r.data),
    staleTime: 30 * 60 * 1000,
  });

  const currentPrice = pricingData?.currentPrice || null;
  const priceHistory = pricingData?.history       || [];

  const handleInputChange = (e) => { const { name, value } = e.target; setFormData((prev) => ({ ...prev, [name]: value })); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await baseApi.post("/api/moms/finance/fuel-pricing", formData);
      setFormData({ cost_per_litre: "", effective_date: getCurrentDateTime(), notes: "" });
      // Invalidate so Fuel.jsx also gets the new price on next render
      queryClient.invalidateQueries({ queryKey: pricingCacheKey });
      Swal.fire({ icon: "success", title: "Price Updated!", text: "Fuel price has been updated successfully.", confirmButtonColor: "#f97316", timer: 2000, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Failed", text: "Could not update fuel price. Please try again.", confirmButtonColor: "#f97316" });
    } finally { setSubmitting(false); }
  };

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="row mb-3 mb-md-4 align-items-center">
          <div className="col">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <MdLocalGasStation size={32} color="#f97316" />
              <div>
                <h1 style={{ fontWeight: "bold", fontSize: "clamp(20px, 5vw, 28px)", margin: 0 }}>Fuel Pricing Management</h1>
                <p className="text-muted mb-0" style={{ fontSize: "14px" }}>Set and track fuel pricing history</p>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-6">
            {/* Current Price */}
            <div className="card shadow-sm mb-4" style={{ borderRadius: "12px" }}>
              <div className="card-body p-4">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <MdTrendingUp size={20} color="#3b82f6" />
                  <h5 style={{ fontWeight: "600", margin: 0 }}>Current Fuel Price</h5>
                </div>
                {loading ? (
                  <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-secondary me-2" />Loading...</div>
                ) : currentPrice ? (
                  <div style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", padding: "24px", borderRadius: "12px", border: "1px solid #bfdbfe" }}>
                    <p className="text-muted mb-2" style={{ fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Cost per Litre</p>
                    <h2 style={{ fontWeight: "800", fontSize: "42px", color: "#2563eb", marginBottom: "12px" }}>{formatCurrency(currentPrice.cost_per_litre)}</h2>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      <p className="mb-1"><strong>Effective:</strong> {formatDate(currentPrice.effective_date)}</p>
                      <p className="mb-0"><strong>Last updated:</strong> {formatDate(currentPrice.last_updated)}</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ backgroundColor: "#f8fafc", padding: "32px", borderRadius: "12px", textAlign: "center", border: "2px dashed #e2e8f0" }}>
                    <MdLocalGasStation size={48} color="#cbd5e1" />
                    <p className="text-muted mb-0 mt-2">No current price set</p>
                  </div>
                )}
              </div>
            </div>

            {/* Set New Price Form */}
            <div className="card shadow-sm mb-4" style={{ borderRadius: "12px" }}>
              <div className="card-body p-4">
                <h5 style={{ fontWeight: "600", marginBottom: "20px" }}>Set New Fuel Price</h5>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: "500", fontSize: "14px" }}>Cost per Litre</Form.Label>
                    <Form.Control type="number" step="0.01" name="cost_per_litre" value={formData.cost_per_litre} onChange={handleInputChange} placeholder="e.g., 2.50" required style={{ fontSize: "15px", padding: "10px 12px" }} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: "500", fontSize: "14px" }}>Effective Date & Time</Form.Label>
                    <Form.Control type="datetime-local" name="effective_date" value={formData.effective_date} onChange={handleInputChange} required style={{ fontSize: "15px", padding: "10px 12px" }} />
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <Form.Label style={{ fontWeight: "500", fontSize: "14px" }}>Notes <span className="text-muted" style={{ fontWeight: "400" }}>(optional)</span></Form.Label>
                    <Form.Control as="textarea" rows={3} name="notes" value={formData.notes} onChange={handleInputChange} placeholder="e.g. Supplier increase due to market conditions" style={{ fontSize: "14px", resize: "none" }} />
                  </Form.Group>
                  <button type="submit" className="btn" disabled={submitting} style={{ borderRadius: "8px", width: "100%", backgroundColor: "#f97316", color: "white", border: "none", fontWeight: "500", padding: "12px", fontSize: "15px" }}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Updating...</> : "Update Fuel Price"}
                  </button>
                </Form>
              </div>
            </div>
          </div>

          {/* Price History */}
          <div className="col-lg-6">
            <div className="card shadow-sm" style={{ borderRadius: "12px", height: "fit-content" }}>
              <div className="card-body p-4">
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <MdHistory size={20} color="#6b7280" />
                  <h5 style={{ fontWeight: "600", margin: 0 }}>Price History</h5>
                </div>
                {loading ? (
                  <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-secondary me-2" />Loading...</div>
                ) : priceHistory.length === 0 ? (
                  <div style={{ backgroundColor: "#f8fafc", padding: "32px", borderRadius: "12px", textAlign: "center", border: "2px dashed #e2e8f0" }}>
                    <MdHistory size={48} color="#cbd5e1" />
                    <p className="text-muted mb-0 mt-2">No price history available</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                        <tr>{["EFFECTIVE DATE","COST/L","NOTES"].map((h) => <th key={h} style={{ padding: "12px", fontWeight: "600", fontSize: "13px", color: "#666" }}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {priceHistory.map((record, index) => (
                          <tr key={index}>
                            <td style={{ padding: "12px", fontSize: "14px" }}>{formatDate(record.effective_date)}</td>
                            <td style={{ padding: "12px", fontSize: "14px", fontWeight: "600", color: "#059669" }}>{formatCurrency(record.cost_per_litre)}</td>
                            <td style={{ padding: "12px", fontSize: "13px", color: "#64748b" }}>{record.notes || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}