import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Summary.css";

// Single-day booking example
const SINGLE_BOOKING = {
  service: "Dog Walking (60 min)",
  minder: "James Walker",
  pet: "Buddy",
  dates: [{ label: "Wednesday, 9 April 2026" }],
  multiDay: false,
  time: "9:00 AM",
  location: "Luton, LU1",
  serviceRate: 22.0,
  platformFeeRate: 0.05,
  nights: null,
};

// Multi-day booking example
const MULTI_BOOKING = {
  service: "Overnight Boarding",
  minder: "James Walker",
  pet: "Buddy",
  dates: [
    { label: "Monday, 14 April 2026" },
    { label: "Tuesday, 15 April 2026" },
    { label: "Wednesday, 16 April 2026" },
  ],
  multiDay: true,
  time: null,
  location: "Luton, LU1",
  serviceRate: 35.0,
  platformFeeRate: 0.05,
  nights: 3,
};

function BookingSummary({ booking }) {
  const subtotal = booking.multiDay
    ? booking.serviceRate * booking.nights
    : booking.serviceRate;
  const platformFee = +(subtotal * booking.platformFeeRate).toFixed(2);
  const total = +(subtotal + platformFee).toFixed(2);

  return (
    <div className="bs-summary">
      <div className="bs-card">
        <h2 className="bs-card-title">Booking Details</h2>

        <div className="bs-row">
          <span className="bs-label">Service</span>
          <span className="bs-value">{booking.service}</span>
        </div>

        <div className="bs-row">
          <span className="bs-label">Minder</span>
          <span className="bs-value">{booking.minder}</span>
        </div>

        <div className="bs-row">
          <span className="bs-label">Pet</span>
          <span className="bs-value">{booking.pet}</span>
        </div>

        {booking.multiDay ? (
          <>
            <div className="bs-row bs-row--top">
              <span className="bs-label">Dates</span>
              <div className="bs-dates-list">
                {booking.dates.map((d, i) => (
                  <span key={i} className="bs-value bs-date-item">{d.label}</span>
                ))}
              </div>
            </div>
            <div className="bs-row">
              <span className="bs-label">Nights</span>
              <span className="bs-value">{booking.nights} nights</span>
            </div>
          </>
        ) : (
          <div className="bs-row">
            <span className="bs-label">Date</span>
            <span className="bs-value">{booking.dates[0].label}</span>
          </div>
        )}

        {booking.time && (
          <div className="bs-row">
            <span className="bs-label">Time</span>
            <span className="bs-value">{booking.time}</span>
          </div>
        )}

        <div className="bs-row bs-row--last">
          <span className="bs-label">Location</span>
          <span className="bs-value">{booking.location}</span>
        </div>
      </div>

      <div className="bs-card">
        <h2 className="bs-card-title">Cost Breakdown</h2>

        <div className="bs-cost-row">
          <span className="bs-cost-label">
            {booking.service}
            {booking.multiDay ? ` × ${booking.nights} nights` : ""}
          </span>
          <span className="bs-cost-value">£{subtotal.toFixed(2)}</span>
        </div>

        <div className="bs-cost-row">
          <span className="bs-cost-label">Platform Fee (5%)</span>
          <span className="bs-cost-value">£{platformFee.toFixed(2)}</span>
        </div>

        <div className="bs-cost-row bs-cost-row--total">
          <span className="bs-total-label">Total</span>
          <span className="bs-total-value">£{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export default function HappyTailsBookingSummary() {
  const navigate = useNavigate();
  const location = useLocation();

  const minder = location.state?.minder || null;
  const service = location.state?.service || null;

  const [mode, setMode] = useState("single");

  const booking = (() => {
    const base = mode === "single" ? SINGLE_BOOKING : MULTI_BOOKING;

    return {
      ...base,
      minder: minder?.name || base.minder,
      service: service?.name || base.service,
      serviceRate: service?.price
        ? Number(String(service.price).replace("£", ""))
        : base.serviceRate,
      location: minder?.distance ? `${minder.distance} away` : base.location,
    };
  })();

  const handleBack = () => {
    navigate("/availabilityCalendar", {
      state: {
        minder,
        service,
      },
    });
  };

  const handleConfirmBooking = () => {
    navigate("/requestSent", {
      state: {
        minderName: booking.minder,
      },
    });
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="bs-screen">
          <header className="bs-header">
            <button className="bs-back" onClick={handleBack}>←</button>
            <h1 className="bs-title">Booking Summary</h1>
          </header>

          <div className="bs-toggle-row">
            <button
              className={`bs-toggle-btn${mode === "single" ? " bs-toggle-btn--active" : ""}`}
              onClick={() => setMode("single")}
            >
              Single Day
            </button>
            <button
              className={`bs-toggle-btn${mode === "multi" ? " bs-toggle-btn--active" : ""}`}
              onClick={() => setMode("multi")}
            >
              Multi Day
            </button>
          </div>

          <div className="bs-scroll">
            <div className="bs-body">
              <BookingSummary booking={booking} />
            </div>
          </div>

          <div className="bs-footer">
            <button
              className="bs-confirm-btn"
              onClick={handleConfirmBooking}
            >
              CONFIRM BOOKING →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}