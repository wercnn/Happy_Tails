import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Accept.css";

const API_BASE = "http://localhost:3000";

const SERVICE_NAMES = {
  "st-walk":    "Dog Walking",
  "st-board":   "Pet Boarding",
  "st-daycare": "Dog Daycare",
};

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "X-User-Id":   localStorage.getItem("userID")   || "",
    "X-User-Role": localStorage.getItem("userRole") || "",
  };
}

function formatDatetime(dateStr) {
  return new Date(dateStr.replace(" ", "T")).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function HappyTailsBookingDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const booking = location.state?.booking || null;

  const [status, setStatus]   = useState(booking?.status || null);
  const [acting, setActing]   = useState(false);

  if (!booking) {
    return (
      <div className="mobile-stage">
        <div className="mobile-frame">
          <div className="bd-screen">
            <header className="bd-header">
              <button className="bd-back" onClick={() => navigate("/mindRequests")}>←</button>
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

  const handleAccept = async () => {
    setActing(true);
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${booking.bookingID}/accept`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to accept (${res.status})`);
      }
      setStatus("accepted");

      const serviceName = SERVICE_NAMES[booking.serviceTypeID] || booking.serviceTypeID;
      const startDate = formatDatetime(booking.startTime);
      await fetch(`${API_BASE}/api/notifications`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ownerID: booking.ownerID,
          title: "Booking Accepted",
          body: `Your booking for ${serviceName} on ${startDate} has been accepted by your minder.`,
          channel: "in-app",
        }),
      });
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActing(false);
    }
  };

  const handleDecline = async () => {
    setActing(true);
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${booking.bookingID}/reject`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to decline (${res.status})`);
      }
      setStatus("rejected");
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActing(false);
    }
  };

  const rows = [
    { label: "Booking ID",  value: `#${booking.bookingID.slice(0, 8)}` },
    { label: "Service",     value: SERVICE_NAMES[booking.serviceTypeID] || booking.serviceTypeID },
    { label: "Start",       value: formatDatetime(booking.startTime) },
    { label: "End",         value: formatDatetime(booking.endTime) },
    { label: "Total Cost",  value: `£${Number(booking.totalCost).toFixed(2)}` },
    booking.ownerNotes
      ? { label: "Notes", value: booking.ownerNotes }
      : null,
  ].filter(Boolean);

  const isPending = status === "pending";
  const isDone    = status === "accepted" || status === "rejected";

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="bd-screen">
          <header className="bd-header">
            <button className="bd-back" onClick={() => navigate("/mindRequests")}>←</button>
            <h1 className="bd-title">Booking Request</h1>
          </header>

          <div className="bd-scroll">
            <div className="bd-body">
              <div className="bd-details-card">
                <h2 className="bd-details-heading">Request Details</h2>

                {rows.map((row) => (
                  <div key={row.label} className="bd-detail-row">
                    <span className="bd-detail-label">{row.label}</span>
                    <span className="bd-detail-value">{row.value}</span>
                  </div>
                ))}

                {isDone && (
                  <div className="bd-detail-row">
                    <span className="bd-detail-label">Status</span>
                    <span className="bd-detail-value" style={{ textTransform: "capitalize" }}>
                      {status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bd-footer">
            <button
              className={`bd-accept-btn${status === "accepted" ? " bd-btn--done" : ""}`}
              onClick={handleAccept}
              disabled={acting || isDone || !isPending}
            >
              ✓ Accept
            </button>
            <button
              className={`bd-decline-btn${status === "rejected" ? " bd-btn--done" : ""}`}
              onClick={handleDecline}
              disabled={acting || isDone || !isPending}
            >
              ✕ Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
