import { useState } from "react";
import "./Notifications.css";

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    emoji: "✅",
    accentColor: "#22c55e",
    title: "Booking Accepted",
    body: "James Walker accepted your booking for 9 Apr.",
    time: "2 mins ago",
    read: false,
  },
  {
    id: 2,
    emoji: "📬",
    accentColor: "#ee8b28",
    title: "New Booking Request",
    body: "Sarah Johnson requested Dog Walking for Buddy.",
    time: "1 hr ago",
    read: false,
  },
  {
    id: 3,
    emoji: "🚨",
    accentColor: "#ef4444",
    title: "Incident Alert",
    body: "Your incident report #INC-20260409-002 is being reviewed.",
    time: "Yesterday",
    read: true,
  },
  {
    id: 4,
    emoji: "❌",
    accentColor: "#ef4444",
    title: "Booking Cancelled",
    body: "Michael Smith canceled your booking for 22 Apr.",
    time: "2 days ago",
    read: true,
  },
];

const NAV = [
  { id: "home",     emoji: "🏠", label: "Home" },
  { id: "pets",     emoji: "🐾", label: "My Pets" },
  { id: "search",   emoji: "🔍", label: "Search" },
  { id: "bookings", emoji: "📋", label: "Bookings" },
  { id: "profile",  emoji: "👤", label: "Profile" },
];

export default function HappyTailsNotifications() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeNav, setActiveNav] = useState("home");

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = (id) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="notif-screen">

          {/* Header */}
          <header className="notif-header">
            <div className="notif-header-left">
              <button className="notif-back" onClick={() => alert("Go back")}>←</button>
              <h1 className="notif-title">Notifications</h1>
            </div>
            <button className="notif-mark-all" onClick={markAllRead}>
              Mark all read
            </button>
          </header>

          {/* Scrollable body */}
          <div className="notif-scroll">
            <div className="notif-body">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  className={`notif-card${n.read ? " notif-card--read" : ""}`}
                  style={{ "--accent": n.accentColor }}
                  onClick={() => markRead(n.id)}
                >
                  <span className="notif-card-accent" />
                  <span className="notif-card-emoji">{n.emoji}</span>
                  <div className="notif-card-content">
                    <span className="notif-card-title">{n.title}</span>
                    <span className="notif-card-body">{n.body}</span>
                    <span className="notif-card-time">{n.time}</span>
                  </div>
                  {!n.read && <span className="notif-unread-dot" />}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Nav */}
          <nav className="notif-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`notif-nav-item${activeNav === item.id ? " notif-nav-item--active" : ""}`}
                onClick={() => setActiveNav(item.id)}
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