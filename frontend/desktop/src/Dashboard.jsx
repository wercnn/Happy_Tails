import { useState } from "react";
import { C, NAV } from "./dashboard/constants.js";
import { Input } from "./dashboard/components/Input.jsx";
import { Avatar } from "./dashboard/components/Avatar.jsx";

import OverviewPage from "./dashboard/pages/OverviewPage.jsx";
import UsersPage from "./dashboard/pages/UsersPage.jsx";
import BookingsPage from "./dashboard/pages/BookingsPage.jsx";
import DisputesPage from "./dashboard/pages/DisputesPage.jsx";
import PaymentsPage from "./dashboard/pages/PaymentsPage.jsx";
import ReviewsPage from "./dashboard/pages/ReviewsPage.jsx";
import IncidentsPage from "./dashboard/pages/IncidentsPage.jsx";
import ReportsPage from "./dashboard/pages/ReportsPage.jsx";
import SettingsPage from "./dashboard/pages/SettingsPage.jsx";

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

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", height: "70vh", overflow: "hidden", background: C.light, fontFamily: "'Nunito', sans-serif", color: C.dark, zoom: 1.6 }}>
        {/* ── SIDEBAR ── */}
        <aside
          style={{
            width: sideCollapsed ? 72 : 240,
            background: C.navy,
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            transition: "width 0.25s",
            overflow: "hidden",
          }}
        >
          {/* Logo */}
          <div style={{ padding: "20px 16px 16px", borderBottom: `1px solid rgba(255,255,255,0.1)`, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
              🐾
            </div>
            {!sideCollapsed && (
              <div>
                <div style={{ fontFamily: "'Dancing Script', cursive", color: C.white, fontSize: 20, fontWeight: 700, lineHeight: 1 }}>Happy Tails</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Admin Dashboard</div>
              </div>
            )}
            <button
              onClick={() => setSideCollapsed((c) => !c)}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 18, cursor: "pointer", padding: 2, flexShrink: 0 }}
            >
              {sideCollapsed ? "›" : "‹"}
            </button>
          </div>

          {/* Nav */}
          <nav style={{ flex: "1", padding: "12px 8px", overflowY: "auto" }}>
            {NAV.map((n) => (
              <button
                key={n.key}
                onClick={() => setPage(n.key)}
                title={n.label}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: sideCollapsed ? "10px" : "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  background: page === n.key ? "rgba(245,147,30,0.2)" : "transparent",
                  color: page === n.key ? C.orange : "rgba(255,255,255,0.65)",
                  fontWeight: 700,
                  fontSize: 13,
                  fontFamily: "inherit",
                  transition: "all 0.15s",
                  marginBottom: 2,
                  whiteSpace: "nowrap",
                  justifyContent: sideCollapsed ? "center" : "flex-start",
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{n.icon}</span>
                {!sideCollapsed && n.label}
                {!sideCollapsed && page === n.key && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: C.orange, flexShrink: 0 }} />}
              </button>
            ))}
          </nav>

          {/* Bottom user */}
          <div style={{ padding: "12px 10px", borderTop: `1px solid rgba(255,255,255,0.1)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.orangeLight, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: C.orange, flexShrink: 0 }}>
                {user ? user.name.slice(0, 2).toUpperCase() : "CS"}
              </div>
              {!sideCollapsed && (
                <div style={{ overflow: "hidden", flex: 1 }}>
                  <div style={{ color: C.white, fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name ?? "Support Team"}</div>
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>{user?.role ?? "Customer Support"}</div>
                </div>
              )}
              {!sideCollapsed && onLogout && (
                <button
                  onClick={onLogout}
                  title="Sign out"
                  style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 16, cursor: "pointer", padding: 4, flexShrink: 0, lineHeight: 1 }}
                >
                  ↩
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
          {/* Top bar */}
          <header
            style={{
              background: C.white,
              borderBottom: `1px solid ${C.border}`,
              padding: "0 28px",
              height: 60,
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexShrink: 0,
              boxShadow: "0 1px 8px rgba(26,42,74,0.06)",
            }}
          >
            <div style={{ flex: 1 }}>
              <Input placeholder="Search users, bookings, incidents..." icon="🔍" style={{ maxWidth: 380 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ position: "relative" }}>
                <button style={{ background: C.light, border: "none", borderRadius: 10, width: 38, height: 38, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  🔔
                </button>
                <div style={{ position: "absolute", top: 6, right: 6, width: 10, height: 10, borderRadius: "50%", background: C.red, border: `2px solid ${C.white}` }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar name={user ? user.name.slice(0, 2).toUpperCase() : "CS"} size={34} color={C.orange} />
                <div>
                  <div style={{ fontWeight: 700, color: C.navy, fontSize: 13 }}>{user?.name ?? "Support Team"}</div>
                  <div style={{ fontSize: 11, color: C.mid }}>Online</div>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main style={{ flex: 1, overflowY: "auto", padding: "48px 56px", minHeight: 0 }}>
            <PageComponent />
          </main>
        </div>
      </div>
    </>
  );
}

