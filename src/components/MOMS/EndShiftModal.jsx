import { useState, useEffect } from "react";
import { useSettings } from "../../contexts/SettingsContext";
import { Modal, Button, Form } from "react-bootstrap";
import baseApi from "../../api/baseApi";
import Swal from "sweetalert2";

const DEPARTMENTS = [
    "Mine Operations",
    "Civil & Infrastructure",
    "Plant & Equipment",
    "Drill & Blast",
    "Logistics & Transport",
    "Health, Safety & Environment",
    "Maintenance",
    "Administration",
];

const PRODUCTION_UNITS = ["Tons", "BCM", "Trips", "Loads", "km", "Hours", "Other"];

export default function EndShiftModal({ show, onHide, operation, onSuccess }) {
    const { formatDateTime } = useSettings();
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        ending_hour_meter:   "",
        ending_odometer:     "",
        fuel_consumed:       "",
        ready_hours:         "",
        standby_hours:       "",
        breakdown_hours:     "",
        pm_hours:            "",
        delay_reason:        "",
        production_quantity: "",
        production_unit:     "Tons",
        trips:               "",
        location:            "",
        department:          "",
        end_shift_notes:     "",
    });

    // Pre-fill location/department from operation if available
    useEffect(() => {
        if (operation) {
            setForm(prev => ({
                ...prev,
                location:   operation.location   || "",
                department: operation.department || "",
            }));
        }
    }, [operation]);

    // Sync trips when production_unit = Trips
    useEffect(() => {
        if (form.production_unit === "Trips") {
            setForm(prev => ({ ...prev, trips: prev.production_quantity }));
        }
    }, [form.production_quantity, form.production_unit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    // ── Live Calculated Values ────────────────────────────────────────────
    const startMeter  = parseFloat(operation?.starting_hour_meter) || 0;
    const endMeter    = parseFloat(form.ending_hour_meter)          || 0;
    const opHours     = endMeter > startMeter ? (endMeter - startMeter).toFixed(2) : null;

    const readyH      = parseFloat(form.ready_hours)     || 0;
    const standbyH    = parseFloat(form.standby_hours)   || 0;
    const breakdownH  = parseFloat(form.breakdown_hours) || 0;
    const pmH         = parseFloat(form.pm_hours)        || 0;

    const hoursAvailable   = (readyH + standbyH).toFixed(2);
    const hoursUnavailable = (breakdownH + pmH).toFixed(2);
    const totalAccounted   = (readyH + standbyH + breakdownH + pmH).toFixed(2);

    const handleSubmit = async () => {
        if (!form.ending_hour_meter) {
            Swal.fire("Missing Field", "Ending hour meter is required.", "warning");
            return;
        }
        if (endMeter < startMeter) {
            Swal.fire("Invalid Reading", `Ending meter (${endMeter}) cannot be less than starting (${startMeter}).`, "warning");
            return;
        }
        try {
            setSaving(true);
            // Sync tons when unit is Tons
            const payload = {
                ...form,
                tons: form.production_unit === "Tons" ? form.production_quantity : null,
            };
            await baseApi.post(`/api/moms/operations/${operation.id}/end-shift`, payload);
            Swal.fire({ icon: "success", title: "Shift Ended!", text: "Daily equipment report saved.", timer: 2000, showConfirmButton: false });
            onHide();
            onSuccess?.();
        } catch (err) {
            Swal.fire("Error", err.response?.data?.message || "Failed to end shift.", "error");
        } finally {
            setSaving(false);
        }
    };

    const lb  = { fontWeight: "600", fontSize: "13px", marginBottom: "4px" };
    const sec = { fontWeight: "700", fontSize: "14px", color: "#1e293b", margin: "0 0 14px 0", paddingBottom: "8px", borderBottom: "1px solid #e2e8f0" };

    const CalcBox = ({ label, value, color }) => (
        <div style={{
            background: color === "green" ? "#d1fae5" : color === "red" ? "#fee2e2" : "#f1f5f9",
            borderRadius: "8px", padding: "10px 14px", textAlign: "center",
        }}>
            <div style={{ fontSize: "10px", color: color === "green" ? "#065f46" : color === "red" ? "#991b1b" : "#6b7280", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: color === "green" ? "#065f46" : color === "red" ? "#991b1b" : "#1e293b" }}>
                {value ?? "—"}
            </div>
        </div>
    );

    return (
        <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
            <Modal.Header closeButton style={{ borderBottom: "1px solid #e5e7eb" }}>
                <Modal.Title style={{ fontWeight: "700", fontSize: "17px" }}>
                    End Shift — Daily Equipment Report
                </Modal.Title>
            </Modal.Header>

            <Modal.Body style={{ padding: "24px", maxHeight: "78vh", overflowY: "auto" }}>

                {/* Machine info banner */}
                <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", display: "flex", gap: "24px", flexWrap: "wrap" }}>
                    <div><div style={{ fontSize: "11px", color: "#6b7280", fontWeight: "600" }}>MACHINE</div><strong>{operation?.machine || "—"}</strong></div>
                    <div><div style={{ fontSize: "11px", color: "#6b7280", fontWeight: "600" }}>OPERATOR</div><strong>{operation?.operator || "—"}</strong></div>
                    <div><div style={{ fontSize: "11px", color: "#6b7280", fontWeight: "600" }}>START METER</div><strong>{operation?.starting_hour_meter ?? "—"} hrs</strong></div>
                    <div><div style={{ fontSize: "11px", color: "#6b7280", fontWeight: "600" }}>SHIFT STARTED</div><strong>{operation?.shift_start_time ? formatDateTime(operation.shift_start_time) : "—"}</strong></div>
                </div>

                {/* ── 1. Final Readings ── */}
                <h6 style={sec}>1. Final Readings</h6>
                <div className="row g-3 mb-4">
                    <div className="col-md-4">
                        <Form.Label style={lb}>Ending Hour Meter (hrs) <span style={{ color: "red" }}>*</span></Form.Label>
                        <Form.Control type="number" step="0.1" name="ending_hour_meter" value={form.ending_hour_meter}
                            onChange={handleChange} placeholder={`> ${startMeter}`} />
                    </div>
                    <div className="col-md-4">
                        <Form.Label style={lb}>Ending Odometer (km)</Form.Label>
                        <Form.Control type="number" step="0.1" name="ending_odometer" value={form.ending_odometer} onChange={handleChange} />
                    </div>
                    <div className="col-md-4">
                        <Form.Label style={lb}>Fuel Consumed (L)</Form.Label>
                        <Form.Control type="number" step="0.1" name="fuel_consumed" value={form.fuel_consumed} onChange={handleChange} />
                    </div>
                </div>

                {/* ── 2. Hour Accounting ── */}
                <h6 style={sec}>2. Hour Accounting</h6>
                <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>
                    Enter all shift hours. Available + Unavailable should equal total shift hours.
                </p>

                {/* Live calculated summary */}
                <div className="row g-2 mb-3">
                    <div className="col-3"><CalcBox label="Operating" value={opHours} color="neutral" /></div>
                    <div className="col-3"><CalcBox label="Available" value={parseFloat(hoursAvailable) > 0 ? hoursAvailable : null} color="green" /></div>
                    <div className="col-3"><CalcBox label="Unavailable" value={parseFloat(hoursUnavailable) > 0 ? hoursUnavailable : null} color="red" /></div>
                    <div className="col-3"><CalcBox label="Total Accounted" value={parseFloat(totalAccounted) > 0 ? totalAccounted : null} color="neutral" /></div>
                </div>

                <div className="row g-3 mb-4">
                    <div className="col-md-3">
                        <Form.Label style={lb}>Ready Hours</Form.Label>
                        <Form.Control type="number" step="0.1" name="ready_hours" value={form.ready_hours} onChange={handleChange} placeholder="0.00" />
                        <Form.Text muted style={{ fontSize: "11px" }}>Productive working hours</Form.Text>
                    </div>
                    <div className="col-md-3">
                        <Form.Label style={lb}>Standby Hours</Form.Label>
                        <Form.Control type="number" step="0.1" name="standby_hours" value={form.standby_hours} onChange={handleChange} placeholder="0.00" />
                        <Form.Text muted style={{ fontSize: "11px" }}>Idle — operator present</Form.Text>
                    </div>
                    <div className="col-md-3">
                        <Form.Label style={lb}>Breakdown Hours</Form.Label>
                        <Form.Control type="number" step="0.1" name="breakdown_hours" value={form.breakdown_hours} onChange={handleChange} placeholder="0.00" />
                        <Form.Text muted style={{ fontSize: "11px" }}>Unplanned downtime</Form.Text>
                    </div>
                    <div className="col-md-3">
                        <Form.Label style={lb}>PM Hours</Form.Label>
                        <Form.Control type="number" step="0.1" name="pm_hours" value={form.pm_hours} onChange={handleChange} placeholder="0.00" />
                        <Form.Text muted style={{ fontSize: "11px" }}>Planned maintenance</Form.Text>
                    </div>
                    <div className="col-12">
                        <Form.Label style={lb}>Delay / Breakdown Reason</Form.Label>
                        <Form.Control as="textarea" rows={2} name="delay_reason" value={form.delay_reason} onChange={handleChange}
                            placeholder="Describe any delays, breakdowns, or reasons for standby..." />
                    </div>
                </div>

                {/* ── 3. Production ── */}
                <h6 style={sec}>3. Production</h6>
                <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>
                    Select unit matching this machine: Dump Truck → Tons/Trips &nbsp;|&nbsp; Excavator → BCM &nbsp;|&nbsp; Dozer/Grader → Hours
                </p>
                <div className="row g-3 mb-4">
                    <div className="col-md-4">
                        <Form.Label style={lb}>Production Unit</Form.Label>
                        <Form.Select name="production_unit" value={form.production_unit} onChange={handleChange}>
                            {PRODUCTION_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </Form.Select>
                    </div>
                    <div className="col-md-4">
                        <Form.Label style={lb}>Quantity ({form.production_unit})</Form.Label>
                        <Form.Control type="number" step="0.01" name="production_quantity" value={form.production_quantity}
                            onChange={handleChange} placeholder="0.00" />
                    </div>
                    {(form.production_unit === "Tons" || form.production_unit === "Trips") && (
                        <div className="col-md-4">
                            <Form.Label style={lb}>Number of Trips</Form.Label>
                            <Form.Control type="number" name="trips" value={form.trips} onChange={handleChange} placeholder="0" />
                        </div>
                    )}
                </div>

                {/* ── 4. Location & Department ── */}
                <h6 style={sec}>4. Location & Department</h6>
                <div className="row g-3 mb-4">
                    <div className="col-md-6">
                        <Form.Label style={lb}>Work Location</Form.Label>
                        <Form.Control type="text" name="location" value={form.location} onChange={handleChange}
                            placeholder="e.g. Mt Bini South, EWRD, Pit 3..." />
                    </div>
                    <div className="col-md-6">
                        <Form.Label style={lb}>Department</Form.Label>
                        <Form.Select name="department" value={form.department} onChange={handleChange}>
                            <option value="">— Select Department —</option>
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </Form.Select>
                    </div>
                </div>

                {/* ── 5. End of Shift Notes ── */}
                <h6 style={sec}>5. End of Shift Notes</h6>
                <Form.Control as="textarea" rows={3} name="end_shift_notes" value={form.end_shift_notes} onChange={handleChange}
                    placeholder="Handover notes, observations, issues to report to next shift..." />

            </Modal.Body>

            <Modal.Footer style={{ borderTop: "1px solid #e5e7eb", gap: "8px" }}>
                <Button variant="secondary" onClick={onHide} disabled={saving} style={{ borderRadius: "6px" }}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={saving}
                    style={{ backgroundColor: "#16a34a", border: "none", borderRadius: "6px", minWidth: "160px" }}>
                    {saving ? "Saving..." : "✔ Submit & End Shift"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}