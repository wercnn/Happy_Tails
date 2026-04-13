import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./MeetAndGreet.css";

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export default function MeetAndGreet() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const {
    minder, service, selectedSlots, selectedTime,
    selectedDateKeys, pet, petData, notes,
  } = location.state || {};

  const [showForm, setShowForm]           = useState(false);
  const [date, setDate]                   = useState("");
  const [time, setTime]                   = useState("");
  const [isVirtual, setIsVirtual]         = useState(false);
  const [locationOrLink, setLocationOrLink] = useState("");
  const [note, setNote]                   = useState("");

  const summaryState = { minder, service, selectedSlots, selectedTime, selectedDateKeys, pet, petData, notes };

  const handleNo = () => {
    navigate("/bookingSummary", { state: { ...summaryState, meetAndGreet: null } });
  };

  const handleBack = () => {
    if (showForm) {
      setShowForm(false);
    } else {
      navigate("/availabilityCalendar", {
        state: { minder, service, timeSlot: selectedTime, pet, petData, notes },
      });
    }
  };

  const handleConfirm = () => {
    if (!date || !time) return;
    navigate("/bookingSummary", {
      state: {
        ...summaryState,
        meetAndGreet: {
          scheduledTime:        `${date}T${time}:00`,
          isVirtual,
          meetingLinkOrLocation: locationOrLink.trim() || null,
          note:                  note.trim() || null,
        },
      },
    });
  };

  const canConfirm = Boolean(date && time);

  // ── Question view ─────────────────────────────────────────────────────────
  if (!showForm) {
    return (
      <div className="mobile-stage">
        <div className="mobile-frame">
          <div className="mag-screen">
            <header className="mag-header">
              <button className="mag-back" type="button" onClick={handleBack}>←</button>
              <h1 className="mag-title">Meet &amp; Greet</h1>
            </header>

            <div className="mag-question-body">
              <div className="mag-icon">🐾</div>

              <h2 className="mag-question-heading">
                Would you like a meet &amp; greet?
              </h2>

              <p className="mag-question-desc">
                A meet &amp; greet is a short introductory session before your booking starts,
                giving your pet a chance to get comfortable with the minder in advance.
              </p>

              <div className="mag-question-actions">
                <button className="mag-yes-btn" type="button" onClick={() => setShowForm(true)}>
                  Yes, I'd like one
                </button>
                <button className="mag-no-btn" type="button" onClick={handleNo}>
                  No, skip for now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form view ─────────────────────────────────────────────────────────────
  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="mag-screen">
          <header className="mag-header">
            <button className="mag-back" type="button" onClick={handleBack}>←</button>
            <h1 className="mag-title">Meet &amp; Greet Details</h1>
          </header>

          <div className="mag-form-scroll">
            <div className="mag-form">

              <div className="mag-field">
                <label className="mag-label">Date</label>
                <input
                  type="date"
                  className="mag-input"
                  value={date}
                  min={getToday()}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="mag-field">
                <label className="mag-label">Time</label>
                <input
                  type="time"
                  className="mag-input"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>

              <div className="mag-field">
                <label className="mag-label">Meeting Type</label>
                <div className="mag-type-toggle">
                  <button
                    type="button"
                    className={`mag-type-btn${!isVirtual ? " mag-type-btn--active" : ""}`}
                    onClick={() => setIsVirtual(false)}
                  >
                    🏠 In-Person
                  </button>
                  <button
                    type="button"
                    className={`mag-type-btn${isVirtual ? " mag-type-btn--active" : ""}`}
                    onClick={() => setIsVirtual(true)}
                  >
                    💻 Virtual
                  </button>
                </div>
              </div>

              <div className="mag-field">
                <label className="mag-label">
                  {isVirtual ? "Meeting Link" : "Location"}
                  <span className="mag-optional"> (optional)</span>
                </label>
                <input
                  type="text"
                  className="mag-input"
                  value={locationOrLink}
                  placeholder={isVirtual ? "e.g. Zoom / Teams link" : "e.g. 12 Oak Street, London"}
                  onChange={(e) => setLocationOrLink(e.target.value)}
                />
              </div>

              <div className="mag-field">
                <label className="mag-label">
                  Note<span className="mag-optional"> (optional)</span>
                </label>
                <textarea
                  className="mag-textarea"
                  rows={3}
                  value={note}
                  placeholder="Any details you'd like the minder to know beforehand…"
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

            </div>
          </div>

          <div className="mag-footer">
            <button
              className="mag-confirm-btn"
              type="button"
              disabled={!canConfirm}
              onClick={handleConfirm}
            >
              CONFIRM MEET &amp; GREET →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
