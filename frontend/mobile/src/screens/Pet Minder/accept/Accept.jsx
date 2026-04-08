import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Accept.css";

export default function HappyTailsBookingDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const request = location.state?.request || null;

  const [status, setStatus] = useState(null); // null | "accepted" | "declined"

  if (!request) {
    return (
      <div className="mobile-stage">
        <div className="mobile-frame">
          <div className="bd-screen">
            <header className="bd-header">
              <button className="bd-back" onClick={() => navigate("/mindRequests")}>
                ←
              </button>
              <h1 className="bd-title">Booking Request</h1>
            </header>

            <div className="bd-scroll">
              <div className="bd-body">
                <div className="bd-details-card">
                  <h2 className="bd-details-heading">Request not found</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const requestDetails = {
    owner: request.owner,
    pet: `${request.pet} (${request.petType})`,
    service: request.service,
    dateTime: formatDate(request.date),
    location: "Luton, LU1",
    payout: "£20.90 (after fees)",
    from: request.owner,
  };

  const handleAccept = () => {
    setStatus("accepted");
    alert("Booking accepted!");
  };

  const handleDecline = () => {
    setStatus("declined");
    alert("Booking declined.");
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="bd-screen">
          <header className="bd-header">
            <button className="bd-back" onClick={() => navigate("/mindRequests")}>
              ←
            </button>
            <h1 className="bd-title">Booking Request</h1>
          </header>

          <div className="bd-scroll">
            <div className="bd-body">
              <div className="bd-details-card">
                <h2 className="bd-details-heading">Request Details</h2>

                {[
                  { label: "Owner", value: requestDetails.owner },
                  { label: "Pet", value: requestDetails.pet },
                  { label: "Service", value: requestDetails.service },
                  { label: "Date & Time", value: requestDetails.dateTime },
                  { label: "Location", value: requestDetails.location },
                  { label: "Payout", value: requestDetails.payout },
                ].map((row) => (
                  <div key={row.label} className="bd-detail-row">
                    <span className="bd-detail-label">{row.label}</span>
                    <span className="bd-detail-value">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

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