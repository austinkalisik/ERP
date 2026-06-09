import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { Form } from "react-bootstrap";
import Swal from "sweetalert2";
import { MdInventory, MdLoop } from "react-icons/md";

const createSession = (data) =>
  baseApi.post("/api/aims/stocktake", data).then((r) => r.data);

export default function AIMSStocktakeCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    type:       "cyclic",
    count_date: new Date().toISOString().split("T")[0],
    location:   "",
    category:   "",
    notes:      "",
  });

  const { mutate, isLoading } = useMutation({
    mutationFn: createSession,
    onSuccess: (res) => {
      Swal.fire({
        icon: "success",
        title: "Session Created!",
        text: `Stocktake ${res.data.reference} is ready for counting.`,
        confirmButtonColor: "#3b82f6",
        timer: 2000,
        showConfirmButton: false,
      }).then(() => navigate(`/aims/stocktake/${res.data.id}`));
    },
    onError: (err) => {
      Swal.fire({
        icon: "error",
        title: "Creation Failed",
        text: err.response?.data?.message || "Failed to create stocktake session.",
        confirmButtonColor: "#3b82f6",
      });
    },
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.count_date) {
      Swal.fire({ icon: "warning", title: "Required", text: "Please select a count date.", confirmButtonColor: "#3b82f6" });
      return;
    }
    mutate(form);
  };

  const typeOptions = [
    {
      val:  "cyclic",
      label: "Cyclic / Spot Count",
      desc:  "Count a specific category or location",
      icon:  <MdLoop size={28} color="#0369a1" />,
      bg:    "#e0f2fe",
      activeBorder: "#3b82f6",
      activeBg: "#eff6ff",
    },
    {
      val:  "full",
      label: "Full Stocktake",
      desc:  "Count all items in inventory",
      icon:  <MdInventory size={28} color="#5b21b6" />,
      bg:    "#ede9fe",
      activeBorder: "#7c3aed",
      activeBg: "#f5f3ff",
    },
  ];

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h1 style={{ fontWeight: "700", fontSize: "clamp(20px,5vw,26px)", marginBottom: 2 }}>New Stocktake Session</h1>
            <p className="text-muted mb-0" style={{ fontSize: "13px" }}>Define the scope and start a stock count</p>
          </div>
          <button
            className="btn btn-outline-secondary"
            style={{ borderRadius: "8px", fontSize: "13px" }}
            onClick={() => navigate("/aims/stocktake")}
          >
            Back
          </button>
        </div>

        <Form onSubmit={handleSubmit}>
          <div className="row g-4">

            {/* LEFT — Count Type */}
            <div className="col-12 col-lg-5">
              <div className="card shadow-sm h-100" style={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                <div className="card-header" style={{ background: "#2c3e50", color: "#fff", borderRadius: "12px 12px 0 0", padding: "14px 20px" }}>
                  <h6 className="mb-0" style={{ fontWeight: "600" }}>Count Type</h6>
                </div>
                <div className="card-body p-4">
                  <div className="d-flex flex-column gap-3">
                    {typeOptions.map((opt) => (
                      <div
                        key={opt.val}
                        onClick={() => setForm((f) => ({ ...f, type: opt.val }))}
                        style={{
                          cursor: "pointer",
                          borderRadius: "10px",
                          padding: "18px 20px",
                          border: `2px solid ${form.type === opt.val ? opt.activeBorder : "#e5e7eb"}`,
                          background: form.type === opt.val ? opt.activeBg : "#fff",
                          transition: "all 0.15s",
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                        }}
                      >
                        <div style={{
                          width: 52, height: 52, borderRadius: "12px",
                          backgroundColor: opt.bg,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          {opt.icon}
                        </div>
                        <div>
                          <div style={{
                            fontWeight: "700", fontSize: "15px",
                            color: form.type === opt.val ? opt.activeBorder : "#111"
                          }}>
                            {opt.label}
                          </div>
                          <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>{opt.desc}</div>
                        </div>
                        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: "50%",
                            border: `2px solid ${form.type === opt.val ? opt.activeBorder : "#d1d5db"}`,
                            background: form.type === opt.val ? opt.activeBorder : "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {form.type === opt.val && (
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Info banner */}
                  <div style={{
                    marginTop: "20px", borderRadius: "8px", padding: "12px 14px",
                    background: form.type === "full" ? "#f5f3ff" : "#eff6ff",
                    border: `1px solid ${form.type === "full" ? "#ddd6fe" : "#bfdbfe"}`,
                    fontSize: "12px",
                    color: form.type === "full" ? "#5b21b6" : "#1d4ed8",
                  }}>
                    {form.type === "full"
                      ? "⚠️ A full stocktake will snapshot ALL active items in inventory regardless of location or category."
                      : "💡 A cyclic count lets you target a specific location or category — useful for partial audits."}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — Session Details */}
            <div className="col-12 col-lg-7">
              <div className="card shadow-sm h-100" style={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                <div className="card-header" style={{ background: "#2c3e50", color: "#fff", borderRadius: "12px 12px 0 0", padding: "14px 20px" }}>
                  <h6 className="mb-0" style={{ fontWeight: "600" }}>Session Details</h6>
                </div>
                <div className="card-body p-4">
                  <div className="row g-3">

                    <div className="col-12 col-md-6">
                      <Form.Label style={{ fontWeight: "600", fontSize: "13px" }}>
                        Count Date <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="date"
                        value={form.count_date}
                        onChange={set("count_date")}
                        required
                        style={{ borderRadius: "8px", fontSize: "13px" }}
                      />
                    </div>

                    {form.type === "cyclic" && (
                      <>
                        <div className="col-12 col-md-6">
                          <Form.Label style={{ fontWeight: "600", fontSize: "13px" }}>
                            Location{" "}
                            <span style={{ fontWeight: "400", color: "#9ca3af", fontSize: "12px" }}>(optional)</span>
                          </Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="e.g. Warehouse A, Store Room"
                            value={form.location}
                            onChange={set("location")}
                            style={{ borderRadius: "8px", fontSize: "13px" }}
                          />
                        </div>

                        <div className="col-12 col-md-6">
                          <Form.Label style={{ fontWeight: "600", fontSize: "13px" }}>
                            Category{" "}
                            <span style={{ fontWeight: "400", color: "#9ca3af", fontSize: "12px" }}>(optional)</span>
                          </Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="e.g. Spare Parts, Consumables"
                            value={form.category}
                            onChange={set("category")}
                            style={{ borderRadius: "8px", fontSize: "13px" }}
                          />
                          <Form.Text className="text-muted" style={{ fontSize: "11px" }}>
                            Leave blank to include all categories.
                          </Form.Text>
                        </div>
                      </>
                    )}

                    <div className="col-12">
                      <Form.Label style={{ fontWeight: "600", fontSize: "13px" }}>
                        Notes{" "}
                        <span style={{ fontWeight: "400", color: "#9ca3af", fontSize: "12px" }}>(optional)</span>
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        placeholder="Any instructions or context for counters…"
                        value={form.notes}
                        onChange={set("notes")}
                        style={{ borderRadius: "8px", resize: "vertical", fontSize: "13px" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="card-footer d-flex justify-content-end gap-2"
                  style={{ borderTop: "1px solid #e5e7eb", padding: "16px 24px", background: "transparent", borderRadius: "0 0 12px 12px" }}>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    style={{ borderRadius: "7px", fontSize: "13px" }}
                    onClick={() => navigate("/aims/stocktake")}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                    style={{ borderRadius: "7px", fontWeight: "600", fontSize: "13px", minWidth: 120 }}
                  >
                    {isLoading ? "Creating…" : "Start Count"}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </Form>
      </div>
    </Layout>
  );
}