import { useState, useEffect, useRef } from "react";
import { C, NAV } from "./constants.js";
import { Avatar } from "./components/avatar/Avatar.jsx";

import OverviewPage from "./pages/overview/OverviewPage.jsx";
import UsersPage from "./pages/users/UsersPage.jsx";
import BookingsPage from "./pages/booking/BookingsPage.jsx";
import DisputesPage from "./pages/disputes/DisputesPage.jsx";
import PaymentsPage from "./pages/payments/PaymentsPage.jsx";
import ReviewsPage from "./pages/review/ReviewsPage.jsx";
import IncidentsPage from "./pages/incidents/IncidentsPage.jsx";
import ReportsPage from "./pages/reports/ReportsPage.jsx";
import SettingsPage from "./pages/settings/SettingsPage.jsx";

import "./Dashboard.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Derive an emoji and accent colour from a notification title
function getNotifStyle(title = "") {
  const t = title.toLowerCase();
  if (t.includes("accept") || t.includes("confirm")) return { emoji: "✅", accent: "#22c55e" };
  if (t.includes("cancel"))                           return { emoji: "❌", accent: "#ef4444" };
  if (t.includes("reject") || t.includes("declined")) return { emoji: "🚫", accent: "#ef4444" };
  if (t.includes("request") || t.includes("new booking")) return { emoji: "📬", accent: "#ee8b28" };
  if (t.includes("incident") || t.includes("alert")) return { emoji: "🚨", accent: "#ef4444" };
  if (t.includes("payment") || t.includes("paid"))   return { emoji: "💳", accent: "#6366f1" };
  if (t.includes("message"))                         return { emoji: "💬", accent: "#3b82f6" };
  if (t.includes("dispute"))                         return { emoji: "⚖️", accent: "#ee8b28" };
  return { emoji: "🔔", accent: C.orange };
}

function formatNotifTime(sentAt) {
  if (!sentAt) return "";
  const sent = new Date(String(sentAt).replace(" ", "T"));
  const now  = new Date();
  const diffMs   = now - sent;
  const diffMin  = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay  = Math.floor(diffMs / 86400000);
  if (diffMin  < 1)  return "Just now";
  if (diffMin  < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay  === 1) return "Yesterday";
  if (diffDay  < 7)  return `${diffDay}d ago`;
  return sent.toLocaleDateString([], { day: "numeric", month: "short" });
}

