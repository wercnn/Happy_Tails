import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./History.css";

const BOOKINGS = [
  {
    id: 1,
    emoji: "🚶",
    service: "Dog Walking",
    minder: "James Walker",
    date: "9 Apr 2026",
    status: "confirmed",
  },
  {
    id: 2,
    emoji: "🏠",
    service: "Pet Sitting",
    minder: "Priya Patel",
    date: "2 Apr 2026",
    status: "completed",
  },
  {
    id: 3,
    emoji: "🚶",
    service: "Dog Walking",
    minder: "Tom Hughes",
    date: "22 Mar 2026",
    status: "cancelled",
  },
];

const STATUS_STYLE = {
  confirmed: { cls: "bh-badge--confirmed", label: "confirmed" },
  completed: { cls: "bh-badge--completed", label: "completed" },
  cancelled: { cls: "bh-badge--cancelled", label: "cancelled" },
  pending: { cls: "bh-badge--pending", label: "pending" },
};

const NAV = [
  { id: "home", emoji: "🏠", label: "Home" },
  { id: "pets", emoji: "🐾", label: "My Pets" },
  { id: "search", emoji: "🔍", label: "Search" },
  { id: "bookings", emoji: "📋", label: "Bookings" },
  { id: "profile", emoji: "👤", label: "Profile" },
];

export default function HappyTailsBookingHistory() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("bookings");

  const handleNavClick = (id) => {
    setActiveNav(id);

    switch (id) {
      case "home":
        navigate("/ownerDash");
        break;
      case "pets":
        navigate("/ownerPets");
        break;
      case "search":
        navigate("/ownerSearch");
        break;
      case "bookings":
        navigate("/ownerBooking");
        break;
      case "profile":
        navigate("/profile");
        break;
      default:
        alert("Placeholder route");
        break;
    }
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="bh-screen">
          <header className="bh-header">
            <button className="bh-back" onClick={() => alert("Go back")}>←</button>
            <h1 className="bh-title">Booking History</h1>
          </header>

          <div className="bh-scroll">
            <div className="bh-body">
              {BOOKINGS.map((b) => {
                const { cls, label } = STATUS_STYLE[b.status] || STATUS_STYLE.pending;
                return (
                  <button
                    key={b.id}
                    className="bh-card"
                    onClick={() => alert(`View booking: ${b.service} with ${b.minder}`)}
                  >
                    <span className="bh-card-avatar">{b.emoji}</span>
                    <div className="bh-card-info">
                      <span className="bh-card-service">{b.service}</span>
                      <span className="bh-card-meta">with {b.minder}</span>
                      <span className="bh-card-date">{b.date}</span>
                    </div>
                    <span className={`bh-badge ${cls}`}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <nav className="bh-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`bh-nav-item${activeNav === item.id ? " bh-nav-item--active" : ""}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span className="bh-nav-emoji">{item.emoji}</span>
                <span className="bh-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}