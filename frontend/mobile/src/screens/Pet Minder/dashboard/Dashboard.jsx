import { useState, useEffect, useCallback, useMemo } from "react";
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

const SERVICE_NAMES = {
  "st-walk": "Dog Walking",
  "st-board": "Pet Boarding",
  "st-daycare": "Dog Daycare",
};

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "X-User-Id": localStorage.getItem("userID") || "",
    "X-User-Role": localStorage.getItem("userRole") || "",
  };
}

function toDate(dateStr) {
  return new Date(String(dateStr).replace(" ", "T"));
}

function isToday(dateStr) {
  const d = toDate(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isThisWeek(dateStr) {
  const d = toDate(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return d >= startOfWeek && d < endOfWeek;
}

function formatTime(dateStr) {
  return toDate(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr) {
  return toDate(dateStr)
    .toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
    .toUpperCase();
}

function formatShortDate(dateStr) {
  return toDate(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning 🌅";
  if (h < 18) return "Good afternoon ☀️";
  return "Good evening 🌙";
}

function getCreatedMinuteKey(createdAt) {
  if (!createdAt) return "no-created-at";
  const d = toDate(createdAt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

function getServiceLabel(item) {
  return (
    item.serviceName ||
    SERVICE_NAMES[item.serviceTypeID] ||
    item.serviceTypeID ||
    "Service"
  );
}

function getOwnerName(item) {
  const full = [item.ownerFirstName, item.ownerLastName].filter(Boolean).join(" ").trim();
  return full || item.ownerName || "Pet owner";
}

function getPetLabel(item) {
  return item.petName || item.pet || "Pet";
}

function groupBookings(bookings) {
  const groups = new Map();

  for (const b of bookings) {
    const key = [
      b.ownerID,
      b.sitterID,
      b.petID,
      b.serviceTypeID,
      String(b.status || "").toLowerCase(),
      b.ownerNotes || "",
      getCreatedMinuteKey(b.createdAt),
    ].join("|");

    if (!groups.has(key)) {
      groups.set(key, {
        groupKey: key,
        bookingIDs: [],
        bookings: [],
        bookingID: b.bookingID,
        ownerID: b.ownerID,
        sitterID: b.sitterID,
        petID: b.petID,
        serviceTypeID: b.serviceTypeID,
        serviceName: b.serviceName,
        petName: b.petName,
        ownerFirstName: b.ownerFirstName,
        ownerLastName: b.ownerLastName,
        ownerNotes: b.ownerNotes || "",
        status: String(b.status || "").toLowerCase(),
        createdAt: b.createdAt,
        startTime: b.startTime,
        totalCost: 0,
      });
    }

    const group = groups.get(key);
    group.bookingIDs.push(b.bookingID);
    group.bookings.push(b);
    group.totalCost += Number(b.totalCost || 0);

    const currentStart = toDate(group.startTime);
    const nextStart = toDate(b.startTime);
    if (nextStart < currentStart) {
      group.startTime = b.startTime;
      group.bookingID = b.bookingID;
    }
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      dates: group.bookings
        .map((b) => b.startTime)
        .sort((a, b) => toDate(a) - toDate(b)),
    }))
    .sort((a, b) => toDate(a.startTime) - toDate(b.startTime));
}

export default function HappyTailsMinderDashboard() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [minderName, setMinderName] = useState("");
  const [pendingRequests, setPendingRequests] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [stats, setStats] = useState({ newRequests: 0, thisWeek: 0 });
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [avgRating, setAvgRating] = useState("N/A");
  const [status] = useState("Active");

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

      const pending = bookings.filter(
        (b) => String(b.status || "").toLowerCase() === "pending"
      );

      const accepted = bookings.filter(
        (b) => String(b.status || "").toLowerCase() === "accepted"
      );

      const today = accepted.filter((b) => isToday(b.startTime));
      const upcoming = accepted.filter(
        (b) => toDate(b.startTime) > now && !isToday(b.startTime)
      );

      const thisWeekCount = accepted.filter((b) => isThisWeek(b.startTime)).length;

      setPendingRequests(pending);
      setTodaySchedule(today);
      setUpcomingBookings(upcoming);
      setStats({
        newRequests: pending.length,
        thisWeek: thisWeekCount,
      });
    } catch (err) {
      setError(err.message || "Failed to fetch bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  const getAvgRating = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/minders/me`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error(`Failed to fetch rating (${res.status})`);

      const data = await res.json();
      setAvgRating(data.ratingAvg != null ? Number(data.ratingAvg).toFixed(1) : "N/A");
    } catch (err) {
      console.error("Error fetching average rating:", err);
      setAvgRating("N/A");
    }
  }, []);

  useEffect(() => {
    const firstName = localStorage.getItem("firstName") || "";
    const lastName = localStorage.getItem("lastName") || "";
    setMinderName(`${firstName} ${lastName}`.trim() || "Minder");

    fetchBookings();
    getAvgRating();
  }, [fetchBookings, getAvgRating]);

  const groupedPendingRequests = useMemo(
    () => groupBookings(pendingRequests),
    [pendingRequests]
  );

  const handleNavClick = (id) => {
    setActiveNav(id);
    switch (id) {
      case "dashboard":
        navigate("/mindDash");
        break;
      case "services":
        navigate("/mindService");
        break;
      case "availability":
        navigate("/mindAvailability");
        break;
      case "requests":
        navigate("/mindRequests");
        break;
      case "profile":
        navigate("/profile");
        break;
      default:
        break;
    }
  };

  const handleViewRequestDetails = (requestGroup) => {
    navigate("/mindRequests", {
      state: {
        requestGroup,
      },
    });
  };

  const STATS_DISPLAY = [
    { emoji: "📅", value: String(groupedPendingRequests.length), label: "NEW\nREQUESTS" },
    { emoji: "💼", value: String(stats.thisWeek), label: "THIS WEEK" },
    { emoji: "⭐", value: avgRating, label: "RATING" },
  ];

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="md-screen">
          <header className="md-header">
            <div className="md-greeting-block">
              <span className="md-greeting-label">{getGreeting()}</span>
              <h1 className="md-name">{minderName}</h1>
              <span className="md-role-badge">Pet Minder</span>
            </div>

            <div className="md-header-right">
              <button
                className="md-notif-btn"
                onClick={() => navigate("/mindNotifications")}
                aria-label="Notifications"
                type="button"
              >
                🔔
              </button>

              <div className="md-status-pill">
                <span className="md-status-dot" />
                <span className="md-status-text">{status}</span>
              </div>
            </div>
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
                  {groupedPendingRequests.map((r) => (
                    <div key={r.groupKey} className="md-request-card">
                      <div className="md-request-type">
                        <span className="md-request-type-name">{getServiceLabel(r)}</span>
                        <span className="md-request-service">Pending</span>
                      </div>

                      <div className="md-request-body">
                        <span className="md-request-avatar">🐾</span>

                        <div className="md-request-info">
                          <span className="md-request-pet">
                            {getOwnerName(r)} · {getPetLabel(r)}
                          </span>

                          <span className="md-request-meta">
                            {r.dates.length === 1
                              ? formatDate(r.dates[0])
                              : `${r.dates.length} dates: ${r.dates
                                  .map((d) => formatShortDate(d))
                                  .join(", ")}`}
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
                            onClick={() => handleViewRequestDetails(r)}
                            type="button"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {groupedPendingRequests.length === 0 && (
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
                  className={`md-section-toggle ${
                    showUpcoming
                      ? "md-section-toggle--active md-section-toggle--left"
                      : "md-section-toggle--right"
                  }`}
                  onClick={() => setShowUpcoming((prev) => !prev)}
                  aria-label="Toggle schedule view"
                >
                  &gt;
                </button>
              </div>

              <div className="md-schedule-slider">
                <div
                  className={`md-schedule-track ${
                    showUpcoming ? "md-schedule-track--upcoming" : ""
                  }`}
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
                              {getServiceLabel(s)}
                            </span>
                            <span className="md-schedule-detail">
                              {getPetLabel(s)}
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
                              {getServiceLabel(b)}
                            </span>
                            <span className="md-schedule-detail">
                              {getPetLabel(b)}
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
                type="button"
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