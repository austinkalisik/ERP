import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { useSettings } from "../../contexts/SettingsContext";
import { MdArrowBack, MdSave, MdInfo } from "react-icons/md";

const BILLING_CYCLES = ["Monthly", "Quarterly", "Semi-Annual", "Annual"];

const CYCLE_MONTHS = { "Monthly": 1, "Quarterly": 3, "Semi-Annual": 6, "Annual": 12 };

export default function SubscriptionCreate() {
  const navigate       = useNavigate();
  const queryClient    = useQueryClient();
  const [searchParams] = useSearchParams();
  const prefilledClientId = searchParams.get("client_id");
  const { formatCurrency } = useSettings();

  const [form,   setForm]   = useState({
    client_id:     prefilledClientId || "",
    service_id:    "",
    billing_cycle: "Monthly",
    amount:        "",
    start_date:    new Date().toISOString().split("T")[0],
    expiry_date:   "",
    notes:         "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const { data: clients = [] } = useQuery({
    queryKey: ["crm_clients_all"],
    queryFn:  () => baseApi.get("/api/crm/clients?per_page=200").then((r) => r.data.data || []),
    staleTime: 5 * 60 * 1000,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["crm_services"],
    queryFn:  () => baseApi.get("/api/crm/services").then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (!form.start_date || !form.billing_cycle) return;
    const start  = new Date(form.start_date);
    const months = CYCLE_MONTHS[form.billing_cycle] || 1;
    start.setMonth(start.getMonth() + months);
    start.setDate(start.getDate() - 1);
    setForm((f) => ({ ...f, expiry_date: start.toISOString().split("T")[0] }));
  }, [form.start_date, form.billing_cycle]);

  const validate = () => {
    const e = {};
    if (!form.client_id)   e.client_id   = "Client is required.";
    if (!form.service_id)  e.service_id  = "Service is required.";
    if (!form.amount)      e.amount      = "Amount is required.";
    if (!form.start_date)  e.start_date  = "Start date is required.";
    if (!form.expiry_date) e.expiry_date = "Expiry date is required.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSaving(true);
    try {
      const res = await baseApi.post("/api/crm/subscriptions", form);
      queryClient.invalidateQueries(["crm_stats"]);
      queryClient.invalidateQueries(["crm_client", form.client_id]);
      navigate(`/crm/subscriptions/${res.data.id}`);
    } catch (err) {
      const serverErrors = err.response?.data?.errors || {};
      const mapped = {};
      Object.keys(serverErrors).forEach((k) => { mapped[k] = serverErrors[k][0]; });
      setErrors(Object.keys(mapped).length ? mapped : { general: "Failed to create subscription." });
    } finally { setSaving(false); }
  };

  const field = (key) => ({
    value:    form[key],
    onChange: (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setErrors((er) => ({ ...er, [key]: undefined })); },
  });

  const selectedClient  = clients.find((c) => String(c.id) === String(form.client_id));
  const selectedService = services.find((s) => String(s.id) === String(form.service_id));

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">

        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              style={{ borderRadius: "8px" }}
              onClick={() => navigate(-1)}
            >
              <MdArrowBack size={16} /> Back
            </button>
            <div>
              <h1 style={{ fontWeight: "700", fontSize: "clamp(18px,4vw,24px)", margin: 0 }}>New Subscription</h1>
              <p className="text-muted mb-0" style={{ fontSize: "13px" }}>Create a subscription for a client</p>
            </div>
          </div>
          <button
            className="btn d-flex align-items-center gap-1"
            style={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: "8px", fontWeight: "600", fontSize: "13px" }}
            disabled={saving}
            onClick={handleSubmit}
          >
            <MdSave size={16} /> {saving ? "Saving..." : "Save Subscription"}
          </button>
        </div>

        {errors.general && (
          <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: "13px", borderRadius: "8px" }}>
            {errors.general}
          </div>
        )}

        <div className="row g-4">

          {/* LEFT — Main form */}
          <div className="col-12 col-lg-8">
            <div className="card shadow-sm" style={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              <div className="card-header" style={{ background: "#2c3e50", color: "#fff", borderRadius: "12px 12px 0 0", padding: "14px 20px" }}>
                <h6 className="mb-0" style={{ fontWeight: "600" }}>Subscription Details</h6>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">

                  <div className="col-12 col-md-6">
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px", display: "block" }}>
                      Client <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select
                      className={`form-select ${errors.client_id ? "is-invalid" : ""}`}
                      style={{ borderRadius: "8px", fontSize: "13px" }}
                      {...field("client_id")}
                    >
                      <option value="">Select client...</option>
                      {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {errors.client_id && <div className="invalid-feedback">{errors.client_id}</div>}
                  </div>

                  <div className="col-12 col-md-6">
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px", display: "block" }}>
                      Service <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select
                      className={`form-select ${errors.service_id ? "is-invalid" : ""}`}
                      style={{ borderRadius: "8px", fontSize: "13px" }}
                      {...field("service_id")}
                    >
                      <option value="">Select service...</option>
                      {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    {errors.service_id && <div className="invalid-feedback">{errors.service_id}</div>}
                  </div>

                  <div className="col-12 col-md-6">
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px", display: "block" }}>
                      Billing Cycle
                    </label>
                    <select
                      className="form-select"
                      style={{ borderRadius: "8px", fontSize: "13px" }}
                      {...field("billing_cycle")}
                    >
                      {BILLING_CYCLES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px", display: "block" }}>
                      Amount <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="number"
                      className={`form-control ${errors.amount ? "is-invalid" : ""}`}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      style={{ borderRadius: "8px", fontSize: "13px" }}
                      {...field("amount")}
                    />
                    {errors.amount && <div className="invalid-feedback">{errors.amount}</div>}
                  </div>

                  <div className="col-12 col-md-6">
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px", display: "block" }}>
                      Start Date <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="date"
                      className={`form-control ${errors.start_date ? "is-invalid" : ""}`}
                      style={{ borderRadius: "8px", fontSize: "13px" }}
                      {...field("start_date")}
                    />
                    {errors.start_date && <div className="invalid-feedback">{errors.start_date}</div>}
                  </div>

                  <div className="col-12 col-md-6">
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px", display: "block" }}>
                      Expiry Date <span style={{ color: "#ef4444" }}>*</span>
                      <span style={{ fontSize: "10px", color: "#9ca3af", marginLeft: "6px", fontWeight: "400" }}>auto-calculated</span>
                    </label>
                    <input
                      type="date"
                      className={`form-control ${errors.expiry_date ? "is-invalid" : ""}`}
                      style={{ borderRadius: "8px", fontSize: "13px" }}
                      {...field("expiry_date")}
                    />
                    {errors.expiry_date && <div className="invalid-feedback">{errors.expiry_date}</div>}
                  </div>

                  <div className="col-12">
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px", display: "block" }}>
                      Notes
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Any details about this subscription..."
                      style={{ borderRadius: "8px", fontSize: "13px" }}
                      {...field("notes")}
                    />
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Summary preview */}
          <div className="col-12 col-lg-4">

            {/* Summary card */}
            <div className="card shadow-sm mb-3" style={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              <div className="card-header" style={{ background: "#2c3e50", color: "#fff", borderRadius: "12px 12px 0 0", padding: "14px 20px" }}>
                <h6 className="mb-0" style={{ fontWeight: "600" }}>Preview</h6>
              </div>
              <div className="card-body p-4">
                {selectedClient || selectedService || form.amount ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {selectedClient && (
                      <div>
                        <p style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", margin: "0 0 2px 0" }}>Client</p>
                        <p style={{ fontSize: "14px", fontWeight: "700", color: "#111", margin: 0 }}>{selectedClient.name}</p>
                      </div>
                    )}
                    {selectedService && (
                      <div>
                        <p style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", margin: "0 0 2px 0" }}>Service</p>
                        <p style={{ fontSize: "14px", fontWeight: "600", color: "#6366f1", margin: 0 }}>{selectedService.name}</p>
                      </div>
                    )}
                    {form.amount && (
                      <div>
                        <p style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", margin: "0 0 2px 0" }}>Amount</p>
                        <p style={{ fontSize: "22px", fontWeight: "800", color: "#10b981", margin: 0 }}>
                          {formatCurrency(Number(form.amount))}
                          <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: "400" }}> / {form.billing_cycle}</span>
                        </p>
                      </div>
                    )}
                    {form.start_date && form.expiry_date && (
                      <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "10px 12px" }}>
                        <p style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", margin: "0 0 4px 0" }}>Period</p>
                        <p style={{ fontSize: "12px", color: "#374151", margin: 0 }}>
                          {new Date(form.start_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          {" → "}
                          {new Date(form.expiry_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "#9ca3af", textAlign: "center", margin: "20px 0" }}>
                    Fill in the form to see a preview
                  </p>
                )}
              </div>
            </div>

            {/* Tips */}
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "14px 16px" }}>
              <p style={{ fontSize: "12px", fontWeight: "700", color: "#1d4ed8", margin: "0 0 6px 0" }}>
                <MdInfo size={13} className="me-1" />Tips
              </p>
              <ul style={{ fontSize: "12px", color: "#1e40af", margin: 0, paddingLeft: "16px", lineHeight: "1.9" }}>
                <li>Expiry is auto-calculated from start + billing cycle</li>
                <li>You can manually override the expiry date</li>
                <li>Record payments after saving</li>
              </ul>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="d-flex justify-content-end gap-2 mt-4">
          <button
            className="btn btn-outline-secondary"
            style={{ borderRadius: "8px", fontSize: "13px" }}
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button
            className="btn d-flex align-items-center gap-1"
            style={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: "8px", fontWeight: "600", fontSize: "13px" }}
            disabled={saving}
            onClick={handleSubmit}
          >
            <MdSave size={16} /> {saving ? "Saving..." : "Save Subscription"}
          </button>
        </div>

      </div>
    </Layout>
  );
}