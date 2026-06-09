import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { MdArrowBack, MdEdit, MdStar } from "react-icons/md";
import Swal from "sweetalert2";
import { useSettings } from "../../contexts/SettingsContext";

export default function OperatorView() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { formatDate } = useSettings();

  // ── Single operator — reuses moms_operator cache shared with OperatorEdit ─
  // Navigating View → Edit → Save → back to View is instant from cache
  const { data: operator, isLoading: loading } = useQuery({
    queryKey:  ["moms_operator", id],
    queryFn:   () => baseApi.get(`/api/moms/operators/${id}`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    enabled:   !!id,
    onError:   () => {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to load operator details", confirmButtonColor: "#3b82f6" });
      navigate("/moms/operators");
    },
  });

  if (loading) return <Layout><div className="container-fluid px-4"><div className="text-center py-5">Loading...</div></div></Layout>;
  if (!operator) return <Layout><div className="container-fluid px-4"><div className="text-center py-5">Operator not found</div></div></Layout>;

  const statusBg    = operator.status === "Active" ? "#d1fae5" : operator.status === "On Leave" ? "#fef3c7" : "#fee2e2";
  const statusColor = operator.status === "Active" ? "#065f46" : operator.status === "On Leave" ? "#92400e" : "#991b1b";

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <button className="btn btn-link text-decoration-none p-0 mb-2" onClick={() => navigate("/moms/operators")} style={{ color: "#3b82f6", fontSize: "14px" }}>
              <MdArrowBack className="me-1" /> Back to Operators
            </button>
            <h1 style={{ fontWeight: "bold", fontSize: "28px", margin: 0 }}>Operator Details</h1>
          </div>
          <button className="btn btn-primary" onClick={() => navigate(`/moms/operators/${id}/edit`)} style={{ height: "42px", fontSize: "15px", fontWeight: "500", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
            <MdEdit size={20} /> Edit Operator
          </button>
        </div>

        <div className="row">
          {/* Main Info Card */}
          <div className="col-lg-8">
            <div className="card shadow-sm mb-4" style={{ borderRadius: "12px" }}>
              <div className="card-header" style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #e9ecef", padding: "20px" }}>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 style={{ margin: 0, fontWeight: "600" }}>{operator.user_name || `Operator ${operator.id}`}</h5>
                  <span className="badge" style={{ backgroundColor: statusBg, color: statusColor, padding: "8px 16px", borderRadius: "6px", fontWeight: "500", fontSize: "14px" }}>{operator.status}</span>
                </div>
              </div>
              <div className="card-body" style={{ padding: "24px" }}>
                <div className="row g-4">
                  {[
                    { label: "License Number", value: operator.license_number },
                    { label: "License Type",   value: operator.license_type || "N/A" },
                    { label: "License Expiry", value: formatDate(operator.license_expiry) || "N/A" },
                    { label: "Certification",  value: operator.certification || "N/A" },
                    { label: "Total Hours",    value: `${operator.total_hours || 0} hours` },
                  ].map((f) => (
                    <div key={f.label} className="col-md-6">
                      <label style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</label>
                      <p style={{ fontSize: "16px", fontWeight: "500", margin: "8px 0 0" }}>{f.value}</p>
                    </div>
                  ))}
                  <div className="col-md-6">
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Performance Rating</label>
                    <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <MdStar size={20} color="#fbbf24" />
                      <span style={{ fontSize: "16px", fontWeight: "500" }}>{operator.performance_rating ? Number(operator.performance_rating).toFixed(2) : "0.00"} / 5.00</span>
                    </div>
                  </div>
                  {operator.notes && (
                    <div className="col-12">
                      <label style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Notes</label>
                      <p style={{ fontSize: "16px", margin: "8px 0 0", whiteSpace: "pre-wrap", lineHeight: "1.6" }}>{operator.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="col-lg-4">
            <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-header" style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #e9ecef", padding: "20px" }}>
                <h5 style={{ margin: 0, fontWeight: "600" }}>Quick Stats</h5>
              </div>
              <div className="card-body" style={{ padding: "24px" }}>
                <div className="mb-4">
                  <p style={{ fontSize: "13px", color: "#6b7280", margin: 0, fontWeight: "600" }}>Created</p>
                  <p style={{ fontSize: "14px", margin: "4px 0 0" }}>{formatDate(operator.created_at) || "—"}</p>
                </div>
                <div>
                  <p style={{ fontSize: "13px", color: "#6b7280", margin: 0, fontWeight: "600" }}>Last Updated</p>
                  <p style={{ fontSize: "14px", margin: "4px 0 0" }}>{formatDate(operator.updated_at) || "—"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}