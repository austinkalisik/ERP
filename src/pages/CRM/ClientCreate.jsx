import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { MdArrowBack, MdSave, MdPerson, MdEmail, MdPhone, MdBusiness, MdNotes } from "react-icons/md";

export default function ClientCreate() {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const [form,   setForm]   = useState({ name: "", contact_person: "", email: "", phone: "", address: "", tin_number: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Client name is required.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email address.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSaving(true);
    try {
      const res = await baseApi.post("/api/crm/clients", form);
      queryClient.invalidateQueries(["crm_clients"]);
      queryClient.invalidateQueries(["crm_stats"]);
      navigate(`/crm/clients/${res.data.id}`);
    } catch (err) {
      const serverErrors = err.response?.data?.errors || {};
      const mapped = {};
      Object.keys(serverErrors).forEach((k) => { mapped[k] = serverErrors[k][0]; });
      setErrors(Object.keys(mapped).length ? mapped : { general: "Failed to create client." });
    } finally { setSaving(false); }
  };

  const field = (key) => ({
    value:    form[key],
    onChange: (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setErrors((er) => ({ ...er, [key]: undefined })); },
  });

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">

        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              style={{ borderRadius: "8px" }}
              onClick={() => navigate("/crm/clients")}
            >
              <MdArrowBack size={16} /> Back
            </button>
            <div>
              <h1 style={{ fontWeight: "700", fontSize: "clamp(18px,4vw,24px)", margin: 0 }}>New Client</h1>
              <p className="text-muted mb-0" style={{ fontSize: "13px" }}>Add a new client to the CRM</p>
            </div>
          </div>
          <button
            className="btn btn-sm d-flex align-items-center gap-1"
            style={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: "8px", fontWeight: "600" }}
            disabled={saving}
            onClick={handleSubmit}
          >
            <MdSave size={16} /> {saving ? "Saving..." : "Save Client"}
          </button>
        </div>

        {errors.general && (
          <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: "13px", borderRadius: "8px" }}>
            {errors.general}
          </div>
        )}

        <div className="row g-4">

          {/* LEFT — Basic Info */}
          <div className="col-12 col-lg-8">
            <div className="card shadow-sm" style={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              <div className="card-header" style={{ background: "#2c3e50", color: "#fff", borderRadius: "12px 12px 0 0", padding: "14px 20px" }}>
                <h6 className="mb-0" style={{ fontWeight: "600" }}>Client Information</h6>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">

                  <div className="col-12">
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px", display: "block" }}>
                      Client / Company Name <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? "is-invalid" : ""}`}
                      placeholder="e.g. PNG Highlands Mining Ltd"
                      style={{ borderRadius: "8px", fontSize: "13px" }}
                      {...field("name")}
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </div>

                  <div className="col-12 col-md-6">
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px", display: "block" }}>
                      <MdPerson size={13} className="me-1" />Contact Person
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. John Kila"
                      style={{ borderRadius: "8px", fontSize: "13px" }}
                      {...field("contact_person")}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px", display: "block" }}>
                      <MdPhone size={13} className="me-1" />Phone
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. +675 7000 0000"
                      style={{ borderRadius: "8px", fontSize: "13px" }}
                      {...field("phone")}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px", display: "block" }}>
                      <MdEmail size={13} className="me-1" />Email
                    </label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? "is-invalid" : ""}`}
                      placeholder="e.g. info@company.com.pg"
                      style={{ borderRadius: "8px", fontSize: "13px" }}
                      {...field("email")}
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>

                  <div className="col-12 col-md-6">
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px", display: "block" }}>
                      TIN Number
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Papua New Guinea TIN"
                      style={{ borderRadius: "8px", fontSize: "13px" }}
                      {...field("tin_number")}
                    />
                  </div>

                  <div className="col-12">
                    <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px", display: "block" }}>
                      <MdBusiness size={13} className="me-1" />Address
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Lot 12, Waigani Drive, NCD"
                      style={{ borderRadius: "8px", fontSize: "13px" }}
                      {...field("address")}
                    />
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Notes + Actions */}
          <div className="col-12 col-lg-4">
            <div className="card shadow-sm mb-3" style={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              <div className="card-header" style={{ background: "#2c3e50", color: "#fff", borderRadius: "12px 12px 0 0", padding: "14px 20px" }}>
                <h6 className="mb-0" style={{ fontWeight: "600" }}>
                  <MdNotes size={15} className="me-1" />Notes
                </h6>
              </div>
              <div className="card-body p-4">
                <textarea
                  className="form-control"
                  rows={6}
                  placeholder="Any additional notes about this client..."
                  style={{ borderRadius: "8px", fontSize: "13px", resize: "vertical" }}
                  {...field("notes")}
                />
              </div>
            </div>

            {/* Quick tips */}
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "14px 16px" }}>
              <p style={{ fontSize: "12px", fontWeight: "700", color: "#1d4ed8", margin: "0 0 6px 0" }}>💡 Tips</p>
              <ul style={{ fontSize: "12px", color: "#1e40af", margin: 0, paddingLeft: "16px", lineHeight: "1.8" }}>
                <li>Only the client name is required</li>
                <li>You can add subscriptions after saving</li>
                <li>TIN is used for invoicing</li>
              </ul>
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="d-flex justify-content-end gap-2 mt-4">
          <button
            className="btn btn-outline-secondary"
            style={{ borderRadius: "8px", fontSize: "13px" }}
            onClick={() => navigate("/crm/clients")}
          >
            Cancel
          </button>
          <button
            className="btn d-flex align-items-center gap-1"
            style={{ backgroundColor: "#6366f1", color: "#fff", borderRadius: "8px", fontWeight: "600", fontSize: "13px" }}
            disabled={saving}
            onClick={handleSubmit}
          >
            <MdSave size={16} /> {saving ? "Saving..." : "Save Client"}
          </button>
        </div>

      </div>
    </Layout>
  );
}