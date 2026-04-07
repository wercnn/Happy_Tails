import { useState } from "react";
import { C, NAV } from "./constants.js";
import { Input } from "./components/input/Input.jsx";
import { Avatar } from "./components/avatar/Avatar.jsx";

import OverviewPage from "./pages/OverviewPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import BookingsPage from "./pages/bookingPage/BookingsPage.jsx";
import DisputesPage from "./pages/disputesPage/DisputesPage.jsx";
import PaymentsPage from "./pages/PaymentsPage.jsx";
import ReviewsPage from "./pages/ReviewsPage.jsx";
import IncidentsPage from "./pages/IncidentsPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

import "./Dashboard.css";

export default function Dashboard({ user, onLogout }) {
  const [page, setPage] = useState("overview");
  const [sideCollapsed, setSideCollapsed] = useState(false);

  const pages = {
    overview: OverviewPage,
    users: UsersPage,
    bookings: BookingsPage,
    disputes: DisputesPage,
    payments: PaymentsPage,
    reviews: ReviewsPage,
    incidents: IncidentsPage,
    reports: ReportsPage,
    settings: SettingsPage,
  };

  const PageComponent = pages[page];

  const dashboardVars = {
    "--dashboard-light": C.light,
    "--dashboard-dark": C.dark,
    "--dashboard-white": C.white,
    "--dashboard-navy": C.navy,
    "--dashboard-orange": C.orange,
    "--dashboard-orange-light": C.orangeLight,
    "--dashboard-border": C.border,
    "--dashboard-mid": C.mid,
    "--dashboard-red": C.red,
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
        <aside className="dashboard-sidebar">
          <div className="dashboard-sidebar__header">
            <div className="dashboard-sidebar__logo">🐾</div>

            {!sideCollapsed && (
              <div className="dashboard-sidebar__brand">
                <div className="dashboard-sidebar__brand-name">Happy Tails</div>
                <div className="dashboard-sidebar__brand-subtitle">
                  Admin Dashboard
                </div>
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

        <div className="dashboard-main">
          <header className="dashboard-topbar">
            <div className="dashboard-topbar__search">
              <Input
                placeholder="Search users, bookings, incidents..."
                icon="🔍"
                style={{ maxWidth: 380 }}
              />
            </div>

            <div className="dashboard-topbar__actions">
              <div className="dashboard-topbar__notifications">
                <button
                  type="button"
                  className="dashboard-topbar__notification-button"
                >
                  🔔
                </button>
                <div className="dashboard-topbar__notification-badge" />
              </div>

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
            <PageComponent />
          </main>
        </div>
      </div>
    </>
  );
}