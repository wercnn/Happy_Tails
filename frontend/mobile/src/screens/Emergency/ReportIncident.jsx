import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ReportIncident.css";

const API_BASE = "http://localhost:3000";

const INCIDENT_TYPES = [
  { label: "Pet Injury",               value: "PetInjury" },
  { label: "Pet Illness",              value: "PetIllness" },
  { label: "Lost Pet",                 value: "LostPet" },
  { label: "Minder No-Show",           value: "MinderNoShow" },
  { label: "Property Damage",          value: "PropertyDamage" },
  { label: "Inappropriate Behaviour",  value: "InappropriateBehaviour" },
  { label: "Other",                    value: "Other" },
];

const SEVERITY_LEVELS = ["Low", "Medium", "High"];

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "X-User-Id":   localStorage.getItem("userID")   || "",
    "X-User-Role": localStorage.getItem("userRole") || "",
  };
}

function formatBookingLabel(b) {
  const date = new Date(b.startTime.replace(" ", "T"))
    .toLocaleDateString([], { day: "numeric", month: "short" });
  return `${b.bookingID.slice(0, 8).toUpperCase()} — ${b.serviceTypeID}, ${date}`;
}

export default function HappyTailsReportIncident() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromBooking = location.state?.booking || null;
  const fromBookings = location.state?.bookings || null;

  const handleBack = () => {
    if (fromBooking) {
      navigate("/bookingDetails", { state: { booking: fromBooking, bookings: fromBookings } });
    } else {
      navigate(-1);
    }
  };

  const [incidentType, setIncidentType] = useState(INCIDENT_TYPES[0]);
  const [severity,     setSeverity]     = useState("Low");
  const [description,  setDescription]  = useState("");
  const [files,        setFiles]        = useState([]);

  const [bookings,        setBookings]        = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  const [typeOpen,     setTypeOpen]     = useState(false);
  const [bookingOpen,  setBookingOpen]  = useState(false);
  const [severityOpen, setSeverityOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  const fileRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/bookings`, { headers: getAuthHeaders() })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        // Only show accepted/completed bookings — you can only report on real bookings
        const valid = data.filter((b) => b.status === "accepted" || b.status === "completed");
        setBookings(valid);
        if (valid.length > 0) setSelectedBooking(valid[0]);
      })
      .catch(() => {})
      .finally(() => setBookingsLoading(false));
  }, []);

  const handleFiles = (newFiles) => {
    setFiles((prev) => [...prev, ...Array.from(newFiles).map((f) => f.name)]);
  };

  const handleSubmit = async () => {
    setError("");
    if (!selectedBooking) { setError("Please select a booking."); return; }
    if (!description.trim()) { setError("Please describe the incident."); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports/incident`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          bookingID:    selectedBooking.bookingID,
          incidentType: incidentType.value,
          severityLevel: severity,
          description:  description.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to submit report. Please try again.");
        return;
      }
      navigate("/reportSubmitted", { state: { incidentID: data.incidentID } });
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const closeAll = () => { setTypeOpen(false); setBookingOpen(false); setSeverityOpen(false); };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="ri-screen">

          {/* Header */}
          <header className="ri-header">
            <button className="ri-back" onClick={handleBack}>←</button>
            <h1 className="ri-title">🚨 Report an Incident</h1>
          </header>

          {/* Scrollable body */}
          <div className="ri-scroll">
            <div className="ri-body">

              {/* Emergency banner */}
              <div className="ri-emergency">
                <span className="ri-emergency-icon">⚠️</span>
                <span className="ri-emergency-text">
                  Emergency? Call 999 immediately if life is at risk.
                </span>
              </div>

              {/* Incident Type */}
              <div className="ri-field">
                <label className="ri-label">Incident Type</label>
                <div className="ri-select-wrap">
                  <button
                    className="ri-select-btn"
                    onClick={() => { setTypeOpen((o) => !o); setBookingOpen(false); setSeverityOpen(false); }}
                  >
                    <span>{incidentType.label}</span>
                    <span className={`ri-arrow${typeOpen ? " ri-arrow--open" : ""}`}>▼</span>
                  </button>
                  {typeOpen && (
                    <div className="ri-dropdown">
                      {INCIDENT_TYPES.map((t) => (
                        <button
                          key={t.value}
                          className={`ri-dropdown-item${incidentType.value === t.value ? " ri-dropdown-item--active" : ""}`}
                          onClick={() => { setIncidentType(t); setTypeOpen(false); }}
                        >{t.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Related Booking */}
              <div className="ri-field">
                <label className="ri-label">Related Booking</label>
                <div className="ri-select-wrap">
                  <button
                    className="ri-select-btn"
                    onClick={() => { setBookingOpen((o) => !o); setTypeOpen(false); setSeverityOpen(false); }}
                    disabled={bookingsLoading}
                  >
                    <span className="ri-select-truncate">
                      {bookingsLoading
                        ? "Loading bookings…"
                        : bookings.length === 0
                          ? "No bookings available"
                          : selectedBooking
                            ? formatBookingLabel(selectedBooking)
                            : "Select a booking"}
                    </span>
                    <span className={`ri-arrow${bookingOpen ? " ri-arrow--open" : ""}`}>▼</span>
                  </button>
                  {bookingOpen && bookings.length > 0 && (
                    <div className="ri-dropdown">
                      {bookings.map((b) => (
                        <button
                          key={b.bookingID}
                          className={`ri-dropdown-item${selectedBooking?.bookingID === b.bookingID ? " ri-dropdown-item--active" : ""}`}
                          onClick={() => { setSelectedBooking(b); setBookingOpen(false); }}
                        >{formatBookingLabel(b)}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Severity Level */}
              <div className="ri-field">
                <label className="ri-label">Severity Level</label>
                <div className="ri-select-wrap">
                  <button
                    className="ri-select-btn"
                    onClick={() => { setSeverityOpen((o) => !o); setTypeOpen(false); setBookingOpen(false); }}
                  >
                    <span>{severity}</span>
                    <span className={`ri-arrow${severityOpen ? " ri-arrow--open" : ""}`}>▼</span>
                  </button>
                  {severityOpen && (
                    <div className="ri-dropdown">
                      {SEVERITY_LEVELS.map((s) => (
                        <button
                          key={s}
                          className={`ri-dropdown-item${severity === s ? " ri-dropdown-item--active" : ""}`}
                          onClick={() => { setSeverity(s); setSeverityOpen(false); }}
                        >{s}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="ri-field">
                <label className="ri-label">Describe the Incident</label>
                <textarea
                  className="ri-textarea"
                  placeholder="Please describe what happened in detail..."
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setError(""); closeAll(); }}
                />
              </div>

              {/* File upload */}
              <div className="ri-field">
                <label className="ri-label">Upload Photos / Evidence (optional)</label>
                <div
                  className={`ri-dropzone${files.length > 0 ? " ri-dropzone--has-files" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                  onClick={() => fileRef.current?.click()}
                >
                  <span className="ri-upload-icon">📎</span>
                  <span className="ri-upload-text">Tap to attach files</span>
                  {files.length > 0 && (
                    <div className="ri-files-list">
                      {files.map((f, i) => (
                        <span key={i} className="ri-file-chip">{f}</span>
                      ))}
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    style={{ display: "none" }}
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </div>
              </div>

              {error && <p className="ri-error">{error}</p>}

            </div>
          </div>

          {/* Footer */}
          <div className="ri-footer">
            <button
              className={`ri-submit-btn${submitting ? " ri-submit-btn--loading" : ""}`}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "SUBMITTING…" : "SUBMIT INCIDENT REPORT"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
