import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./RaiseDispute.css";

const API_BASE = "http://localhost:3000";

const DISPUTE_TYPES = {
  RefundRequest: "Refund Request",
  NoShowComplaint: "No Show Complaint",
  ServiceQuality: "Service Quality",
  PaymentDispute: "Payment Dispute",
  Other: "Other",
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
    weekday: "long",
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

function formatDateShort(dateStr) {
  if (!dateStr) return "Not provided";
  return toDate(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getUniqueDates(bookings) {
  const seen = new Set();

  return bookings
    .map((b) => b.startTime)
    .filter((startTime) => {
      const key = String(startTime).slice(0, 10);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => toDate(a) - toDate(b));
}

function getServiceName(booking) {
  return booking?.serviceName || booking?.serviceTypeID || "Service";
}

function getMinderName(booking) {
  const fullName = [booking?.minderFirstName, booking?.minderLastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || booking?.minderName || "Pet minder";
}

function getPetName(booking) {
  return booking?.petName || booking?.pet || "Pet";
}

function CustomDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Select",
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!dropdownRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find((option) => option.value === value)?.label || placeholder;

  return (
    <div ref={dropdownRef} className={`raise-dispute-dropdown${open ? " raise-dispute-dropdown--open" : ""}`}>
      <button
        type="button"
        className="raise-dispute-select-btn"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{selectedLabel}</span>
        <span className={`raise-dispute-select-arrow${open ? " raise-dispute-select-arrow--open" : ""}`}>
          ▼
        </span>
      </button>

      {open && (
        <div className="raise-dispute-dropdown-menu">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`raise-dispute-dropdown-item${value === option.value ? " raise-dispute-dropdown-item--active" : ""}`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RaiseDispute() {
  const navigate = useNavigate();
  const location = useLocation();

  const passedBooking = location.state?.booking || null;
  const passedBookings = Array.isArray(location.state?.bookings)
    ? location.state.bookings
    : [];

  const bookings = useMemo(() => {
    if (passedBookings.length > 0) {
      return [...passedBookings].sort((a, b) => toDate(a.startTime) - toDate(b.startTime));
    }
    return passedBooking ? [passedBooking] : [];
  }, [passedBooking, passedBookings]);

  const booking = bookings[0] || null;

  const [disputeType, setDisputeType] = useState("Other");
  const [severityLevel, setSeverityLevel] = useState("Low");
  const [isRefundRequested, setIsRefundRequested] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const uniqueDates = useMemo(() => getUniqueDates(bookings), [bookings]);

  const totalAmount = useMemo(() => {
    if (!bookings.length) return 0;
    return bookings.reduce((sum, b) => sum + Number(b?.totalCost || 0), 0);
  }, [bookings]);

  const serviceName = getServiceName(booking);
  const minderName = getMinderName(booking);
  const petName = getPetName(booking);

  const disputeTypeOptions = Object.entries(DISPUTE_TYPES).map(([value, label]) => ({
    value,
    label,
  }));

  const severityOptions = SEVERITY_LEVELS.map((level) => ({
    value: level,
    label: level,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!booking?.bookingID) {
      setError("Booking reference is missing.");
      return;
    }

    if (!reason.trim()) {
      setError("Please provide a clear explanation before submitting your dispute.");
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
              <button
                type="button"
                className="raise-dispute-back"
                onClick={() => navigate("/ownerBooking")}
              >
                ←
              </button>
              <h1 className="raise-dispute-title">Raise Dispute</h1>
            </header>

            <div className="raise-dispute-body raise-dispute-body--centered">
              <div className="raise-dispute-empty-card">
                <h2 className="raise-dispute-success-title">No Booking Found</h2>
                <p className="raise-dispute-success-text">
                  We could not find the booking details needed to raise a dispute.
                </p>
                <button
                  type="button"
                  className="raise-dispute-home-btn"
                  onClick={() => navigate("/ownerBooking")}
                >
                  Back to Bookings
                </button>
              </div>
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
              <div className="raise-dispute-success-card">
                <div className="raise-dispute-success-icon">✓</div>
                <h2 className="raise-dispute-success-title">Dispute Submitted</h2>
                <p className="raise-dispute-success-text">
                  Your dispute has been submitted successfully. Our support team will
                  review the details and contact you if any further information is needed.
                </p>

                <div className="raise-dispute-success-summary">
                  <p><strong>Booking:</strong> {booking.bookingID}</p>
                  <p><strong>Service:</strong> {serviceName}</p>
                  <p><strong>Total:</strong> £{Number(totalAmount || 0).toFixed(2)}</p>
                </div>

                <button
                  type="button"
                  className="raise-dispute-home-btn"
                  onClick={() => navigate("/ownerBooking")}
                >
                  Back to Bookings
                </button>
              </div>
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
            <button
              type="button"
              className="raise-dispute-back"
              onClick={() => navigate(-1)}
            >
              ←
            </button>
            <h1 className="raise-dispute-title">Raise Dispute</h1>
          </header>

          <div className="raise-dispute-scroll">
            <form className="raise-dispute-form" onSubmit={handleSubmit}>
              <section className="raise-dispute-hero-card">
                <span className="raise-dispute-eyebrow">Support Request</span>
                <h2 className="raise-dispute-hero-title">Tell us what went wrong</h2>
                <p className="raise-dispute-hero-text">
                  Submit a dispute for this booking and our support team will review it.
                </p>
              </section>

              <section className="raise-dispute-card">
                <h2 className="raise-dispute-card-title">Booking Summary</h2>

                <div className="raise-dispute-row">
                  <span className="raise-dispute-row-label">Booking ID</span>
                  <span className="raise-dispute-row-value">{booking.bookingID}</span>
                </div>

                <div className="raise-dispute-row">
                  <span className="raise-dispute-row-label">Service</span>
                  <span className="raise-dispute-row-value">{serviceName}</span>
                </div>

                <div className="raise-dispute-row">
                  <span className="raise-dispute-row-label">Minder</span>
                  <span className="raise-dispute-row-value">{minderName}</span>
                </div>

                <div className="raise-dispute-row">
                  <span className="raise-dispute-row-label">Pet</span>
                  <span className="raise-dispute-row-value">{petName}</span>
                </div>

                <div className="raise-dispute-row raise-dispute-row--top">
                  <span className="raise-dispute-row-label">Dates</span>
                  <div className="raise-dispute-row-stack">
                    {uniqueDates.map((dateStr) => (
                      <span key={dateStr} className="raise-dispute-row-value">
                        {formatDateShort(dateStr)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="raise-dispute-row">
                  <span className="raise-dispute-row-label">Time</span>
                  <span className="raise-dispute-row-value">
                    {formatTime(booking.startTime)}
                  </span>
                </div>

                <div className="raise-dispute-row">
                  <span className="raise-dispute-row-label">Total</span>
                  <span className="raise-dispute-row-value">
                    £{Number(totalAmount || 0).toFixed(2)}
                  </span>
                </div>
              </section>

              <section className="raise-dispute-card">
                <h2 className="raise-dispute-card-title">Dispute Details</h2>
                <p className="raise-dispute-helper">
                  Please provide accurate information so we can investigate properly.
                </p>

                <label className="raise-dispute-label">Dispute Type</label>
                <CustomDropdown
                  value={disputeType}
                  options={disputeTypeOptions}
                  onChange={setDisputeType}
                  placeholder="Select dispute type"
                />

                <label className="raise-dispute-label">Severity Level</label>
                <CustomDropdown
                  value={severityLevel}
                  options={severityOptions}
                  onChange={setSeverityLevel}
                  placeholder="Select severity"
                />

                <label className="raise-dispute-checkbox-row">
                  <input
                    type="checkbox"
                    checked={isRefundRequested}
                    onChange={(e) => setIsRefundRequested(e.target.checked)}
                  />
                  <span>Request a refund as part of this dispute</span>
                </label>

                <label className="raise-dispute-label" htmlFor="dispute-reason">
                  Explain the Issue
                </label>
                <textarea
                  id="dispute-reason"
                  className="raise-dispute-textarea"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please describe what happened, including any important details support should know."
                  rows={6}
                />

                {error && <p className="raise-dispute-error">{error}</p>}

                <button
                  type="submit"
                  className="raise-dispute-submit"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Dispute"}
                </button>
              </section>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}