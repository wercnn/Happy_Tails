import { useState } from "react";
import "./Accept.css";

const REQUEST = {
  owner:    "Sarah Johnson",
  pet:      "Buddy (Golden Retriever)",
  service:  "Dog Walking (60 mins)",
  dateTime: "9 Apr 2026, 9:00 AM",
  location: "Luton, LU1",
  payout:   "£20.90 (after fees)",
  message:  "Buddy is a friendly, playful dog. He loves fetch and is great with other dogs. Please give him his water on return!",
  from:     "Sarah",
};

export default function HappyTailsBookingDetail() {
  const [status, setStatus] = useState(null); // null | "accepted" | "declined"

  const handleAccept  = () => { setStatus("accepted");  alert("Booking accepted!"); };
  const handleDecline = () => { setStatus("declined");  alert("Booking declined."); };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="bd-screen">

          {/* Header */}
          <header className="bd-header">
            <button className="bd-back" onClick={() => alert("Go back")}>←</button>
            <h1 className="bd-title">Booking Request</h1>
          </header>

          {/* Scrollable body */}
          <div className="bd-scroll">
            <div className="bd-body">

              {/* Request Details card */}
              <div className="bd-details-card">
                <h2 className="bd-details-heading">Request Details</h2>
                {[
                  { label: "Owner",      value: REQUEST.owner },
                  { label: "Pet",        value: REQUEST.pet },
                  { label: "Service",    value: REQUEST.service },
                  { label: "Date & Time",value: REQUEST.dateTime },
                  { label: "Location",   value: REQUEST.location },
                  { label: "Payout",     value: REQUEST.payout },
                ].map((row) => (
                  <div key={row.label} className="bd-detail-row">
                    <span className="bd-detail-label">{row.label}</span>
                    <span className="bd-detail-value">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Message card */}
              <div className="bd-message-card">
                <h3 className="bd-message-heading">Message from {REQUEST.from}</h3>
                <p className="bd-message-text">"{REQUEST.message}"</p>
              </div>

            </div>
          </div>

          {/* Sticky footer actions */}
          <div className="bd-footer">
            <button
              className={`bd-accept-btn${status === "accepted" ? " bd-btn--done" : ""}`}
              onClick={handleAccept}
              disabled={!!status}
            >
              ✓ Accept
            </button>
            <button
              className={`bd-decline-btn${status === "declined" ? " bd-btn--done" : ""}`}
              onClick={handleDecline}
              disabled={!!status}
            >
              ✕ Decline
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}