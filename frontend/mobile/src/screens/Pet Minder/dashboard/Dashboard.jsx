import { useState } from "react";
import "./Dashboard.css";

const STATS = [
  { emoji: "📅", value: "3", label: "NEW\nREQUESTS" },
  { emoji: "💼", value: "5", label: "THIS WEEK" },
  { emoji: "⭐", value: "4.9", label: "RATING" },
];

const REQUESTS = [
  {
    id: 1, type: "Dog", service: "Walking",
    petEmoji: "🐕", petName: "Buddy",
    owner: "Sarah J.", day: "Today", time: "9am",
  },
  {
    id: 2, type: "Cat", service: "Sleeping",
    petEmoji: "🐕", petName: "Whiskers",
    owner: "John D.", day: "Thursday", time: "3pm",
  },
];

const SCHEDULE = [
  { id: 1, time: "9:00 AM",  service: "Dog Walking",  detail: "Buddy (Sarah J.)" },
  { id: 2, time: "2:00 PM",  service: "Pet Sitting",  detail: "Whiskers (Mike T.)" },
  { id: 3, time: "4:30 PM",  service: "Dog Walking",  detail: "Buddy (Sarah L.)" },
];

const NAV = [
  { id: "dashboard",   emoji: "🏠",  label: "Dashboard" },
  { id: "services",    emoji: "⚙️",  label: "Services" },
  { id: "availability",emoji: "📅",  label: "Availability" },
  { id: "requests",    emoji: "📬",  label: "Requests" },
  { id: "profile",     emoji: "👤",  label: "Profile" },
];

export default function HappyTailsMinderDashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [requests, setRequests] = useState(REQUESTS);

  const handleRequest = (id, action) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    alert(`Request ${action}ed!`);
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="md-screen">

          {/* ── Orange Header ── */}
          <header className="md-header">
            <div className="md-greeting-block">
              <h1 className="md-greeting">Welcome back 👋</h1>
              <p className="md-name">James Walker</p>
            </div>
            <button className="md-status-btn">
              <span className="md-status-dot" />
              Active
            </button>
          </header>

          {/* ── Scrollable Body ── */}
          <div className="md-scroll">

            {/* Stats row */}
            <div className="md-stats-row">
              {STATS.map((s) => (
                <div key={s.label} className="md-stat-card">
                  <span className="md-stat-emoji">{s.emoji}</span>
                  <span className="md-stat-value">{s.value}</span>
                  <span className="md-stat-label">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Incoming Requests */}
            <section className="md-section">
              <h2 className="md-section-title">Incoming Requests</h2>
              <div className="md-request-list">
                {requests.map((r) => (
                  <div key={r.id} className="md-request-card">
                    <div className="md-request-type">
                      <span className="md-request-type-name">{r.type}</span>
                      <span className="md-request-service">{r.service}</span>
                    </div>
                    <div className="md-request-body">
                      <span className="md-request-avatar">{r.petEmoji}</span>
                      <div className="md-request-info">
                        <span className="md-request-pet">{r.petName}</span>
                        <span className="md-request-meta">{r.owner}</span>
                        <span className="md-request-meta">{r.day}</span>
                        <span className="md-request-meta">{r.time}</span>
                      </div>
                      <div className="md-request-actions">
                        <button
                          className="md-accept-btn"
                          onClick={() => handleRequest(r.id, "accept")}
                        >Accept</button>
                        <button
                          className="md-decline-btn"
                          onClick={() => handleRequest(r.id, "decline")}
                        >Decline</button>
                      </div>
                    </div>
                  </div>
                ))}
                {requests.length === 0 && (
                  <p className="md-empty">No pending requests</p>
                )}
              </div>
            </section>

            {/* Today's Schedule */}
            <section className="md-section">
              <h2 className="md-section-title">Today's Schedule</h2>
              <div className="md-schedule-list">
                {SCHEDULE.map((s) => (
                  <div key={s.id} className="md-schedule-card">
                    <span className="md-schedule-time">{s.time}</span>
                    <div className="md-schedule-info">
                      <span className="md-schedule-service">{s.service}</span>
                      <span className="md-schedule-detail">{s.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="md-scroll-pad" />
          </div>

          {/* ── Bottom Nav ── */}
          <nav className="md-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`md-nav-item${activeNav === item.id ? " md-nav-item--active" : ""}`}
                onClick={() => setActiveNav(item.id)}
              >
                <span className="md-nav-emoji">{item.emoji}</span>
                <span className="md-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

        </div>
      </div>
    </div>
  );
}