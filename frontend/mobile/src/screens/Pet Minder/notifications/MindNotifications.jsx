import { useEffect, useState } from "react";
import "../../Notifications & Profile/notifications/Notifications.css";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3000";

const NAV = [
  { id: "dashboard",    emoji: "🏠", label: "Dashboard" },
  { id: "services",     emoji: "⚙️", label: "Services" },
  { id: "availability", emoji: "📅", label: "Availability" },
  { id: "requests",     emoji: "📬", label: "Requests" },
  { id: "profile",      emoji: "👤", label: "Profile" },
];

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "X-User-Id":   localStorage.getItem("userID")   || "",
    "X-User-Role": localStorage.getItem("userRole") || "",
  };
}

function getNotifStyle(title = "") {
  const t = title.toLowerCase();
  if (t.includes("accept") || t.includes("confirm"))
    return { emoji: "✅", accentColor: "#22c55e" };
  if (t.includes("cancel"))
    return { emoji: "❌", accentColor: "#ef4444" };
  if (t.includes("reject") || t.includes("declined"))
    return { emoji: "🚫", accentColor: "#ef4444" };
  if (t.includes("request") || t.includes("new booking"))
    return { emoji: "📬", accentColor: "#ee8b28" };
  if (t.includes("incident") || t.includes("alert"))
    return { emoji: "🚨", accentColor: "#ef4444" };
  if (t.includes("payment") || t.includes("paid") || t.includes("released"))
    return { emoji: "💳", accentColor: "#6366f1" };
  if (t.includes("review"))
    return { emoji: "⭐", accentColor: "#f59e0b" };
  if (t.includes("message"))
    return { emoji: "💬", accentColor: "#3b82f6" };
  if (t.includes("reminder") || t.includes("upcoming"))
    return { emoji: "⏰", accentColor: "#8b5cf6" };
  return { emoji: "🔔", accentColor: "#ee8b28" };
}

function formatTime(sentAt) {
  const sent = new Date(sentAt.replace(" ", "T"));
  const now  = new Date();
  const diffMs   = now - sent;
  const diffMin  = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay  = Math.floor(diffMs / 86400000);
  if (diffMin < 1)   return "Just now";
  if (diffMin < 60)  return `${diffMin} min${diffMin !== 1 ? "s" : ""} ago`;
  if (diffHour < 24) return `${diffHour} hr${diffHour !== 1 ? "s" : ""} ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7)   return `${diffDay} days ago`;
  return sent.toLocaleDateString([], { day: "numeric", month: "short" });
}

export default function MindNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [activeNav,     setActiveNav]     = useState("dashboard");

  useEffect(() => {
    fetch(`${API_BASE}/api/notifications`, { headers: getAuthHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load notifications (${res.status})`);
        return res.json();
      })
      .then((data) => setNotifications(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleNavClick = (id) => {
    setActiveNav(id);
    switch (id) {
      case "dashboard":    navigate("/mindDash");         break;
      case "services":     navigate("/mindService");      break;
      case "availability": navigate("/mindAvailability"); break;
      case "requests":     navigate("/mindRequests");     break;
      case "profile":      navigate("/profile");          break;
      default: break;
    }
  };

  const markRead = (notificationID) => {
    setNotifications((prev) =>
      prev.map((n) => n.notificationID === notificationID ? { ...n, isRead: true } : n)
    );
    fetch(`${API_BASE}/api/notifications/${notificationID}/read`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    }).catch(() => {});
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    fetch(`${API_BASE}/api/notifications/read-all`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    }).catch(() => {});
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="notif-screen">

          {/* Header */}
          <header className="notif-header">
            <div className="notif-header-left">
              <button className="notif-back" onClick={() => navigate("/mindDash")}>←</button>
              <h1 className="notif-title">Notifications</h1>
            </div>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </header>

          {/* Scrollable body */}
          <div className="notif-scroll">
            <div className="notif-body">
              {loading && (
                <p className="notif-status">Loading notifications…</p>
              )}
              {error && (
                <p className="notif-status notif-status--error">{error}</p>
              )}
              {!loading && !error && notifications.length === 0 && (
                <p className="notif-status">You have no notifications.</p>
              )}
              {!loading && !error && notifications.map((n) => {
                const { emoji, accentColor } = getNotifStyle(n.title);
                return (
                  <button
                    key={n.notificationID}
                    className={`notif-card${n.isRead ? " notif-card--read" : ""}`}
                    style={{ "--accent": accentColor }}
                    onClick={() => !n.isRead && markRead(n.notificationID)}
                  >
                    <span className="notif-card-accent" />
                    <span className="notif-card-emoji">{emoji}</span>
                    <div className="notif-card-content">
                      <span className="notif-card-title">{n.title}</span>
                      <span className="notif-card-body">{n.body}</span>
                      <span className="notif-card-time">{formatTime(n.sentAt)}</span>
                    </div>
                    {!n.isRead && <span className="notif-unread-dot" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Nav */}
          <nav className="notif-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`notif-nav-item${activeNav === item.id ? " notif-nav-item--active" : ""}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span className="notif-nav-emoji">{item.emoji}</span>
                <span className="notif-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

        </div>
      </div>
    </div>
  );
}
