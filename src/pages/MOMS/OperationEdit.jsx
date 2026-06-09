import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { MdArrowBack, MdSave } from "react-icons/md";
import Swal from "sweetalert2";

const STATUS_OPTIONS = ["In Progress", "Completed", "Pending Approval", "Approved", "Cancelled"];

export default function OperationEdit() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Single operation — cached 2 min per ID ────────────────────────────────
  const { data: rawData, isLoading: loading } = useQuery({
    queryKey:  ["moms_operation", id],
    queryFn:   () => baseApi.get(`/api/moms/operations/${id}`).then((r) => r.data?.data || r.data),
    staleTime: 2 * 60 * 1000,
    enabled:   !!id,
    onError:   () => Swal.fire("Error", "Failed to load operation.", "error"),
  });

  const operation = rawData || null;

  // Pre-fill status once data arrives
  useEffect(() => {
    if (operation && !status) setStatus(operation.status || "");
  }, [operation]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await baseApi.put(`/api/moms/operations/${id}`, { status });
      queryClient.invalidateQueries({ queryKey: ["moms_operation", id] });
      // Also refresh daily ops list if it's cached
      queryClient.invalidateQueries({ queryKey: ["moms_daily_ops"] });
      Swal.fire({ icon: "success", title: "Updated", text: "Operation status updated successfully.", timer: 1500, showConfirmButton: false })
        .then(() => navigate("/moms/operations/daily-ops"));
    } catch (error) {
      Swal.fire("Error", "Failed to update operation.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Layout><div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}><div className="spinner-border text-primary" role="status" /></div></Layout>;
  }

  if (!operation) {
    return (
      <Layout>
        <div className="container-fluid px-4 py-5 text-center">
          <p className="text-muted">Operation not found.</p>
          <button className="btn btn-primary mt-2" onClick={() => navigate("/moms/operations/daily-ops")}>Back to Daily Ops</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        {/* Header */}
        <div className="row mb-4 align-items-center">
          <div className="col">
            <button className="btn btn-link p-0 mb-2 text-muted d-inline-flex align-items-center gap-1" style={{ fontSize: "14px", textDecoration: "none" }} onClick={() => navigate("/moms/operations/daily-ops")}>
              <MdArrowBack size={16} /> Back to Daily Ops
            </button>
            <h1 style={{ fontWeight: "bold", fontSize: "clamp(18px, 4vw, 26px)", marginBottom: "4px" }}>Edit Operation #{operation.id}</h1>
            <p className="text-muted mb-0" style={{ fontSize: "14px" }}>{operation.machine} &mdash; {operation.operator}</p>
          </div>
        </div>

        <div className="row">
          <div className="col-12 col-lg-6">
            <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-body p-4">
                <h5 style={{ fontWeight: "700", marginBottom: "24px", fontSize: "16px" }}>Update Status</h5>

                {/* Read-only info */}
                <div className="mb-4 p-3" style={{ backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                  <div className="row g-3">
                    <div className="col-6">
                      <p className="text-muted mb-1" style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>Operator</p>
                      <p className="mb-0" style={{ fontSize: "14px", fontWeight: "500" }}>{operation.operator}</p>
                    </div>
                    <div className="col-6">
                      <p className="text-muted mb-1" style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>Machine</p>
                      <p className="mb-0" style={{ fontSize: "14px", fontWeight: "500", color: "#3b82f6" }}>{operation.machine}</p>
                    </div>
                    <div className="col-6">
                      <p className="text-muted mb-1" style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>Date</p>
                      <p className="mb-0" style={{ fontSize: "14px", fontWeight: "500" }}>{new Date(operation.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                    </div>
                    <div className="col-6">
                      <p className="text-muted mb-1" style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>Duration</p>
                      <p className="mb-0" style={{ fontSize: "14px", fontWeight: "500" }}>{operation.duration}</p>
                    </div>
                  </div>
                </div>

                {/* Status field */}
                <div className="mb-4">
                  <label className="form-label" style={{ fontWeight: "600", fontSize: "14px" }}>Status <span className="text-danger">*</span></label>
                  <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)} style={{ height: "44px", borderRadius: "8px", fontSize: "14px" }}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Actions */}
                <div className="d-flex gap-2">
                  <button className="btn btn-primary" style={{ borderRadius: "8px", height: "42px", paddingInline: "24px", fontSize: "14px", fontWeight: "500" }} onClick={handleSave} disabled={saving}>
                    <MdSave size={16} className="me-2" />{saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button className="btn btn-outline-secondary" style={{ borderRadius: "8px", height: "42px", paddingInline: "24px", fontSize: "14px" }} onClick={() => navigate("/moms/operations/daily-ops")} disabled={saving}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}