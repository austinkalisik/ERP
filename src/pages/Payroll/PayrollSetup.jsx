import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "../../components/layouts/DashboardLayout";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";
import { MdAdd, MdDelete, MdEdit, MdSave, MdClose } from "react-icons/md";
import { useSettings } from "../../contexts/SettingsContext";

const currentYear = new Date().getFullYear();

const TAX_TYPES = ["W/ Declaration", "No Declaration", "Non-Resident"];

// ── Shared helpers ────────────────────────────────────────────────────────────
const fmtDate    = (d) => (d ? String(d).split("T")[0] : "");
const fmtCurrency = (v) => (v != null ? Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00");

// ── Tab button ────────────────────────────────────────────────────────────────
function TabBtn({ label, active, color, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 24px", border: "none", borderRadius: "6px",
        fontWeight: 600, fontSize: 14, cursor: "pointer",
        backgroundColor: active ? color : "#e9ecef",
        color: active ? "#fff" : "#495057",
        transition: "all 0.2s",
      }}
    >
      {label}
    </button>
  );
}

// ── Confirm delete helper ─────────────────────────────────────────────────────
const confirmDelete = () =>
  Swal.fire({
    title: "Delete this record?", text: "This cannot be undone.",
    icon: "warning", showCancelButton: true,
    confirmButtonColor: "#dc3545", confirmButtonText: "Yes, delete",
  });

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function PayrollSetup() {
  const [activeTab, setActiveTab] = useState("payDates");

  const TABS = [
    { key: "payDates", label: "Pay Dates",     color: "#0d6efd" },
    { key: "nasfund",  label: "Nasfund Table", color: "#28a745" },
    { key: "ncsl",     label: "NCSL Table",    color: "#17a2b8" },
    { key: "tax",      label: "Tax Table",     color: "#dc3545" },
  ];

  return (
    <Layout>
      <div className="container-fluid px-3 px-md-4 py-4">
        <h2 className="fw-bold mb-4">Payroll Setup</h2>

        {/* Tab buttons — matching PM screenshot */}
        <div className="d-flex gap-2 flex-wrap mb-4">
          {TABS.map((t) => (
            <TabBtn
              key={t.key} label={t.label}
              active={activeTab === t.key} color={t.color}
              onClick={() => setActiveTab(t.key)}
            />
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "payDates" && <PayDatesTab />}
        {activeTab === "nasfund"  && <NasfundTab />}
        {activeTab === "ncsl"     && <NcslTab />}
        {activeTab === "tax"      && <TaxTab />}
      </div>
    </Layout>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PAY DATES TAB
// ═════════════════════════════════════════════════════════════════════════════
function PayDatesTab() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState({ pay_date: "", cutoff_start_date: "", cutoff_end_date: "" });

  const cacheKey = ["payroll_pay_dates"];
  const { data: records = [], isLoading } = useQuery({
    queryKey: cacheKey,
    queryFn:  () => baseApi.get("/api/payroll/setup/pay-dates").then((r) => r.data || []),
    staleTime: 5 * 60 * 1000,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: cacheKey });

  const openAdd  = () => { setEditing(null); setForm({ pay_date: "", cutoff_start_date: "", cutoff_end_date: "" }); setShowModal(true); };
  const openEdit = (r)  => { setEditing(r); setForm({ pay_date: fmtDate(r.pay_date), cutoff_start_date: fmtDate(r.cutoff_start_date), cutoff_end_date: fmtDate(r.cutoff_end_date) }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.pay_date || !form.cutoff_start_date || !form.cutoff_end_date) {
      return Swal.fire("Validation", "All date fields are required.", "warning");
    }
    try {
      editing
        ? await baseApi.put(`/api/payroll/setup/pay-dates/${editing.id}`, form)
        : await baseApi.post("/api/payroll/setup/pay-dates", form);
      Swal.fire("Saved", `Pay date ${editing ? "updated" : "added"} successfully.`, "success");
      setShowModal(false); refetch();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to save.", "error");
    }
  };

  const handleDelete = async (id) => {
    const res = await confirmDelete();
    if (!res.isConfirmed) return;
    try {
      await baseApi.delete(`/api/payroll/setup/pay-dates/${id}`);
      Swal.fire("Deleted", "Pay date removed.", "success"); refetch();
    } catch { Swal.fire("Error", "Failed to delete.", "error"); }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">Cutoff and Pay Dates</h5>
          <button className="btn btn-success btn-sm" onClick={openAdd}>
            <MdAdd size={16} className="me-1" /> Add
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle mb-0">
            <thead className="table-light text-center">
              <tr>
                <th>Pay Date</th>
                <th>Cutoff Start Date</th>
                <th>Cutoff End Date</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-4">Loading...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={4} className="text-center text-muted py-4">No pay dates found.</td></tr>
              ) : records.map((r) => (
                <tr key={r.id} className="text-center">
                  <td>{fmtDate(r.pay_date)}</td>
                  <td>{fmtDate(r.cutoff_start_date)}</td>
                  <td>{fmtDate(r.cutoff_end_date)}</td>
                  <td>
                    <div className="d-flex justify-content-center gap-1">
                      <button className="btn btn-sm btn-primary px-2"  onClick={() => openEdit(r)}><MdEdit size={14} /></button>
                      <button className="btn btn-sm btn-danger px-2"   onClick={() => handleDelete(r.id)}><MdDelete size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={editing ? "Edit Pay Date" : "Add Pay Date"} onClose={() => setShowModal(false)} onSave={handleSave}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Pay Date <span className="text-danger">*</span></label>
            <input type="date" className="form-control" value={form.pay_date} onChange={(e) => setForm({ ...form, pay_date: e.target.value })} />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Cutoff Start Date <span className="text-danger">*</span></label>
            <input type="date" className="form-control" value={form.cutoff_start_date} onChange={(e) => setForm({ ...form, cutoff_start_date: e.target.value })} />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Cutoff End Date <span className="text-danger">*</span></label>
            <input type="date" className="form-control" value={form.cutoff_end_date} onChange={(e) => setForm({ ...form, cutoff_end_date: e.target.value })} />
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// NASFUND TAB
// ═════════════════════════════════════════════════════════════════════════════
function NasfundTab() {
  const queryClient = useQueryClient();
  const [year,      setYear]      = useState(String(currentYear));
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState({ compensation_from: "", compensation_to: "", employee_rate: "", employer_rate: "", year: currentYear });

  const cacheKey = ["payroll_nasfund", year];
  const { data: records = [], isLoading } = useQuery({
    queryKey: cacheKey,
    queryFn:  () => baseApi.get("/api/payroll/setup/nasfund", { params: { year } }).then((r) => r.data || []),
    staleTime: 5 * 60 * 1000,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: cacheKey });

  const openAdd  = () => { setEditing(null); setForm({ compensation_from: "", compensation_to: "", employee_rate: "", employer_rate: "", year: Number(year) }); setShowModal(true); };
  const openEdit = (r)  => { setEditing(r); setForm({ compensation_from: r.compensation_from, compensation_to: r.compensation_to, employee_rate: r.employee_rate_percent, employer_rate: r.employer_rate_percent, year: r.year }); setShowModal(true); };

  const handleSave = async () => {
    const payload = {
      ...form,
      // Convert % back to decimal for storage
      employee_rate: parseFloat(form.employee_rate) / 100,
      employer_rate: parseFloat(form.employer_rate) / 100,
    };
    try {
      editing
        ? await baseApi.put(`/api/payroll/setup/nasfund/${editing.id}`, payload)
        : await baseApi.post("/api/payroll/setup/nasfund", payload);
      Swal.fire("Saved", `NASFUND record ${editing ? "updated" : "added"}.`, "success");
      setShowModal(false); refetch();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to save.", "error");
    }
  };

  const handleDelete = async (id) => {
    const res = await confirmDelete();
    if (!res.isConfirmed) return;
    try {
      await baseApi.delete(`/api/payroll/setup/nasfund/${id}`);
      Swal.fire("Deleted", "Record removed.", "success"); refetch();
    } catch { Swal.fire("Error", "Failed to delete.", "error"); }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h5 className="fw-bold mb-0">NASFUND Contribution Table</h5>
          <div className="d-flex align-items-center gap-2">
            <YearFilter year={year} setYear={setYear} />
            <button className="btn btn-success btn-sm" onClick={openAdd}><MdAdd size={16} className="me-1" /> Add</button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle mb-0">
            <thead className="table-light text-center">
              <tr>
                <th>Range of Compensation</th>
                <th>Employee Rate</th>
                <th>Employer Rate</th>
                <th>Year</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-muted py-4">No NASFUND records for {year}.</td></tr>
              ) : records.map((r) => (
                <tr key={r.id} className="text-center">
                  <td>{fmtCurrency(r.compensation_from)} – {fmtCurrency(r.compensation_to)}</td>
                  <td>{r.employee_rate_percent}%</td>
                  <td>{r.employer_rate_percent}%</td>
                  <td>{r.year}</td>
                  <td>
                    <div className="d-flex justify-content-center gap-1">
                      <button className="btn btn-sm btn-primary px-2" onClick={() => openEdit(r)}><MdEdit size={14} /></button>
                      <button className="btn btn-sm btn-danger px-2"  onClick={() => handleDelete(r.id)}><MdDelete size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={editing ? "Edit NASFUND Record" : "Add NASFUND Record"} onClose={() => setShowModal(false)} onSave={handleSave}>
          <RangeFields form={form} setForm={setForm} />
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Employee Rate (%) <span className="text-danger">*</span></label>
              <div className="input-group">
                <input type="number" className="form-control" min="0" max="100" step="0.01" value={form.employee_rate} onChange={(e) => setForm({ ...form, employee_rate: e.target.value })} placeholder="e.g. 6" />
                <span className="input-group-text">%</span>
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Employer Rate (%) <span className="text-danger">*</span></label>
              <div className="input-group">
                <input type="number" className="form-control" min="0" max="100" step="0.01" value={form.employer_rate} onChange={(e) => setForm({ ...form, employer_rate: e.target.value })} placeholder="e.g. 8.5" />
                <span className="input-group-text">%</span>
              </div>
            </div>
          </div>
          <YearField form={form} setForm={setForm} />
        </Modal>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// NCSL TAB
// ═════════════════════════════════════════════════════════════════════════════
function NcslTab() {
  const queryClient = useQueryClient();
  const [year,      setYear]      = useState(String(currentYear));
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState({ compensation_from: "", compensation_to: "", deduction_amount: "", year: currentYear });

  const cacheKey = ["payroll_ncsl", year];
  const { data: records = [], isLoading } = useQuery({
    queryKey: cacheKey,
    queryFn:  () => baseApi.get("/api/payroll/setup/ncsl", { params: { year } }).then((r) => r.data || []),
    staleTime: 5 * 60 * 1000,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: cacheKey });

  const openAdd  = () => { setEditing(null); setForm({ compensation_from: "", compensation_to: "", deduction_amount: "", year: Number(year) }); setShowModal(true); };
  const openEdit = (r)  => { setEditing(r); setForm({ compensation_from: r.compensation_from, compensation_to: r.compensation_to, deduction_amount: r.deduction_amount, year: r.year }); setShowModal(true); };

  const handleSave = async () => {
    try {
      editing
        ? await baseApi.put(`/api/payroll/setup/ncsl/${editing.id}`, form)
        : await baseApi.post("/api/payroll/setup/ncsl", form);
      Swal.fire("Saved", `NCSL record ${editing ? "updated" : "added"}.`, "success");
      setShowModal(false); refetch();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to save.", "error");
    }
  };

  const handleDelete = async (id) => {
    const res = await confirmDelete();
    if (!res.isConfirmed) return;
    try {
      await baseApi.delete(`/api/payroll/setup/ncsl/${id}`);
      Swal.fire("Deleted", "Record removed.", "success"); refetch();
    } catch { Swal.fire("Error", "Failed to delete.", "error"); }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h5 className="fw-bold mb-0">NCSL Deduction Table</h5>
          <div className="d-flex align-items-center gap-2">
            <YearFilter year={year} setYear={setYear} />
            <button className="btn btn-success btn-sm" onClick={openAdd}><MdAdd size={16} className="me-1" /> Add</button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle mb-0">
            <thead className="table-light text-center">
              <tr>
                <th>Range of Compensation</th>
                <th>Deduction Amount</th>
                <th>Year</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-4">Loading...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={4} className="text-center text-muted py-4">No NCSL records for {year}.</td></tr>
              ) : records.map((r) => (
                <tr key={r.id} className="text-center">
                  <td>{fmtCurrency(r.compensation_from)} – {fmtCurrency(r.compensation_to)}</td>
                  <td>{fmtCurrency(r.deduction_amount)}</td>
                  <td>{r.year}</td>
                  <td>
                    <div className="d-flex justify-content-center gap-1">
                      <button className="btn btn-sm btn-primary px-2" onClick={() => openEdit(r)}><MdEdit size={14} /></button>
                      <button className="btn btn-sm btn-danger px-2"  onClick={() => handleDelete(r.id)}><MdDelete size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={editing ? "Edit NCSL Record" : "Add NCSL Record"} onClose={() => setShowModal(false)} onSave={handleSave}>
          <RangeFields form={form} setForm={setForm} />
          <div className="mb-3">
            <label className="form-label fw-semibold">Deduction Amount <span className="text-danger">*</span></label>
            <input type="number" className="form-control" min="0" step="0.01" value={form.deduction_amount} onChange={(e) => setForm({ ...form, deduction_amount: e.target.value })} placeholder="e.g. 50.00" />
          </div>
          <YearField form={form} setForm={setForm} />
        </Modal>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TAX TABLE TAB
// ═════════════════════════════════════════════════════════════════════════════
function TaxTab() {
  const queryClient = useQueryClient();
  const [year,      setYear]      = useState(String(currentYear));
  const [taxType,   setTaxType]   = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState({ compensation_from: "", compensation_to: "", tax_type: "W/ Declaration", no_of_dependents: 0, amount: "", year_applied: currentYear });

  const cacheKey = ["payroll_tax", year, taxType];
  const { data: records = [], isLoading } = useQuery({
    queryKey: cacheKey,
    queryFn:  () => baseApi.get("/api/payroll/setup/tax", {
      params: { year, ...(taxType !== "All" && { tax_type: taxType }) },
    }).then((r) => r.data || []),
    staleTime: 5 * 60 * 1000,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: cacheKey });

  const openAdd  = () => { setEditing(null); setForm({ compensation_from: "", compensation_to: "", tax_type: "W/ Declaration", no_of_dependents: 0, amount: "", year_applied: Number(year) }); setShowModal(true); };
  const openEdit = (r)  => { setEditing(r); setForm({ compensation_from: r.compensation_from, compensation_to: r.compensation_to, tax_type: r.tax_type, no_of_dependents: r.no_of_dependents, amount: r.amount, year_applied: r.year_applied }); setShowModal(true); };

  const handleSave = async () => {
    try {
      editing
        ? await baseApi.put(`/api/payroll/setup/tax/${editing.id}`, form)
        : await baseApi.post("/api/payroll/setup/tax", form);
      Swal.fire("Saved", `Tax record ${editing ? "updated" : "added"}.`, "success");
      setShowModal(false); refetch();
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to save.", "error");
    }
  };

  const handleDelete = async (id) => {
    const res = await confirmDelete();
    if (!res.isConfirmed) return;
    try {
      await baseApi.delete(`/api/payroll/setup/tax/${id}`);
      Swal.fire("Deleted", "Record removed.", "success"); refetch();
    } catch { Swal.fire("Error", "Failed to delete.", "error"); }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h5 className="fw-bold mb-0">Withholding Tax Table</h5>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <YearFilter year={year} setYear={setYear} />
            <select className="form-select form-select-sm" style={{ width: 160 }} value={taxType} onChange={(e) => setTaxType(e.target.value)}>
              <option value="All">All Types</option>
              {TAX_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button className="btn btn-success btn-sm" onClick={openAdd}><MdAdd size={16} className="me-1" /> Add</button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle mb-0">
            <thead className="table-light text-center">
              <tr>
                <th>Range of Compensation</th>
                <th>Tax Type</th>
                <th>No. of Dependents</th>
                <th>Amount</th>
                <th>Year Applied</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted py-4">No tax records found.</td></tr>
              ) : records.map((r) => (
                <tr key={r.id} className="text-center">
                  <td>{fmtCurrency(r.compensation_from)} – {fmtCurrency(r.compensation_to)}</td>
                  <td><span className="badge bg-secondary">{r.tax_type}</span></td>
                  <td>{r.no_of_dependents}</td>
                  <td>{fmtCurrency(r.amount)}</td>
                  <td>{r.year_applied}</td>
                  <td>
                    <div className="d-flex justify-content-center gap-1">
                      <button className="btn btn-sm btn-primary px-2" onClick={() => openEdit(r)}><MdEdit size={14} /></button>
                      <button className="btn btn-sm btn-danger px-2"  onClick={() => handleDelete(r.id)}><MdDelete size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={editing ? "Edit Tax Record" : "Add Tax Record"} onClose={() => setShowModal(false)} onSave={handleSave}>
          <RangeFields form={form} setForm={setForm} />
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Tax Type <span className="text-danger">*</span></label>
              <select className="form-select" value={form.tax_type} onChange={(e) => setForm({ ...form, tax_type: e.target.value })}>
                {TAX_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">No. of Dependents <span className="text-danger">*</span></label>
              <input type="number" className="form-control" min="0" value={form.no_of_dependents} onChange={(e) => setForm({ ...form, no_of_dependents: parseInt(e.target.value) })} />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Amount <span className="text-danger">*</span></label>
            <input type="number" className="form-control" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 67.82" />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">Year Applied <span className="text-danger">*</span></label>
            <input type="number" className="form-control" min="2000" max="2100" value={form.year_applied} onChange={(e) => setForm({ ...form, year_applied: parseInt(e.target.value) })} />
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════

function RangeFields({ form, setForm }) {
  return (
    <div className="row g-3 mb-3">
      <div className="col-md-6">
        <label className="form-label fw-semibold">Compensation From <span className="text-danger">*</span></label>
        <input type="number" className="form-control" min="0" step="0.01" value={form.compensation_from} onChange={(e) => setForm({ ...form, compensation_from: e.target.value })} placeholder="e.g. 1001" />
      </div>
      <div className="col-md-6">
        <label className="form-label fw-semibold">Compensation To <span className="text-danger">*</span></label>
        <input type="number" className="form-control" min="0" step="0.01" value={form.compensation_to} onChange={(e) => setForm({ ...form, compensation_to: e.target.value })} placeholder="e.g. 1003" />
      </div>
    </div>
  );
}

function YearField({ form, setForm }) {
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold">Year <span className="text-danger">*</span></label>
      <input type="number" className="form-control" min="2000" max="2100" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })} />
    </div>
  );
}

function YearFilter({ year, setYear }) {
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  return (
    <select className="form-select form-select-sm" style={{ width: 100 }} value={year} onChange={(e) => setYear(e.target.value)}>
      {years.map((y) => <option key={y} value={y}>{y}</option>)}
    </select>
  );
}

function Modal({ title, onClose, onSave, children }) {
  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">{children}</div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}><MdClose size={16} className="me-1" />Cancel</button>
            <button className="btn btn-primary"   onClick={onSave}><MdSave  size={16} className="me-1" />Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}