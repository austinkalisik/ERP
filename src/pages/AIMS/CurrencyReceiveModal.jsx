import { useState, useEffect, useRef } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import baseApi from "../../api/baseApi";
import { MdSwapHoriz, MdWarning } from "react-icons/md";

const SUPPORTED_CURRENCIES = [
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "NZD", label: "NZD — New Zealand Dollar" },
  { code: "JPY", label: "JPY — Japanese Yen" },
  { code: "CNY", label: "CNY — Chinese Yuan" },
  { code: "SGD", label: "SGD — Singapore Dollar" },
];

const LOCAL_CURRENCY = "PGK";

export default function CurrencyReceiveModal({
  show, onHide, orderId, orderTotal = 0, onSuccess,
}) {
  const [isOverseas,       setIsOverseas]       = useState(false);
  const [foreignCurrency,  setForeignCurrency]  = useState("AUD");
  const [foreignAmount,    setForeignAmount]     = useState(orderTotal || "");
  const [manualRate,       setManualRate]        = useState("");
  const [liveRate,         setLiveRate]          = useState(null);
  const [rateSource,       setRateSource]        = useState(null);
  const [rateLoading,      setRateLoading]       = useState(false);
  const [rateError,        setRateError]         = useState(null);
  const [currencyNote,     setCurrencyNote]      = useState("");
  const [receiveNotes,     setReceiveNotes]      = useState("");
  const [submitting,       setSubmitting]        = useState(false);
  const [error,            setError]             = useState(null);

  const rateDebounce = useRef(null);

  // Auto-fetch live rate when currency changes
  useEffect(() => {
    if (!isOverseas || foreignCurrency === LOCAL_CURRENCY) {
      setLiveRate(null);
      setRateSource(null);
      return;
    }
    clearTimeout(rateDebounce.current);
    rateDebounce.current = setTimeout(() => fetchRate(), 400);
    return () => clearTimeout(rateDebounce.current);
  }, [foreignCurrency, isOverseas]);

  const fetchRate = async () => {
    setRateLoading(true);
    setRateError(null);
    try {
      const { data } = await baseApi.get("/api/aims/exchange-rate", {
        params: { from: foreignCurrency, to: LOCAL_CURRENCY },
      });
      setLiveRate(data.rate);
      setRateSource(data.source);
      if (!manualRate) setManualRate(data.rate.toFixed(4));
    } catch {
      setRateError("Could not fetch live rate. Enter rate manually.");
      setLiveRate(null);
      setRateSource(null);
    } finally {
      setRateLoading(false);
    }
  };

  const effectiveRate = parseFloat(manualRate) || liveRate || 1;
  const fAmt          = parseFloat(foreignAmount) || 0;
  const localAmount   = isOverseas && foreignCurrency !== LOCAL_CURRENCY
    ? fAmt * effectiveRate
    : fAmt;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        notes:            receiveNotes || undefined,
        foreign_currency: isOverseas && foreignCurrency !== LOCAL_CURRENCY ? foreignCurrency    : null,
        exchange_rate:    isOverseas && foreignCurrency !== LOCAL_CURRENCY ? effectiveRate       : null,
        foreign_amount:   isOverseas && foreignCurrency !== LOCAL_CURRENCY ? fAmt               : null,
        local_amount:     isOverseas ? localAmount : null,
        currency_note:    currencyNote || null,
        rate_source:      rateSource   || null,
      };
      await baseApi.post(`/api/aims/request-orders/${orderId}/receive`, payload);
      onSuccess?.();
      onHide();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to receive order.");
    } finally {
      setSubmitting(false);
    }
  };

  const isManualFallback = rateSource === 'manual-fallback';

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" size="md">
      <Modal.Header closeButton className="border-0 pb-1">
        <Modal.Title style={{ fontWeight: 700, fontSize: 17 }}>
          Receive Purchase Order
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="px-4 pb-2">
        {error && (
          <div className="alert alert-danger py-2 mb-3" style={{ fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* Overseas toggle */}
        <div className="mb-4 p-3 rounded-3" style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}>
          <div className="d-flex align-items-center gap-2 mb-1">
            <input
              type="checkbox"
              id="overseas-toggle"
              className="form-check-input"
              style={{ width: 18, height: 18, cursor: "pointer" }}
              checked={isOverseas}
              onChange={(e) => {
                setIsOverseas(e.target.checked);
                if (!e.target.checked) {
                  setManualRate("");
                  setLiveRate(null);
                  setRateSource(null);
                  setRateError(null);
                }
              }}
            />
            <label htmlFor="overseas-toggle" style={{ fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              This is an overseas / foreign currency order
            </label>
          </div>
          <p style={{ fontSize: 12, color: "#6b7280", marginLeft: 26, marginBottom: 0 }}>
            Enable to convert from a foreign currency to {LOCAL_CURRENCY}
          </p>
        </div>

        {/* Currency converter — only when overseas */}
        {isOverseas && (
          <div className="mb-4">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
              Invoice Currency
            </label>
            <select
              className="form-select mb-3"
              style={{ borderRadius: 8, fontSize: 13 }}
              value={foreignCurrency}
              onChange={(e) => {
                setForeignCurrency(e.target.value);
                setManualRate("");
                setLiveRate(null);
                setRateSource(null);
              }}
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>

            <div className="row g-2 mb-3">
              <div className="col-6">
                <label className="form-label fw-semibold" style={{ fontSize: 12 }}>
                  Invoice Amount ({foreignCurrency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  style={{ borderRadius: 8, fontSize: 13 }}
                  value={foreignAmount}
                  onChange={(e) => setForeignAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold d-flex align-items-center gap-1" style={{ fontSize: 12 }}>
                  Exchange Rate (1 {foreignCurrency} = ? {LOCAL_CURRENCY})
                  {rateLoading && (
                    <Spinner animation="border" size="sm" style={{ width: 10, height: 10 }} />
                  )}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.0001"
                  className="form-control"
                  style={{ borderRadius: 8, fontSize: 13 }}
                  value={manualRate}
                  onChange={(e) => setManualRate(e.target.value)}
                  placeholder={rateLoading ? "Fetching…" : "Enter rate"}
                />

                {/* Rate status indicator */}
                {liveRate && !rateError && (
                  <div style={{
                    fontSize: 11,
                    marginTop: 4,
                    color: isManualFallback ? "#d97706" : "#16a34a",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}>
                    {isManualFallback ? (
                      <>
                        <MdWarning size={12} />
                        Approximate rate — verify before confirming.
                        1 {foreignCurrency} ≈ {liveRate.toFixed(4)} {LOCAL_CURRENCY}
                      </>
                    ) : (
                      <>
                        ✓ Live rate: 1 {foreignCurrency} ≈ {liveRate.toFixed(4)} {LOCAL_CURRENCY}
                        <span style={{ color: "#9ca3af", marginLeft: 2 }}>
                          ({rateSource})
                        </span>
                      </>
                    )}
                  </div>
                )}

                {rateError && (
                  <div style={{ fontSize: 11, color: "#dc2626", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <MdWarning size={12} /> {rateError}
                  </div>
                )}
              </div>
            </div>

            {/* Converted total */}
            {fAmt > 0 && effectiveRate > 0 && (
              <div style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 12,
              }}>
                <div className="d-flex align-items-center gap-2">
                  <MdSwapHoriz size={18} color="#3b82f6" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1e40af" }}>
                    {fAmt.toFixed(2)} {foreignCurrency} × {effectiveRate.toFixed(4)} ={" "}
                    <span style={{ fontSize: 16 }}>
                      {localAmount.toFixed(2)} {LOCAL_CURRENCY}
                    </span>
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3, marginLeft: 26 }}>
                  {isManualFallback
                    ? "⚠️ Based on approximate rate — update manually if needed"
                    : "Rate applied at time of receipt"}
                </div>
              </div>
            )}

            {/* Currency note */}
            <div>
              <label className="form-label fw-semibold" style={{ fontSize: 12 }}>
                Currency Note{" "}
                <span className="text-muted fw-normal">(optional)</span>
              </label>
              <input
                type="text"
                className="form-control"
                style={{ borderRadius: 8, fontSize: 13 }}
                placeholder="e.g. Rate from ANZ bank 25/05/2026"
                value={currencyNote}
                onChange={(e) => setCurrencyNote(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Local order — show PO total */}
        {!isOverseas && (
          <div className="mb-4 p-3 rounded-3" style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 13, color: "#6b7280" }}>PO Total</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#111" }}>
              {parseFloat(orderTotal).toFixed(2)} {LOCAL_CURRENCY}
            </div>
          </div>
        )}

        {/* Receive notes */}
        <div className="mb-3">
          <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
            Receive Notes{" "}
            <span className="text-muted fw-normal">(optional)</span>
          </label>
          <textarea
            className="form-control"
            style={{ borderRadius: 8, resize: "vertical", minHeight: 70, fontSize: 13 }}
            placeholder="Condition on arrival, partial delivery notes…"
            value={receiveNotes}
            onChange={(e) => setReceiveNotes(e.target.value)}
          />
        </div>
      </Modal.Body>

      <Modal.Footer className="border-0 px-4 pb-4 gap-2">
        <Button
          variant="outline-secondary"
          style={{ borderRadius: 8 }}
          onClick={onHide}
        >
          Cancel
        </Button>
        <Button
          variant="success"
          style={{ borderRadius: 8, fontWeight: 600 }}
          disabled={submitting || (isOverseas && (!fAmt || !effectiveRate))}
          onClick={handleSubmit}
        >
          {submitting ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Receiving…
            </>
          ) : (
            "Confirm Receipt"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}