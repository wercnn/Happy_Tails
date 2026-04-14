import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./bookingDetail.css";

function toDate(dateStr) {
  return new Date(String(dateStr).replace(" ", "T"));
}

function formatDate(dateStr) {
  return toDate(dateStr).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(dateStr) {
  return toDate(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateStr) {
  return toDate(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getStatusLabel(status) {
  const s = String(status || "").toLowerCase();

  if (s === "pending") return "Pending";
  if (s === "accepted") return "Confirmed";
  if (s === "completed") return "Completed";
  if (s === "cancelled") return "Cancelled";
  if (s === "rejected") return "Rejected";

  return status || "Unknown";
}

function getServiceName(item) {
  return item?.serviceName || item?.serviceTypeID || "Service";
}

function getPetName(item) {
  return item?.petName || item?.pet || item?.name || "Pet";
}

function getMinderName(item) {
  const full = [item?.minderFirstName, item?.minderLastName].filter(Boolean).join(" ").trim();
  return full || item?.minderName || "Pet minder";
}

function getLocationText(item) {
  const parts = [
    item?.street,
    item?.city,
    item?.postcode,
    item?.country,
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "Not provided";
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

function formatSelectedTimeLabel(timeLabel) {
  if (!timeLabel || typeof timeLabel !== "string") return "";

  const trimmed = timeLabel.trim();

  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;

  const [timePart, meridiem] = trimmed.split(" ");
  if (!timePart || !meridiem) return trimmed;

  let [hours, minutes] = timePart.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return trimmed;

  if (meridiem.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (meridiem.toUpperCase() === "AM" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getDisplayedTime(booking) {
  if (booking?.selectedTime) {
    return formatSelectedTimeLabel(booking.selectedTime);
  }

  return booking?.startTime ? formatTime(booking.startTime) : "Not provided";
}

export default function HappyTailsOwnerViewDetails() {
  const navigate = useNavigate();
  const location = useLocation();

  const stateBookings = location.state?.bookings;
  const stateBooking = location.state?.booking;

  const bookings = useMemo(() => {
    if (Array.isArray(stateBookings) && stateBookings.length > 0) {
      return [...stateBookings].sort((a, b) => toDate(a.startTime) - toDate(b.startTime));
    }

    if (stateBooking) return [stateBooking];

    return [];
  }, [stateBookings, stateBooking]);

  const primary = bookings[0] || null;

  const uniqueDates = useMemo(() => getUniqueDates(bookings), [bookings]);

  if (!primary) {
    return (
      <div className="mobile-stage">
        <div className="mobile-frame">
          <div className="ovd-screen">
            <header className="ovd-header">
              <button
                className="ovd-back"
                type="button"
                onClick={() => navigate("/ownerBooking")}
              >
                ←
              </button>
              <h1 className="ovd-title">Booking Details</h1>
            </header>

            <div className="ovd-body">
              <div className="ovd-empty-card">
                <p className="ovd-empty-text">No booking details were provided.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const serviceName = getServiceName(primary);
  const petName = getPetName(primary);
  const minderName = getMinderName(primary);
  const statusLabel = getStatusLabel(primary?.status);
  const locationText = getLocationText(primary);
  const notes = primary?.ownerNotes || "No notes provided";

  const subtotal = bookings.reduce((sum, b) => sum + Number(b.totalCost || 0), 0);
  const platformFee = Number((subtotal * 0.05).toFixed(2));
  const total = Number((subtotal + platformFee).toFixed(2));

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="ovd-screen">
          <header className="ovd-header">
            <button
              className="ovd-back"
              type="button"
              onClick={() => navigate("/ownerBooking")}
            >
              ←
            </button>
            <h1 className="ovd-title">Booking Details</h1>
          </header>

          <div className="ovd-scroll">
            <div className="ovd-body">
              <section className="ovd-hero-card">
                <div className="ovd-hero-top">
                  <div>
                    <span className="ovd-eyebrow">Your Booking</span>
                    <h2 className="ovd-hero-title">{serviceName}</h2>
                  </div>

                  <span className={`ovd-status ovd-status--${String(primary.status || "").toLowerCase()}`}>
                    {statusLabel}
                  </span>
                </div>

                <div className="ovd-hero-meta">
                  <div className="ovd-chip">Minder: {minderName}</div>
                  <div className="ovd-chip">Pet: {petName}</div>
                  <div className="ovd-chip">Time: {getDisplayedTime(primary)}</div>
                </div>
              </section>

              <section className="ovd-card">
                <h3 className="ovd-card-title">Booking Information</h3>

                <div className="ovd-row">
                  <span className="ovd-label">Service</span>
                  <span className="ovd-value">{serviceName}</span>
                </div>

                <div className="ovd-row">
                  <span className="ovd-label">Minder</span>
                  <span className="ovd-value">{minderName}</span>
                </div>

                <div className="ovd-row">
                  <span className="ovd-label">Pet</span>
                  <span className="ovd-value">{petName}</span>
                </div>

                <div className="ovd-row ovd-row--top">
                  <span className="ovd-label">Dates</span>
                  <div className="ovd-value ovd-value--stack">
                    {uniqueDates.map((dateStr) => (
                      <span key={dateStr}>{formatDate(dateStr)}</span>
                    ))}
                  </div>
                </div>

                <div className="ovd-row">
                  <span className="ovd-label">Chosen time</span>
                  <span className="ovd-value">{getDisplayedTime(primary)}</span>
                </div>

                <div className="ovd-row">
                  <span className="ovd-label">Location</span>
                  <span className="ovd-value ovd-value--wrap">{locationText}</span>
                </div>

                <div className="ovd-row">
                  <span className="ovd-label">Status</span>
                  <span className="ovd-value">{statusLabel}</span>
                </div>
              </section>

              <section className="ovd-card">
                <h3 className="ovd-card-title">Notes</h3>
                <p className="ovd-notes">{notes}</p>
              </section>

              <section className="ovd-card">
                <h3 className="ovd-card-title">Price Summary</h3>

                <div className="ovd-row">
                  <span className="ovd-label">Dates booked</span>
                  <span className="ovd-value">{uniqueDates.length}</span>
                </div>

                <div className="ovd-row">
                  <span className="ovd-label">Booking subtotal</span>
                  <span className="ovd-value">£{subtotal.toFixed(2)}</span>
                </div>

                <div className="ovd-row">
                  <span className="ovd-label">Platform fee</span>
                  <span className="ovd-value">£{platformFee.toFixed(2)}</span>
                </div>

                <div className="ovd-row ovd-row--top">
                  <span className="ovd-label">Booked dates</span>
                  <div className="ovd-value ovd-value--stack">
                    {uniqueDates.map((dateStr) => (
                      <span key={`short-${dateStr}`}>{formatDateShort(dateStr)}</span>
                    ))}
                  </div>
                </div>

                <div className="ovd-row">
                  <span className="ovd-label">Total</span>
                  <span className="ovd-value ovd-value--total">£{total.toFixed(2)}</span>
                </div>
              </section>
            </div>
          </div>

          <div className="ovd-footer">
            <button
              className="ovd-secondary-btn"
              type="button"
              onClick={() =>
                navigate("/raiseDispute", {
                  state: { booking: primary, bookings, grouped: bookings.length > 1 },
                })
              }
            >
              Raise Dispute
            </button>

            <button
              className="ovd-primary-btn"
              type="button"
              onClick={() => navigate("/ownerBooking")}
            >
              Back to Bookings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}