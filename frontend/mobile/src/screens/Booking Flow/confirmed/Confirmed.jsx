import "./Confirmed.css";

const BOOKING = {
  minder: "James Walker",
  date: "9 April",
  time: "9:00 AM",
  reference: "#HT-20260409-001",
};

export default function HappyTailsBookingConfirmed() {
  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="bc-screen">

          <div className="bc-body">

            {/* Success icon */}
            <div className="bc-icon-wrap">
              <span className="bc-check">✓</span>
            </div>

            {/* Heading */}
            <h1 className="bc-heading">Booking Confirmed!</h1>
            <p className="bc-sub">
              Your booking with <strong>{BOOKING.minder}</strong> on{" "}
              {BOOKING.date} at {BOOKING.time} has been confirmed.
            </p>

            {/* Reference card */}
            <div className="bc-ref-card">
              <span className="bc-ref-label">Booking Reference</span>
              <span className="bc-ref-value">{BOOKING.reference}</span>
            </div>

            {/* Actions */}
            <div className="bc-actions">
              <button
                className="bc-primary-btn"
                onClick={() => alert("Navigate to My Bookings")}
              >
                VIEW MY BOOKINGS
              </button>
              <button
                className="bc-secondary-btn"
                onClick={() => alert("Navigate to Home")}
              >
                BACK TO HOME
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}