export default function Dashboard({ user, onLogout }) {
  const [page, setPage] = useState("overview");
  const [sideCollapsed, setSideCollapsed] = useState(false);

  // ── Notifications ─────────────────────────────────────────────────────────
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Fetch notifications silently on mount (for badge count)
  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE}/api/notifications`, {
      headers: {
        "Content-Type": "application/json",
        "X-User-Id":   user.userID,
        "X-User-Role": user.role,
      },
    })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setNotifications(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [user]);

  // Refresh when panel opens
  useEffect(() => {
    if (!notifOpen || !user) return;
    setNotifLoading(true);
    fetch(`${API_BASE}/api/notifications`, {
      headers: {
        "Content-Type": "application/json",
        "X-User-Id":   user.userID,
        "X-User-Role": user.role,
      },
    })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setNotifications(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setNotifLoading(false));
  }, [notifOpen]);

  // Close panel when clicking outside
  useEffect(() => {
    if (!notifOpen) return;
    function onOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [notifOpen]);

  function markRead(notificationID) {
    setNotifications((prev) =>
      prev.map((n) => n.notificationID === notificationID ? { ...n, isRead: true } : n)
    );
    if (!user) return;
    fetch(`${API_BASE}/api/notifications/${notificationID}/read`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id":   user.userID,
        "X-User-Role": user.role,
      },
    }).catch(() => {});
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (!user) return;
    fetch(`${API_BASE}/api/notifications/read-all`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id":   user.userID,
        "X-User-Role": user.role,
      },
    }).catch(() => {});
  }

  // ── Page registry ─────────────────────────────────────────────────────────
  const pages = {
    overview:  OverviewPage,
    users:     UsersPage,
    bookings:  BookingsPage,
    disputes:  DisputesPage,
    payments:  PaymentsPage,
    reviews:   ReviewsPage,
    incidents: IncidentsPage,
    reports:   ReportsPage,
    settings:  SettingsPage,
  };

  const PageComponent = pages[page];

  const dashboardVars = {
    "--dashboard-light":        C.light,
    "--dashboard-dark":         C.dark,
    "--dashboard-white":        C.white,
    "--dashboard-navy":         C.navy,
    "--dashboard-orange":       C.orange,
    "--dashboard-orange-light": C.orangeLight,
    "--dashboard-border":       C.border,
    "--dashboard-mid":          C.mid,
    "--dashboard-red":          C.red,
    "--dashboard-sidebar-width": sideCollapsed ? "72px" : "240px",
  };

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap"
        rel="stylesheet"
      />

      <div
        className={`dashboard ${sideCollapsed ? "dashboard--collapsed" : ""}`}
        style={dashboardVars}
      >
        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className="dashboard-sidebar">
          <div className="dashboard-sidebar__header">
            <div className="dashboard-sidebar__logo">🐾</div>

            {!sideCollapsed && (
              <div className="dashboard-sidebar__brand">
                <div className="dashboard-sidebar__brand-name">Happy Tails</div>
                <div className="dashboard-sidebar__brand-subtitle">Admin Dashboard</div>
              </div>
            )}

            <button
              className="dashboard-sidebar__collapse-button"
              onClick={() => setSideCollapsed((c) => !c)}
              type="button"
            >
              {sideCollapsed ? "›" : "‹"}
            </button>
          </div>

          <nav className="dashboard-sidebar__nav">
            {NAV.map((n) => {
              const isActive = page === n.key;
              return (
                <button
                  key={n.key}
                  type="button"
                  onClick={() => setPage(n.key)}
                  title={n.label}
                  className={`dashboard-sidebar__nav-item ${
                    isActive ? "dashboard-sidebar__nav-item--active" : ""
                  }`}
                >
                  <span className="dashboard-sidebar__nav-icon">{n.icon}</span>

                  {!sideCollapsed && (
                    <span className="dashboard-sidebar__nav-label">{n.label}</span>
                  )}

                  {!sideCollapsed && isActive && (
                    <span className="dashboard-sidebar__nav-dot" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="dashboard-sidebar__footer">
            <div className="dashboard-sidebar__user">
              <div className="dashboard-sidebar__user-avatar">
                {user ? user.name.slice(0, 2).toUpperCase() : "CS"}
              </div>

              {!sideCollapsed && (
                <div className="dashboard-sidebar__user-info">
                  <div className="dashboard-sidebar__user-name">
                    {user?.name ?? "Support Team"}
                  </div>
                  <div className="dashboard-sidebar__user-role">
                    {user?.role ?? "Customer Support"}
                  </div>
                </div>
              )}

              {!sideCollapsed && onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign out"
                  className="dashboard-sidebar__logout"
                >
                  ↩
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main area ────────────────────────────────────────────────────── */}
        <div className="dashboard-main">
          <header className="dashboard-topbar">
            <div className="dashboard-topbar__actions">
              {/* Notifications bell */}
              <div className="dashboard-topbar__notifications" ref={notifRef}>
                <button
                  type="button"
                  className="dashboard-topbar__notification-button"
                  onClick={() => setNotifOpen((v) => !v)}
                  aria-label="Toggle notifications"
                >
                  🔔
                </button>

                {unreadCount > 0 && (
                  <div className="dashboard-topbar__notification-badge">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </div>
                )}

                {/* Notifications dropdown panel */}
                {notifOpen && (
                  <div className="dashboard-notif-panel">
                    <div className="dashboard-notif-panel__header">
                      <span className="dashboard-notif-panel__title">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          className="dashboard-notif-panel__mark-all"
                          onClick={markAllRead}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="dashboard-notif-panel__list">
                      {notifLoading && (
                        <p className="dashboard-notif-panel__status">Loading…</p>
                      )}
                      {!notifLoading && notifications.length === 0 && (
                        <p className="dashboard-notif-panel__status">No notifications.</p>
                      )}
                      {!notifLoading && notifications.map((n) => {
                        const { emoji, accent } = getNotifStyle(n.title);
                        return (
                          <button
                            key={n.notificationID}
                            type="button"
                            className={`dashboard-notif-item${n.isRead ? " dashboard-notif-item--read" : ""}`}
                            style={{ "--notif-accent": accent }}
                            onClick={() => !n.isRead && markRead(n.notificationID)}
                          >
                            <span className="dashboard-notif-item__accent" />
                            <span className="dashboard-notif-item__emoji">{emoji}</span>
                            <div className="dashboard-notif-item__content">
                              <span className="dashboard-notif-item__title">{n.title}</span>
                              <span className="dashboard-notif-item__body">{n.body}</span>
                              <span className="dashboard-notif-item__time">
                                {formatNotifTime(n.sentAt)}
                              </span>
                            </div>
                            {!n.isRead && <span className="dashboard-notif-item__dot" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="dashboard-topbar__profile">
                <Avatar
                  name={user ? user.name.slice(0, 2).toUpperCase() : "CS"}
                  size={34}
                  color={C.orange}
                />
                <div className="dashboard-topbar__profile-info">
                  <div className="dashboard-topbar__profile-name">
                    {user?.name ?? "Support Team"}
                  </div>
                  <div className="dashboard-topbar__profile-status">Online</div>
                </div>
              </div>
            </div>
          </header>

          <main className="dashboard-content">
            <PageComponent user={user} onNavigate={setPage} />
          </main>
        </div>
      </div>
    </>
  );
}
