import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { MdArrowBack, MdEdit } from "react-icons/md";

export default function MachineView() {
  const { id }   = useParams();
  const navigate = useNavigate();

  // ── Single machine — reuses moms_machine cache shared with MachineEdit ───
  // Navigating View → Edit → Save → back to View is instant from cache
  const { data: machine, isLoading: loading } = useQuery({
    queryKey:  ["moms_machine", id],
    queryFn:   () => baseApi.get(`/api/moms/machines/${id}`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    enabled:   !!id,
    onError:   () => {
      alert("Failed to load machine details");
      navigate("/moms/machines");
    },
  });

  if (loading) {
    return <Layout><div className="container-fluid px-4"><div className="text-center py-5">Loading...</div></div></Layout>;
  }

  if (!machine) {
    return <Layout><div className="container-fluid px-4"><div className="text-center py-5">Machine not found</div></div></Layout>;
  }

  const statusBg    = machine.status === "Active" ? "#d1fae5" : machine.status === "Maintenance" ? "#fef3c7" : "#fee2e2";
  const statusColor = machine.status === "Active" ? "#065f46" : machine.status === "Maintenance" ? "#92400e" : "#991b1b";

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <button className="btn btn-link text-decoration-none p-0 mb-2" onClick={() => navigate("/moms/machines")} style={{ color: "#3b82f6", fontSize: "14px" }}>
              <MdArrowBack className="me-1" /> Back to Machines
            </button>
            <h1 style={{ fontWeight: "bold", fontSize: "28px", margin: 0 }}>Machine Details</h1>
          </div>
          <button className="btn btn-primary" onClick={() => navigate(`/moms/machines/${id}/edit`)} style={{ height: "42px", fontSize: "15px", fontWeight: "500", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
            <MdEdit size={20} /> Edit Machine
          </button>
        </div>

        <div className="row">
          <div className="col-lg-8">
            <div className="card shadow-sm mb-4" style={{ borderRadius: "12px" }}>
              <div className="card-header" style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #e9ecef", padding: "20px" }}>
                <h5 style={{ margin: 0, fontWeight: "600" }}>{machine.machine_id}</h5>
              </div>
              <div className="card-body" style={{ padding: "24px" }}>
                <div className="row g-4">
                  {[
                    { label: "Category",      value: machine.category },
                    { label: "Make",          value: machine.make },
                    { label: "Model",         value: machine.model },
                    { label: "Engine Hours",  value: `${machine.engine_hours} hours` },
                    { label: "Fuel Capacity", value: `${machine.fuel_capacity} liters` },
                  ].map((f) => (
                    <div className="col-md-6" key={f.label}>
                      <label style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.label}</label>
                      <p style={{ fontSize: "16px", fontWeight: "500", margin: "8px 0 0" }}>{f.value}</p>
                    </div>
                  ))}
                  <div className="col-md-6">
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</label>
                    <div style={{ marginTop: "8px" }}>
                      <span className="badge" style={{ backgroundColor: statusBg, color: statusColor, padding: "8px 16px", borderRadius: "6px", fontWeight: "500", fontSize: "14px" }}>{machine.status}</span>
                    </div>
                  </div>
                  <div className="col-12">
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>Location</label>
                    <p style={{ fontSize: "16px", fontWeight: "500", margin: "8px 0 0" }}>{machine.location}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-header" style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #e9ecef", padding: "20px" }}>
                <h5 style={{ margin: 0, fontWeight: "600" }}>Quick Stats</h5>
              </div>
              <div className="card-body" style={{ padding: "24px" }}>
                <div className="mb-4">
                  <p style={{ fontSize: "13px", color: "#6b7280", margin: 0, fontWeight: "600" }}>Created</p>
                  <p style={{ fontSize: "14px", margin: "4px 0 0" }}>{new Date(machine.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p style={{ fontSize: "13px", color: "#6b7280", margin: 0, fontWeight: "600" }}>Last Updated</p>
                  <p style={{ fontSize: "14px", margin: "4px 0 0" }}>{new Date(machine.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}