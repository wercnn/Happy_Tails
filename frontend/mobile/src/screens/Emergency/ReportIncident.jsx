import { useState, useRef } from "react";
import "./ReportIncident.css";

const INCIDENT_TYPES = [
  "Pet Injury",
  "Property Damage",
  "Minder No-Show",
  "Inappropriate Behaviour",
  "Lost Pet",
  "Other",
];

const BOOKINGS = [
  "#HT-20260409-001 — Buddy, 9 Apr",
  "#HT-20260402-002 — Luna, 2 Apr",
  "#HT-20260322-003 — Buddy, 22 Mar",
];

export default function HappyTailsReportIncident() {
  const [incidentType,    setIncidentType]    = useState(INCIDENT_TYPES[0]);
  const [booking,         setBooking]         = useState(BOOKINGS[0]);
  const [description,     setDescription]     = useState("");
  const [files,           setFiles]           = useState([]);
  const [typeOpen,        setTypeOpen]        = useState(false);
  const [bookingOpen,     setBookingOpen]     = useState(false);
  const [dragging,        setDragging]        = useState(false);
  const fileRef = useRef(null);

  const handleFiles = (newFiles) => {
    setFiles((prev) => [...prev, ...Array.from(newFiles).map((f) => f.name)]);
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="ri-screen">

          {/* Header */}
          <header className="ri-header">
            <button className="ri-back" onClick={() => alert("Go back")}>←</button>
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
                    onClick={() => { setTypeOpen((o) => !o); setBookingOpen(false); }}
                  >
                    <span>{incidentType}</span>
                    <span className={`ri-arrow${typeOpen ? " ri-arrow--open" : ""}`}>▼</span>
                  </button>
                  {typeOpen && (
                    <div className="ri-dropdown">
                      {INCIDENT_TYPES.map((t) => (
                        <button
                          key={t}
                          className={`ri-dropdown-item${incidentType === t ? " ri-dropdown-item--active" : ""}`}
                          onClick={() => { setIncidentType(t); setTypeOpen(false); }}
                        >{t}</button>
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
                    onClick={() => { setBookingOpen((o) => !o); setTypeOpen(false); }}
                  >
                    <span className="ri-select-truncate">{booking}</span>
                    <span className={`ri-arrow${bookingOpen ? " ri-arrow--open" : ""}`}>▼</span>
                  </button>
                  {bookingOpen && (
                    <div className="ri-dropdown">
                      {BOOKINGS.map((b) => (
                        <button
                          key={b}
                          className={`ri-dropdown-item${booking === b ? " ri-dropdown-item--active" : ""}`}
                          onClick={() => { setBooking(b); setBookingOpen(false); }}
                        >{b}</button>
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
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* File upload */}
              <div className="ri-field">
                <label className="ri-label">Upload Photos / Evidence (optional)</label>
                <div
                  className={`ri-dropzone${dragging ? " ri-dropzone--active" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
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

            </div>
          </div>

          {/* Footer */}
          <div className="ri-footer">
            <button
              className="ri-submit-btn"
              onClick={() => alert("Incident report submitted!")}
            >
              SUBMIT INCIDENT REPORT
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}