import { useState } from "react";
import "./Cancel.css";

const REASONS = [
  "Change of plans",
  "Found another minder",
  "Pet is unwell",
  "Emergency",
  "Minder not suitable",
  "Other",
];

const BOOKING = {
  service: "Dog Walking",
  minder: "James Walker",
  date: "9 April 2026",
  time: "9:00 AM",
};

export default function HappyTailsCancelBooking() {
  const [reason, setReason] = useState(REASONS[0]);
  const [dropOpen, setDropOpen] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const handleConfirm = () => {
    setCancelled(true);
    alert(`Booking cancelled. Reason: ${reason}`);
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="cb-screen">

          {/* Header */}
          <header className="cb-header">
            <button className="cb-back" onClick={() => alert("Go back")}>←</button>
            <h1 className="cb-title">Cancel Booking</h1>
          </header>

          {/* Scrollable body */}
          <div className="cb-scroll">
            <div className="cb-body">

              {/* Warning icon */}
              <div className="cb-icon-wrap">
                <span className="cb-icon">⚠️</span>
              </div>

              {/* Heading */}
              <h2 className="cb-heading">Cancel this Booking?</h2>
              <p className="cb-sub">
                {BOOKING.service} with {BOOKING.minder} on {BOOKING.date} at {BOOKING.time}.
              </p>

              {/* Cancellation policy */}
              <div className="cb-policy-card">
                <span className="cb-policy-title">Cancellation Policy</span>
                <p className="cb-policy-text">
                  Free cancellation up to 24 hours before your booking. A fee may apply for late cancellations.
                </p>
              </div>

              {/* Reason dropdown */}
              <div className="cb-field">
                <label className="cb-field-label">Reason for Cancellation</label>
                <div className="cb-select-wrap">
                  <button
                    className="cb-select-btn"
                    onClick={() => setDropOpen((o) => !o)}
                  >
                    <span>{reason}</span>
                    <span className={`cb-arrow${dropOpen ? " cb-arrow--open" : ""}`}>▼</span>
                  </button>
                  {dropOpen && (
                    <div className="cb-dropdown">
                      {REASONS.map((r) => (
                        <button
                          key={r}
                          className={`cb-dropdown-item${reason === r ? " cb-dropdown-item--active" : ""}`}
                          onClick={() => { setReason(r); setDropOpen(false); }}
                        >{r}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="cb-actions">
                <button
                  className="cb-confirm-btn"
                  onClick={handleConfirm}
                  disabled={cancelled}
                >
                  {cancelled ? "Cancelled" : "Confirm Cancellation"}
                </button>
                <button
                  className="cb-keep-btn"
                  onClick={() => alert("Keeping booking")}
                >
                  KEEP BOOKING
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}