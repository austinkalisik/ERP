import { useState, useRef, useEffect } from "react";
import { MdSearch, MdClose } from "react-icons/md";

/**
 * SearchableSelect — a lightweight searchable dropdown with no external deps.
 *
 * Props:
 *   options   [{ value, label }]   — list of options
 *   value     string               — currently selected value
 *   onChange  (value) => void      — called with the selected value (string)
 *   placeholder string             — shown when nothing is selected
 *   disabled  bool                 — greys out and prevents interaction
 *   size      "sm" | "md"          — "sm" uses 32px height (for table rows), "md" uses 38px (default)
 */
export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Search...",
  disabled = false,
  size = "md",
}) {
  const [query, setQuery] = useState("");
  const [open,  setOpen]  = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const height   = size === "sm" ? "32px" : "38px";
  const fontSize = size === "sm" ? "12px" : "14px";

  // Guard: filter out options with null/undefined value or label, coerce both to strings.
  // This prevents "Cannot read properties of undefined (reading 'toLowerCase')"
  // when API data hasn't loaded yet or a field is missing.
  const safeOptions = (Array.isArray(options) ? options : [])
    .filter((o) => o != null && o.value != null && o.label != null)
    .map((o) => ({ value: String(o.value), label: String(o.label) }));

  const safeValue     = value != null ? String(value) : "";
  const selectedLabel = safeOptions.find((o) => o.value === safeValue)?.label || "";
  const safeQuery     = query ?? "";
  const filtered      = safeOptions.filter((o) =>
    o.label.toLowerCase().includes(safeQuery.toLowerCase())
  );

  const handleOpen   = () => { if (!disabled) { setQuery(""); setOpen(true); } };
  const handleSelect = (opt) => { onChange(opt.value); setQuery(""); setOpen(false); };
  const handleClear  = (e)  => { e.stopPropagation(); onChange(""); setQuery(""); };

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      {/* Trigger */}
      <div
        onClick={handleOpen}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height, padding: "0 10px",
          border: "1px solid #ced4da", borderRadius: "6px",
          backgroundColor: disabled ? "#e9ecef" : "#fff",
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize, color: selectedLabel ? "#212529" : "#6c757d",
          userSelect: "none",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {selectedLabel || placeholder}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
          {safeValue && !disabled && (
            <MdClose size={13} color="#9ca3af" onClick={handleClear} style={{ cursor: "pointer" }} />
          )}
          {!disabled && <span style={{ color: "#9ca3af", fontSize: "10px", marginLeft: "2px" }}>▼</span>}
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", zIndex: 9999, top: "calc(100% + 4px)", left: 0, right: 0,
          backgroundColor: "#fff", border: "1px solid #ced4da", borderRadius: "8px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden",
        }}>
          {/* Search input */}
          <div style={{ padding: "8px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: "6px" }}>
            <MdSearch size={16} color="#9ca3af" style={{ flexShrink: 0 }} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search..."
              style={{ border: "none", outline: "none", fontSize: "13px", width: "100%", background: "transparent" }}
            />
            {query && (
              <MdClose size={13} color="#9ca3af" style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => setQuery("")} />
            )}
          </div>

          {/* Options */}
          <div style={{ maxHeight: "220px", overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "12px 14px", fontSize: "13px", color: "#9ca3af", textAlign: "center" }}>
                No results found
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.value === safeValue;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt)}
                    style={{
                      padding: "9px 14px", fontSize: "13px", cursor: "pointer",
                      backgroundColor: isSelected ? "#eff6ff" : "transparent",
                      color:           isSelected ? "#1d4ed8" : "#212529",
                      fontWeight:      isSelected ? "600"     : "400",
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    {opt.label}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}