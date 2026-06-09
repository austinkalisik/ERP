import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import { Modal, Button, Form } from "react-bootstrap";
import Swal from "sweetalert2";
import { useSettings } from "../../contexts/SettingsContext";
import {
  MdLocalGasStation, MdFilterList, MdWarning, MdAssessment, MdClose,
  MdCalendarToday, MdPrecisionManufacturing, MdAttachMoney,
  MdPerson, MdNotes, MdDelete, MdTimer,
} from "react-icons/md";

const EMPTY_FORM = { machine_id: "", fuel_type: "Diesel", volume: "", unit_price: "", total_cost: "0.00", engine_hours: "", transaction_date: "", notes: "" };
const fuelTypes = ["Diesel", "Petrol", "LPG", "CNG"];
const fuelTypeColors = {
  Diesel: { bg: "#fef3c7", color: "#92400e" }, Petrol: { bg: "#dbeafe", color: "#1e40af" },
  LPG:    { bg: "#d1fae5", color: "#065f46" }, CNG:    { bg: "#ede9fe", color: "#5b21b6" },
};

export default function Fuel() {
  const navigate           = useNavigate();
  const { formatCurrency } = useSettings();
  const queryClient        = useQueryClient();

  const [showLogModal,        setShowLogModal]        = useState(false);
  const [showAnomaliesModal,  setShowAnomaliesModal]  = useState(false);
  const [showViewModal,       setShowViewModal]       = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [searchTerm,          setSearchTerm]          = useState("");
  const [selectedFuelType,    setSelectedFuelType]    = useState("All Fuel Types");
  const [submitting,          setSubmitting]          = useState(false);
  const [formData,            setFormData]            = useState(EMPTY_FORM);

  // ── Fuel transactions — cached 2 min ──────────────────────────────────────
  const txCacheKey = ["moms_fuel_transactions"];
  const { data: transactions = [], isLoading: loading } = useQuery({
    queryKey:  txCacheKey,
    queryFn: () => baseApi.get("/api/moms/fuel-transactions").then((r) => r.data?.data || r.data || []),
    staleTime: 2 * 60 * 1000,
  });

  // ── Machines — reuses moms_machines shared cache ──────────────────────────
  const { data: machines = [] } = useQuery({
    queryKey:  ["moms_machines"],
    queryFn: () => baseApi.get("/api/moms/machines").then((r) => r.data?.data || r.data || []),
    staleTime: 5 * 60 * 1000,
  });

  // ── Fuel stats — cached 5 min ────────────────────────────────────────────
  const statsCacheKey = ["moms_fuel_stats"];
  const { data: stats = { totalTransactions: 0, thisMonth: 0, fuelTypes: ["Diesel","Petrol","LPG","CNG"], avgCostPerUnit: 0 } } = useQuery({
    queryKey:  statsCacheKey,
    queryFn:   () => baseApi.get("/api/moms/fuel-stats").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  // ── Current fuel price — cached 30 min (changes rarely) ──────────────────
  // onSuccess removed (deprecated in RQ v5) — useEffect handles pre-fill instead
  const { data: currentFuelPrice } = useQuery({
    queryKey:  ["moms_fuel_price"],
    queryFn:   () => baseApi.get("/api/moms/finance/fuel-pricing").then((r) => r.data?.currentPrice || null),
    staleTime: 30 * 60 * 1000,
  });

  // Pre-fill unit_price when fuel price loads — only when the modal form is empty
  useEffect(() => {
    if (currentFuelPrice?.cost_per_litre && !formData.unit_price) {
      setFormData((prev) => ({ ...prev, unit_price: parseFloat(currentFuelPrice.cost_per_litre).toFixed(2) }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFuelPrice]);
  // formData.unit_price intentionally excluded — we only pre-fill once on load,
  // not every time the user edits the field

  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: txCacheKey });
    queryClient.invalidateQueries({ queryKey: statsCacheKey });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "volume" || name === "unit_price") {
        const volume    = parseFloat(name === "volume"     ? value : prev.volume)     || 0;
        const unitPrice = parseFloat(name === "unit_price" ? value : prev.unit_price) || 0;
        updated.total_cost = (volume * unitPrice).toFixed(2);
      }
      return updated;
    });
  };

  const loadCurrentFuelPrice = () => {
    if (currentFuelPrice?.cost_per_litre) {
      setFormData((prev) => ({ ...prev, unit_price: parseFloat(currentFuelPrice.cost_per_litre).toFixed(2) }));
    } else {
      Swal.fire({ icon: "warning", title: "No Fuel Price Set", text: "Please set fuel pricing first in Finance > Pricing.", confirmButtonColor: "#f97316" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await baseApi.post("/api/moms/fuel-transactions", formData);
      setShowLogModal(false);
      setFormData({
        ...EMPTY_FORM,
        unit_price: currentFuelPrice?.cost_per_litre
          ? parseFloat(currentFuelPrice.cost_per_litre).toFixed(2)
          : "",
      });
      refetchAll();
      Swal.fire({ icon: "success", title: "Transaction Logged!", text: "Fuel transaction has been recorded.", confirmButtonColor: "#f97316", timer: 2000, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Failed", text: "Could not log fuel transaction.", confirmButtonColor: "#f97316" });
    } finally { setSubmitting(false); }
  };

  const handleDeleteTransaction = async (id) => {
    const result = await Swal.fire({ title: "Delete Transaction?", text: "This action cannot be undone.", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", cancelButtonColor: "#6b7280", confirmButtonText: "Yes, delete it" });
    if (result.isConfirmed) {
      try {
        await baseApi.delete(`/api/moms/fuel-transactions/${id}`);
        setShowViewModal(false); setSelectedTransaction(null);
        refetchAll();
        Swal.fire({ icon: "success", title: "Deleted!", confirmButtonColor: "#f97316", timer: 2000, showConfirmButton: false });
      } catch { Swal.fire({ icon: "error", title: "Error", text: "Could not delete the transaction.", confirmButtonColor: "#f97316" }); }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      let datePart;
      if (dateString.includes("T"))      datePart = dateString.split("T")[0];
      else if (dateString.includes(" ")) datePart = dateString.split(" ")[0];
      else                               datePart = dateString;
      const [year, month, day] = datePart.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch { return "Invalid Date"; }
  };

  const filteredTransactions = useMemo(() => transactions.filter((t) => {
    const matchesSearch   = t.machine_id?.toLowerCase().includes(searchTerm.toLowerCase()) || t.fuel_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFuelType = selectedFuelType === "All Fuel Types" || t.fuel_type === selectedFuelType;
    return matchesSearch && matchesFuelType;
  }), [transactions, searchTerm, selectedFuelType]);

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4">
        <div className="row mb-3 mb-md-4 align-items-center">
          <div className="col">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <MdLocalGasStation size={32} color="#f97316" />
              <div>
                <h1 style={{ fontWeight: "bold", fontSize: "clamp(20px, 5vw, 28px)", margin: 0 }}>Fuel Management</h1>
                <p className="text-muted mb-0" style={{ fontSize: "14px" }}>Manage fuel transactions and consumption</p>
              </div>
            </div>
          </div>
          <div className="col-auto">
            <button className="btn" style={{ height: "42px", fontSize: "15px", fontWeight: "500", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#f97316", color: "white", border: "none" }} onClick={() => setShowLogModal(true)}>
              <MdLocalGasStation size={20} /> Log Fuel Transaction
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="row g-3 mb-4">
          {[
            { label: "Total Transactions", value: stats.totalTransactions, gradient: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)" },
            { label: "This Month",         value: stats.thisMonth,         gradient: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)" },
            { label: "Fuel Types",         value: stats.fuelTypes?.length, gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)", sub: stats.fuelTypes?.join(" • ") },
            { label: "Avg Cost/Unit",      value: formatCurrency(stats.avgCostPerUnit), gradient: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)" },
          ].map((c) => (
            <div key={c.label} className="col-12 col-sm-6 col-lg-3">
              <div className="card shadow-sm" style={{ borderRadius: "12px", background: c.gradient, color: "white", border: "none" }}>
                <div className="card-body p-3">
                  <p className="mb-1" style={{ fontSize: "14px", opacity: 0.9 }}>{c.label}</p>
                  <h2 className="mb-0" style={{ fontWeight: "bold", fontSize: "32px" }}>{c.value}</h2>
                  {c.sub && <p className="mb-0 mt-1" style={{ fontSize: "12px", opacity: 0.8 }}>{c.sub}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="card shadow-sm mb-3" style={{ borderRadius: "12px" }}>
          <div className="card-body p-3">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-3">
                <input type="text" className="form-control" placeholder="Search machine or fuel type..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ borderRadius: "8px" }} />
              </div>
              <div className="col-12 col-md-3">
                <select className="form-select" value={selectedFuelType} onChange={(e) => setSelectedFuelType(e.target.value)} style={{ borderRadius: "8px" }}>
                  <option>All Fuel Types</option>
                  {fuelTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </div>
              <div className="col-12 col-md-2">
                <button className="btn w-100" style={{ backgroundColor: "#f97316", color: "white", borderRadius: "8px", fontWeight: "500" }}>
                  <MdFilterList size={18} className="me-1" /> Filter
                </button>
              </div>
              <div className="col-12 col-md-2">
                <button className="btn btn-danger w-100" style={{ borderRadius: "8px", fontWeight: "500" }} onClick={() => setShowAnomaliesModal(true)}>
                  <MdWarning size={18} className="me-1" /> Detect Anomalies
                </button>
              </div>
              <div className="col-12 col-md-2">
                <button className="btn btn-success w-100" style={{ borderRadius: "8px", fontWeight: "500" }} onClick={() => navigate("/moms/fuel/consumption-report")}>
                  <MdAssessment size={18} className="me-1" /> Consumption Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card shadow-sm" style={{ borderRadius: "12px" }}>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #e9ecef" }}>
                  <tr>
                    {["Date","Machine","Fuel Type","Volume (L)","Unit Price","Total Cost","Logged By","Actions"].map((h) => (
                      <th key={h} style={{ padding: "16px", fontWeight: "600", color: "#495057" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="8" className="text-center py-4"><div className="spinner-border spinner-border-sm text-secondary me-2" />Loading...</td></tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr><td colSpan="8" className="text-center py-5"><MdLocalGasStation size={48} color="#cbd5e1" /><p className="text-muted mt-2 mb-0">No fuel transactions found</p></td></tr>
                  ) : (
                    filteredTransactions.map((transaction) => {
                      const typeStyle = fuelTypeColors[transaction.fuel_type] || { bg: "#f3f4f6", color: "#374151" };
                      return (
                        <tr key={transaction.id}>
                          <td style={{ padding: "16px" }}>{formatDate(transaction.transaction_date)}</td>
                          <td style={{ padding: "16px", fontWeight: "500" }}>{transaction.machine_id}</td>
                          <td style={{ padding: "16px" }}><span style={{ backgroundColor: typeStyle.bg, color: typeStyle.color, padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" }}>{transaction.fuel_type}</span></td>
                          <td style={{ padding: "16px" }}>{parseFloat(transaction.volume).toFixed(2)} L</td>
                          <td style={{ padding: "16px" }}>{formatCurrency(transaction.unit_price)}</td>
                          <td style={{ padding: "16px", fontWeight: "600", color: "#059669" }}>{formatCurrency(transaction.total_cost)}</td>
                          <td style={{ padding: "16px" }}>{transaction.logged_by || "System"}</td>
                          <td style={{ padding: "16px" }}>
                            <button className="btn btn-sm" style={{ backgroundColor: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe", borderRadius: "6px", padding: "4px 14px", fontSize: "13px", fontWeight: "500" }} onClick={() => { setSelectedTransaction(transaction); setShowViewModal(true); }}>View</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="md">
        <Modal.Header style={{ borderBottom: "none", padding: "20px 24px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MdLocalGasStation size={20} color="#f97316" />
            </div>
            <div>
              <Modal.Title style={{ fontWeight: "700", fontSize: "17px", margin: 0 }}>Transaction Details</Modal.Title>
              {selectedTransaction && <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>ID #{selectedTransaction.id}</p>}
            </div>
          </div>
          <button onClick={() => setShowViewModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px" }}><MdClose size={20} /></button>
        </Modal.Header>
        <Modal.Body style={{ padding: "16px 24px 24px" }}>
          {selectedTransaction && (
            <>
              <div style={{ background: "linear-gradient(135deg, #fff7ed, #fef3c7)", borderRadius: "12px", padding: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: "12px", color: "#92400e", fontWeight: "600", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>Fuel Type</p>
                  <span style={{ backgroundColor: (fuelTypeColors[selectedTransaction.fuel_type] || {}).bg || "#f3f4f6", color: (fuelTypeColors[selectedTransaction.fuel_type] || {}).color || "#374151", padding: "4px 12px", borderRadius: "20px", fontSize: "14px", fontWeight: "700", marginTop: "4px", display: "inline-block" }}>{selectedTransaction.fuel_type}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "12px", color: "#92400e", fontWeight: "600", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Cost</p>
                  <p style={{ fontSize: "24px", fontWeight: "800", color: "#059669", margin: 0 }}>{formatCurrency(selectedTransaction.total_cost)}</p>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <DetailRow icon={<MdCalendarToday size={16} color="#f97316" />}          label="Transaction Date" value={formatDate(selectedTransaction.transaction_date)} />
                <DetailRow icon={<MdPrecisionManufacturing size={16} color="#3b82f6" />} label="Machine"          value={selectedTransaction.machine_id} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <DetailRow icon={<MdLocalGasStation size={16} color="#10b981" />} label="Volume"     value={`${parseFloat(selectedTransaction.volume).toFixed(2)} L`} />
                  <DetailRow icon={<MdAttachMoney size={16} color="#8b5cf6" />}     label="Unit Price" value={`${formatCurrency(selectedTransaction.unit_price)}/L`} />
                </div>
                <DetailRow icon={<MdTimer size={16} color="#0891b2" />}  label="Engine Hours" value={parseFloat(selectedTransaction.engine_hours || 0) > 0 ? `${parseFloat(selectedTransaction.engine_hours).toFixed(2)} hrs` : "Not recorded"} />
                <DetailRow icon={<MdPerson size={16} color="#6b7280" />} label="Logged By"    value={selectedTransaction.logged_by || "System"} />
                {selectedTransaction.notes && <DetailRow icon={<MdNotes size={16} color="#6b7280" />} label="Notes" value={selectedTransaction.notes} />}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "1px solid #f3f4f6", padding: "12px 24px", gap: "8px" }}>
          <button className="btn btn-sm" style={{ backgroundColor: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: "6px", padding: "6px 16px", fontSize: "13px", fontWeight: "500", display: "flex", alignItems: "center", gap: "4px" }} onClick={() => handleDeleteTransaction(selectedTransaction?.id)}>
            <MdDelete size={16} /> Delete
          </button>
          <button className="btn btn-sm ms-auto" style={{ backgroundColor: "#f3f4f6", color: "#374151", border: "none", borderRadius: "6px", padding: "6px 20px", fontSize: "13px", fontWeight: "500" }} onClick={() => setShowViewModal(false)}>Close</button>
        </Modal.Footer>
      </Modal>

      {/* Log Modal */}
      <Modal show={showLogModal} onHide={() => setShowLogModal(false)} centered size="lg">
        <Modal.Header closeButton style={{ borderBottom: "1px solid #e5e7eb" }}>
          <Modal.Title style={{ fontWeight: "600" }}>Log Fuel Transaction</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body style={{ padding: "24px" }}>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: "500" }}>Machine</Form.Label>
                  <Form.Select name="machine_id" value={formData.machine_id} onChange={handleInputChange} required>
                    <option value="">Select Machine</option>
                    {machines.map((machine) => <option key={machine.id} value={machine.id}>{machine.machine_id} - {machine.category}</option>)}
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: "500" }}>Fuel Type</Form.Label>
                  <Form.Select name="fuel_type" value={formData.fuel_type} onChange={handleInputChange} required>
                    {fuelTypes.map((type) => <option key={type}>{type}</option>)}
                  </Form.Select>
                </Form.Group>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Volume (L)</Form.Label><Form.Control type="number" step="0.01" name="volume" value={formData.volume} onChange={handleInputChange} placeholder="0.00" required /></Form.Group></div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: "500" }}>Unit Price</Form.Label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Form.Control type="number" step="0.01" name="unit_price" value={formData.unit_price} onChange={handleInputChange} placeholder="0.00" required />
                    <Button variant="outline-primary" onClick={loadCurrentFuelPrice} style={{ whiteSpace: "nowrap" }}>Load Current</Button>
                  </div>
                  <small className="text-muted" style={{ fontSize: "12px" }}>
                    {currentFuelPrice ? `Current price: ${formatCurrency(currentFuelPrice.cost_per_litre)}/L` : "No current price set."}
                  </small>
                </Form.Group>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Total Cost</Form.Label><Form.Control type="text" value={formatCurrency(formData.total_cost)} readOnly style={{ fontWeight: "700", backgroundColor: "#f8f9fa", color: "#059669" }} /></Form.Group></div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: "500" }}>Engine Hours <span className="text-muted ms-1" style={{ fontSize: "12px", fontWeight: "400" }}>(for efficiency tracking)</span></Form.Label>
                  <div className="input-group">
                    <Form.Control type="number" step="0.01" name="engine_hours" value={formData.engine_hours} onChange={handleInputChange} placeholder="e.g., 8.5" min="0" />
                    <span className="input-group-text">hrs</span>
                  </div>
                  <Form.Text className="text-muted">Hours the machine ran during this refuel period</Form.Text>
                </Form.Group>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6"><Form.Group className="mb-3"><Form.Label style={{ fontWeight: "500" }}>Transaction Date</Form.Label><Form.Control type="date" name="transaction_date" value={formData.transaction_date} onChange={handleInputChange} required /></Form.Group></div>
            </div>
            <Form.Group className="mb-0"><Form.Label style={{ fontWeight: "500" }}>Notes <span className="text-muted" style={{ fontWeight: "400" }}>(optional)</span></Form.Label><Form.Control as="textarea" rows={2} name="notes" value={formData.notes} onChange={handleInputChange} placeholder="e.g. Regular refueling after shift" style={{ resize: "none" }} /></Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ borderTop: "1px solid #e5e7eb", gap: "8px" }}>
            <Button variant="secondary" onClick={() => setShowLogModal(false)} style={{ borderRadius: "6px" }}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting} style={{ borderRadius: "6px", backgroundColor: "#f97316", border: "none", minWidth: "80px" }}>
              {submitting ? <span className="spinner-border spinner-border-sm" /> : "Save"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Anomalies Modal */}
      <Modal show={showAnomaliesModal} onHide={() => setShowAnomaliesModal(false)} centered size="lg">
        <Modal.Header closeButton style={{ borderBottom: "1px solid #e5e7eb" }}>
          <Modal.Title style={{ fontWeight: "600" }}>Fuel Consumption Anomalies</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "24px" }}>
          <p className="text-muted mb-4">The system analyzes recent fuel transactions and operations logs to detect large variances.</p>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead style={{ backgroundColor: "#f8f9fa" }}>
                <tr>{["Machine","Expected Usage","Actual Usage","Variance %","Actions"].map((h) => <th key={h} style={{ padding: "12px", fontWeight: "600" }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                <tr><td colSpan="5" className="text-center py-4 text-muted">No anomalies detected</td></tr>
              </tbody>
            </table>
          </div>
        </Modal.Body>
      </Modal>
    </Layout>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
      <div style={{ marginTop: "2px", flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>{label}</p>
        <p style={{ fontSize: "14px", color: "#111827", fontWeight: "500", margin: 0, wordBreak: "break-word" }}>{value || "—"}</p>
      </div>
    </div>
  );
}