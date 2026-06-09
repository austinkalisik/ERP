import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { Form, Button } from "react-bootstrap";
import { MdArrowBack, MdSave, MdDirectionsCar } from "react-icons/md";
import Swal from "sweetalert2";

const fleetTypes    = ["Excavator", "Dozer", "Dump Truck", "Loader", "Grader", "Crane", "Forklift", "Other"];
const statusOptions = ["Active", "Inactive", "Under Maintenance", "Retired"];

const toDateInput = (val) => {
  if (!val) return "";
  if (typeof val === "string" && val.includes("T")) return val.slice(0, 10);
  return val;
};

export default function FleetEdit() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();

  const [saving,   setSaving]   = useState(false);
  const [formData, setFormData] = useState(null);

  // ── Single fleet — cached 5 min per ID ───────────────────────────────────
  const { data: fleet, isLoading: loading } = useQuery({
    queryKey:  ["moms_fleet", id],
    queryFn:   () => baseApi.get(`/api/moms/fleets/${id}`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    enabled:   !!id,
    onError:   () => {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to load fleet details.", confirmButtonColor: "#3b82f6" });
      navigate("/moms/fleets");
    },
  });

  // Pre-fill form once data arrives
  useEffect(() => {
    if (!fleet || formData) return;
    setFormData({
      fleet_type:          fleet.fleet_type          || "",
      make_brand:          fleet.make_brand          || "",
      model:               fleet.model               || "",
      registration_number: fleet.registration_number || "",
      year_of_manufacture: fleet.year_of_manufacture || new Date().getFullYear(),
      vin:                 fleet.vin                 || "",
      color:               fleet.color               || "",
      purchase_price:      fleet.purchase_price       || "",
      date_of_acquisition: toDateInput(fleet.date_of_acquisition),
      description:         fleet.description         || "",
      status:              fleet.status              || "Active",
      stickers:            fleet.stickers            || "",
    });
  }, [fleet]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await baseApi.put(`/api/moms/fleets/${id}`, formData);
      queryClient.invalidateQueries({ queryKey: ["moms_fleet",  id]  });
      queryClient.invalidateQueries({ queryKey: ["moms_fleets"]      });
      await Swal.fire({ icon: "success", title: "Fleet Updated!", text: "Fleet details have been saved.", confirmButtonColor: "#0ea5e9", timer: 2000, timerProgressBar: true, showConfirmButton: false });
      navigate("/moms/fleets");
    } catch (err) {
      Swal.fire({ icon: "error", title: "Failed to Update", text: err.response?.data?.message || "Failed to update fleet.", confirmButtonColor: "#3b82f6" });
      setSaving(false);
    }
  };

  if (loading || !formData) {
    return <Layout><div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}><div className="spinner-border text-primary" role="status" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="row mb-4 align-items-start">
          <div className="col">
            <button className="btn btn-link p-0 mb-2 text-muted d-inline-flex align-items-center gap-1" style={{ fontSize: "14px", textDecoration: "none" }} onClick={() => navigate("/moms/fleets")}>
              <MdArrowBack size={16} /> Back to Fleets
            </button>
            <div className="d-flex align-items-center gap-3 mt-1">
              <div style={{ width: "48px", height: "48px", backgroundColor: "#0ea5e9", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MdDirectionsCar size={24} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontWeight: "bold", fontSize: "clamp(18px, 4vw, 26px)", marginBottom: "4px" }}>Edit Fleet</h1>
                <p className="text-muted mb-0" style={{ fontSize: "14px" }}>Fleet #{id}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-12 col-lg-9">
            <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
              <div className="card-body p-4">
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontWeight: "500" }}>Fleet Type <span style={{ color: "red" }}>*</span></Form.Label>
                    <Form.Select name="fleet_type" value={formData.fleet_type} onChange={handleInputChange} required>
                      <option value="">-- Select Fleet Type --</option>
                      {fleetTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </Form.Select>
                  </Form.Group>
                  <div className="row">
                    <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Make / Brand <span style={{ color: "red" }}>*</span></Form.Label><Form.Control type="text" name="make_brand" value={formData.make_brand} onChange={handleInputChange} placeholder="e.g., Caterpillar, Volvo" required /></Form.Group></div>
                    <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Model <span style={{ color: "red" }}>*</span></Form.Label><Form.Control type="text" name="model" value={formData.model} onChange={handleInputChange} placeholder="e.g., D6T, L120H" required /></Form.Group></div>
                  </div>
                  <div className="row">
                    <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Registration Number</Form.Label><Form.Control type="text" name="registration_number" value={formData.registration_number} onChange={handleInputChange} placeholder="License plate number" /></Form.Group></div>
                    <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Status</Form.Label><Form.Select name="status" value={formData.status} onChange={handleInputChange}>{statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}</Form.Select></Form.Group></div>
                  </div>
                  <div className="row">
                    <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Year of Manufacture</Form.Label><Form.Control type="number" name="year_of_manufacture" value={formData.year_of_manufacture} onChange={handleInputChange} placeholder="2026" /></Form.Group></div>
                    <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>VIN</Form.Label><Form.Control type="text" name="vin" value={formData.vin} onChange={handleInputChange} placeholder="Vehicle Identification Number" /></Form.Group></div>
                  </div>
                  <div className="row">
                    <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Color</Form.Label><Form.Control type="text" name="color" value={formData.color} onChange={handleInputChange} placeholder="Vehicle color" /></Form.Group></div>
                    <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Stickers</Form.Label><Form.Control type="text" name="stickers" value={formData.stickers} onChange={handleInputChange} placeholder="Sticker details or codes" /></Form.Group></div>
                  </div>
                  <div className="row">
                    <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Purchase Price</Form.Label><Form.Control type="number" step="0.01" name="purchase_price" value={formData.purchase_price} onChange={handleInputChange} placeholder="0.00" /></Form.Group></div>
                    <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Date of Acquisition</Form.Label><Form.Control type="date" name="date_of_acquisition" value={formData.date_of_acquisition} onChange={handleInputChange} /></Form.Group></div>
                  </div>
                  <Form.Group className="mb-4"><Form.Label style={{ fontWeight: "500" }}>Description</Form.Label><Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleInputChange} placeholder="Additional fleet details..." /></Form.Group>
                  <div className="d-flex gap-2 justify-content-end">
                    <Button variant="secondary" style={{ borderRadius: "6px", minWidth: "100px" }} onClick={() => navigate("/moms/fleets")} disabled={saving}>Cancel</Button>
                    <Button type="submit" style={{ borderRadius: "6px", minWidth: "130px", backgroundColor: "#0ea5e9", border: "none", display: "inline-flex", alignItems: "center", gap: "6px", justifyContent: "center" }} disabled={saving}>
                      <MdSave size={16} />{saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}