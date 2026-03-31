import { useState } from "react";
import "./Requests.css";

const INITIAL_REQUESTS = [
  {
    id: 1,
    icon: "🐾",
    service: "Dog Walking (60 mins)",
    status: "pending",
    petEmoji: "🐶",
    pet: "Buddy",
    owner: "Sarah J.",
    date: "9 Apr, 9:00 AM",
  },
  {
    id: 2,
    icon: "🐾",
    service: "Dog Walk (1 hour)",
    status: "awaiting",
    petEmoji: "🐕",
    pet: "Max",
    owner: "Emily R.",
    date: "12 Apr, 2:00 PM",
  },
  {
    id: 3,
    icon: "🐈‍⬛",
    service: "Pet Walk (60 min)",
    status: "in progress",
    petEmoji: "🐕",
    pet: "Charlie",
    owner: "Anna K.",
    date: "15 Apr, 7:30 AM",
  },
];

const STATUS_CLASS = {
  "pending":     "br-badge--pending",
  "awaiting":    "br-badge--awaiting",
  "in progress": "br-badge--inprogress",
  "confirmed":   "br-badge--confirmed",
};

const NAV = [
  { id: "dashboard",    emoji: "🏠",  label: "Dashboard" },
  { id: "services",     emoji: "⚙️",  label: "Services" },
  { id: "availability", emoji: "📅",  label: "Availability" },
  { id: "requests",     emoji: "📬",  label: "Requests" },
  { id: "profile",      emoji: "👤",  label: "Profile" },
];

export default function HappyTailsBookingRequests() {
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [activeNav, setActiveNav] = useState("dashboard");

  const handleAction = (id, action) => {
    if (action === "accept") {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "confirmed" } : r))
      );
    } else {
      setRequests((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="br-screen">

          {/* Header */}
          <header className="br-header">
            <button className="br-back" onClick={() => alert("Go back")}>←</button>
            <h1 className="br-title">Booking Requests</h1>
          </header>

          {/* Scrollable body */}
          <div className="br-scroll">
            <div className="br-body">
              {requests.map((r) => (
                <div key={r.id} className="br-card">

                  {/* Top row */}
                  <div className="br-card-top">
                    <span className="br-card-avatar">{r.icon}</span>
                    <span className="br-card-service">{r.service}</span>
                    <span className={`br-badge ${STATUS_CLASS[r.status] || ""}`}>
                      {r.status}
                    </span>
                  </div>

                  {/* Detail rows */}
                  <div className="br-card-details">
                    <span className="br-detail">{r.petEmoji} {r.pet} · {r.owner}</span>
                    <span className="br-detail">📅 {r.date}</span>
                  </div>

                  {/* Actions */}
                  <div className="br-card-actions">
                    <button
                      className="br-accept-btn"
                      onClick={() => handleAction(r.id, "accept")}
                    >
                      ✓ Accept
                    </button>
                    <button
                      className="br-decline-btn"
                      onClick={() => handleAction(r.id, "decline")}
                    >
                      ✕ Decline
                    </button>
                  </div>

                </div>
              ))}

              {requests.length === 0 && (
                <p className="br-empty">No booking requests</p>
              )}
            </div>
          </div>

          {/* Bottom Nav */}
          <nav className="br-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`br-nav-item${activeNav === item.id ? " br-nav-item--active" : ""}`}
                onClick={() => setActiveNav(item.id)}
              >
                <span className="br-nav-emoji">{item.emoji}</span>
                <span className="br-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

        </div>
      </div>
    </div>
  );
}