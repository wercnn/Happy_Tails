import { useState } from "react";
import "./BookingDetails.css";

const BOOKING = {
  status: "Confirmed",
  title: "Dog Walking with James Walker",
  datetime: "9 April 2026 · 9:00 AM",
  reference: "#HT-20260409-001",
  pet: "Buddy (Golden Retriever)",
  service: "Dog Walking (60 min)",
  location: "Luton, LU1",
  totalPaid: "£23.10",
};

const STATUS_STYLE = {
  Confirmed:   { cls: "bd-status--confirmed",   label: "Confirmed" },
  Completed:   { cls: "bd-status--completed",   label: "Completed" },
  Cancelled:   { cls: "bd-status--cancelled",   label: "Cancelled" },
  Pending:     { cls: "bd-status--pending",     label: "Pending" },
};

const NAV = [
  { id: "home",     emoji: "🏠", label: "Home" },
  { id: "pets",     emoji: "🐾", label: "My Pets" },
  { id: "search",   emoji: "🔍", label: "Search" },
  { id: "bookings", emoji: "📋", label: "Bookings" },
  { id: "profile",  emoji: "👤", label: "Profile" },
];

export default function HappyTailsBookingDetails() {
  const [activeNav, setActiveNav] = useState("bookings");
  const [cancelled, setCancelled] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const status = cancelled ? "Cancelled" : BOOKING.status;
  const { cls, label } = STATUS_STYLE[status] || STATUS_STYLE.Confirmed;

  const handleCancel = () => {
    setCancelled(true);
    setShowConfirm(false);
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="bdet-screen">

          {/* Header */}
          <header className="bdet-header">
            <button className="bdet-back" onClick={() => alert("Go back")}>←</button>
            <h1 className="bdet-title">Booking Details</h1>
          </header>

          {/* Scrollable body */}
          <div className="bdet-scroll">
            <div className="bdet-body">

              {/* Hero card */}
              <div className="bdet-hero-card">
                <span className={`bdet-status ${cls}`}>{label}</span>
                <h2 className="bdet-hero-title">{BOOKING.title}</h2>
                <p className="bdet-hero-date">{BOOKING.datetime}</p>
              </div>

              {/* Detail rows */}
              <div className="bdet-info-card">
                {[
                  { label: "Reference", value: BOOKING.reference },
                  { label: "Pet",       value: BOOKING.pet },
                  { label: "Service",   value: BOOKING.service },
                  { label: "Location",  value: BOOKING.location },
                  { label: "Total Paid",value: BOOKING.totalPaid },
                ].map((row) => (
                  <div key={row.label} className="bdet-row">
                    <span className="bdet-row-label">{row.label}</span>
                    <span className="bdet-row-value">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Cancel booking */}
              {!cancelled && (
                !showConfirm ? (
                  <button
                    className="bdet-cancel-btn"
                    onClick={() => setShowConfirm(true)}
                  >
                    Cancel Booking
                  </button>
                ) : (
                  <div className="bdet-confirm-wrap">
                    <p className="bdet-confirm-text">Are you sure you want to cancel?</p>
                    <div className="bdet-confirm-actions">
                      <button className="bdet-confirm-yes" onClick={handleCancel}>Yes, Cancel</button>
                      <button className="bdet-confirm-no" onClick={() => setShowConfirm(false)}>Keep Booking</button>
                    </div>
                  </div>
                )
              )}

              {cancelled && (
                <div className="bdet-cancelled-notice">Booking has been cancelled.</div>
              )}

            </div>
          </div>

          {/* Bottom Nav */}
          <nav className="bdet-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`bdet-nav-item${activeNav === item.id ? " bdet-nav-item--active" : ""}`}
                onClick={() => setActiveNav(item.id)}
              >
                <span className="bdet-nav-emoji">{item.emoji}</span>
                <span className="bdet-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

        </div>
      </div>
    </div>
  );
}