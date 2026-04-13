import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./RaiseDispute.css";

const API_BASE = "http://localhost:3000";

const DISPUTE_TYPES = {
  "Refund Request": "RefundRequest",
  "No Show Complaint": "NoShowComplaint",
  "Service Quality": "ServiceQuality",
  "Payment Dispute": "PaymentDispute",
  "Other": "Other",
};

const SEVERITY_LEVELS = ["Low", "Medium", "High"];

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "x-user-id": localStorage.getItem("userID") || "",
    "x-user-role": localStorage.getItem("userRole") || "",
  };
}

function toDate(dateStr) {
  return new Date(String(dateStr).replace(" ", "T"));
}

function formatDate(dateStr) {
  if (!dateStr) return "Not provided";
  return toDate(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateStr) {
  if (!dateStr) return "Not provided";
  return toDate(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function RaiseDispute() {
  const navigate = useNavigate();
  const location = useLocation();
  const passedBooking = location.state?.booking || null;
  const passedBookings = Array.isArray(location.state?.bookings) ? location.state.bookings : [];

  const booking = passedBooking || passedBookings[0] || null;

  const [disputeType, setDisputeType] = useState("Other");
  const [severityLevel, setSeverityLevel] = useState("Low");
  const [isRefundRequested, setIsRefundRequested] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const totalAmount = useMemo(() => {
    if (passedBookings.length === 0) return Number(booking?.totalCost || 0);
    return passedBookings.reduce((sum, b) => sum + Number(b.totalCost || 0), 0);
  }, [booking, passedBookings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!booking?.bookingID) {
      setError("Booking reference is missing.");
      return;
    }

    if (!reason.trim()) {
      setError("Please explain the dispute before sending.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(`${API_BASE}/api/disputes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          bookingID: booking.bookingID,
          disputeType,
          reason: reason.trim(),
          severityLevel,
          isRefundRequested,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit dispute.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Could not submit dispute.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!booking) {
    return (
      <div className="mobile-stage">
        <div className="mobile-frame">
          <div className="raise-dispute-screen">
            <header className="raise-dispute-header">
              <button type="button" className="raise-dispute-back" onClick={() => navigate("/ownerBooking")}>
                ←
              </button>
              <h1 className="raise-dispute-title">Raise Dispute</h1>
            </header>

            <div className="raise-dispute-body">
              <p className="raise-dispute-empty">No booking information found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mobile-stage">
        <div className="mobile-frame">
          <div className="raise-dispute-screen">
            <header className="raise-dispute-header">
              <h1 className="raise-dispute-title">Raise Dispute</h1>
            </header>

            <div className="raise-dispute-body raise-dispute-body--centered">
              <h2 className="raise-dispute-success-title">Dispute Submitted</h2>
              <p className="raise-dispute-success-text">
                Your dispute has been sent to support. We will review it shortly.
              </p>
              <button
                type="button"
                className="raise-dispute-home-btn"
                onClick={() => navigate("/ownerDash")}
              >
                Back to Owner Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="raise-dispute-screen">
          <header className="raise-dispute-header">
            <button type="button" className="raise-dispute-back" onClick={() => navigate("/ownerBooking")}>
              ←
            </button>
            <h1 className="raise-dispute-title">Raise Dispute</h1>
          </header>

          <div className="raise-dispute-scroll">
            <form className="raise-dispute-form" onSubmit={handleSubmit}>
              <section className="raise-dispute-card">
                <h2 className="raise-dispute-card-title">Booking Summary</h2>
                <p className="raise-dispute-row"><strong>Booking ID:</strong> {booking.bookingID}</p>
                <p className="raise-dispute-row"><strong>Date:</strong> {formatDate(booking.startTime)}</p>
                <p className="raise-dispute-row"><strong>Time:</strong> {formatTime(booking.startTime)}</p>
                <p className="raise-dispute-row"><strong>Total:</strong> £{Number(totalAmount || 0).toFixed(2)}</p>
              </section>

              <section className="raise-dispute-card">
                <h2 className="raise-dispute-card-title">Dispute Details</h2>

                <label className="raise-dispute-label" htmlFor="dispute-type">Dispute Type</label>
                <select
                  id="dispute-type"
                  className="raise-dispute-input"
                  value={disputeType}
                  onChange={(e) => setDisputeType(e.target.value)}
                >
                  {Object.entries(DISPUTE_TYPES).map(([label, value]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>

                <label className="raise-dispute-label" htmlFor="dispute-severity">Severity</label>
                <select
                  id="dispute-severity"
                  className="raise-dispute-input"
                  value={severityLevel}
                  onChange={(e) => setSeverityLevel(e.target.value)}
                >
                  {SEVERITY_LEVELS.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>

                <label className="raise-dispute-checkbox-row">
                  <input
                    type="checkbox"
                    checked={isRefundRequested}
                    onChange={(e) => setIsRefundRequested(e.target.checked)}
                  />
                  Request refund
                </label>

                <label className="raise-dispute-label" htmlFor="dispute-reason">Reason</label>
                <textarea
                  id="dispute-reason"
                  className="raise-dispute-textarea"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Tell us what happened..."
                  rows={5}
                />

                {error && <p className="raise-dispute-error">{error}</p>}

                <button type="submit" className="raise-dispute-submit" disabled={submitting}>
                  {submitting ? "Sending..." : "Send"}
                </button>
              </section>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
