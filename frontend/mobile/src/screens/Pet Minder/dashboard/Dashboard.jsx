import { useState, useEffect, useCallback } from "react";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3000";

const NAV = [
  { id: "dashboard", emoji: "🏠", label: "Dashboard" },
  { id: "services", emoji: "⚙️", label: "Services" },
  { id: "availability", emoji: "📅", label: "Availability" },
  { id: "requests", emoji: "📬", label: "Requests" },
  { id: "profile", emoji: "👤", label: "Profile" },
];

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "X-User-Id": localStorage.getItem("userID") || "",
    "X-User-Role": localStorage.getItem("userRole") || "",
  };
}

function isToday(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isThisWeek(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return d >= startOfWeek && d < endOfWeek;
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr) {
  return new Date(dateStr)
    .toLocaleDateString([], { weekday: "short", day: "numeric" })
    .toUpperCase();
}

export default function HappyTailsMinderDashboard() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [ownerName, setOwnerName] = useState("");
  const [pendingRequests, setPendingRequests] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [stats, setStats] = useState({ newRequests: 0, thisWeek: 0 });
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avgRating, setAvgRating] = useState("N/A");
  const [status, setStatus] = useState("N/A");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/bookings`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to fetch bookings (${res.status})`);
      const bookings = await res.json();

      const now = new Date();
      const pending = bookings.filter((b) => b.status === "pending");
      const today = bookings.filter(
        (b) => b.status === "accepted" && isToday(b.startTime)
      );
      const upcoming = bookings.filter(
        (b) =>
          (b.status === "accepted" || b.status === "pending") &&
          new Date(b.startTime) > now &&
          !isToday(b.startTime)
      );
      const thisWeekCount = bookings.filter(
        (b) => b.status === "accepted" && isThisWeek(b.startTime)
      ).length;

      setPendingRequests(pending);
      setTodaySchedule(today);
      setUpcomingBookings(upcoming);
      setStats({ newRequests: pending.length, thisWeek: thisWeekCount });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAvgRating = async (userID) => {
    try {
      const res = await fetch(`${API_BASE}/api/minders/${userID}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to fetch rating (${res.status})`);
      const data = await res.json();
      const rating = data.ratingAvg;
      setAvgRating(rating !== null ? rating : "N/A");
    } catch (err) {
      console.error("Error fetching average rating:", err);
      setAvgRating("N/A");
    }
  };

  const getStatus = async (userID) => {
    try {
      const res = await fetch(`${API_BASE}/api/users/${userID}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to fetch rating (${res.status})`);
      const data = await res.json();
      const status = data.status;
      console.log("Fetched status:", status);
      setStatus(status !== null ? status : "N/A");
    } catch (err) {
      console.error("Error fetching status:", err);
      setStatus("N/A");
    }
  }

  useEffect(() => {
    const firstName = localStorage.getItem("firstName") || "";
    const lastName = localStorage.getItem("lastName") || "";
    setOwnerName(`${firstName} ${lastName}`.trim() || "Minder");
    fetchBookings();
    getAvgRating(localStorage.getItem("userID"));
    getStatus(localStorage.getItem("userID"));
  }, [fetchBookings]);

  const handleRequest = async (bookingID, action) => {
    const endpoint = action === "accept" ? "accept" : "reject";
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${bookingID}/${endpoint}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to ${action} booking (${res.status})`);
      await fetchBookings();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };


  const handleNavClick = (id) => {
    setActiveNav(id);
    switch (id) {
      case "dashboard": navigate("/mindDash"); break;
      case "services": navigate("/mindService"); break;
      case "availability": navigate("/mindAvailability"); break;
      case "requests": navigate("/mindRequests"); break;
      case "profile": navigate("/profile"); break;
      default: break;
    }
  };

  const STATS_DISPLAY = [
    { emoji: "📅", value: String(stats.newRequests), label: "NEW\nREQUESTS" },
    { emoji: "💼", value: String(stats.thisWeek), label: "THIS WEEK" },
    { emoji: "⭐", value: avgRating, label: "RATING" },
  ];

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="md-screen">
          <header className="md-header">
            <div className="md-greeting-block">
              <h1 className="md-greeting">Welcome back 👋</h1>
              <p className="md-name">{ownerName}</p>
            </div>
            <button className="md-status-btn">
              <span className="md-status-dot" />
              <span className="md-status-text">{status}</span>
            </button>
          </header>

          <div className="md-scroll">
            <div className="md-stats-row">
              {STATS_DISPLAY.map((s) => (
                <div key={s.label} className="md-stat-card">
                  <span className="md-stat-emoji">{s.emoji}</span>
                  <span className="md-stat-value">{s.value}</span>
                  <span className="md-stat-label">{s.label}</span>
                </div>
              ))}
            </div>

            <section className="md-section">
              <h2 className="md-section-title">Incoming Requests</h2>
              {loading && <p className="md-empty">Loading...</p>}
              {error && <p className="md-empty">{error}</p>}
              {!loading && !error && (
                <div className="md-request-list">
                  {pendingRequests.map((r) => (
                    <div key={r.bookingID} className="md-request-card">
                      <div className="md-request-type">
                        <span className="md-request-type-name">{r.serviceTypeID}</span>
                        <span className="md-request-service">Pending</span>
                      </div>
                      <div className="md-request-body">
                        <span className="md-request-avatar">🐾</span>
                        <div className="md-request-info">
                          <span className="md-request-pet">
                            Booking #{r.bookingID.slice(0, 8)}
                          </span>
                          <span className="md-request-meta">
                            {formatDate(r.startTime)}
                          </span>
                          <span className="md-request-meta">
                            {formatTime(r.startTime)}
                          </span>
                          {r.ownerNotes && (
                            <span className="md-request-meta">{r.ownerNotes}</span>
                          )}
                        </div>
                        <div className="md-request-actions">
                          <button
                            className="md-accept-btn"
                            onClick={() => handleRequest(r.bookingID, "accept")}
                          >
                            Accept
                          </button>
                          <button
                            className="md-decline-btn"
                            onClick={() => handleRequest(r.bookingID, "reject")}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pendingRequests.length === 0 && (
                    <p className="md-empty">No pending requests</p>
                  )}
                </div>
              )}
            </section>

            <section className="md-section">
              <div className="md-section-header">
                <h2 className="md-section-title">
                  {showUpcoming ? "Upcoming Bookings" : "Today's Schedule"}
                </h2>
                <button
                  type="button"
                  className={`md-section-toggle ${showUpcoming ? "md-section-toggle--active md-section-toggle--left" : "md-section-toggle--right"}`}
                  onClick={() => setShowUpcoming((prev) => !prev)}
                  aria-label="Toggle schedule view"
                >
                  &gt;
                </button>
              </div>

              <div className="md-schedule-slider">
                <div
                  className={`md-schedule-track ${showUpcoming ? "md-schedule-track--upcoming" : ""}`}
                >
                  <div className="md-schedule-panel">
                    <div className="md-schedule-list">
                      {!loading && todaySchedule.length === 0 && (
                        <p className="md-empty">Nothing scheduled today</p>
                      )}
                      {todaySchedule.map((s) => (
                        <div key={s.bookingID} className="md-schedule-card">
                          <span className="md-schedule-time">
                            {formatTime(s.startTime)}
                          </span>
                          <div className="md-schedule-info">
                            <span className="md-schedule-service">
                              {s.serviceTypeID}
                            </span>
                            <span className="md-schedule-detail">
                              #{s.bookingID.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md-schedule-panel">
                    <div className="md-schedule-list">
                      {!loading && upcomingBookings.length === 0 && (
                        <p className="md-empty">No upcoming bookings</p>
                      )}
                      {upcomingBookings.map((b) => (
                        <div key={b.bookingID} className="md-schedule-card">
                          <span className="md-schedule-time">
                            {formatDate(b.startTime)}
                          </span>
                          <div className="md-schedule-info">
                            <span className="md-schedule-service">
                              {b.serviceTypeID}
                            </span>
                            <span className="md-schedule-detail">
                              #{b.bookingID.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="md-scroll-pad" />
          </div>

          <nav className="md-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`md-nav-item${activeNav === item.id ? " md-nav-item--active" : ""}`}
                onClick={() => handleNavClick(item.id)}
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
