import { useEffect, useState } from "react";
import { C } from "../../constants.js";
import { StatusBadge } from "../../components/badge/Badge.jsx";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card, Th, Td } from "../../components/card/Card.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import { StatCard } from "../../components/statCard/StatCard.jsx";
import "./OverviewPage.css";

const API_HEADERS = {
  "X-User-Id": "u-support-001",
  "X-User-Role": "support",
};

const ALERT_ICONS = {
  dispute: "⚖️",
  incident: "🚨",
  verification: "🕵️",
};

function formatRelativeTime(isoString) {
  const diffMin = Math.floor((Date.now() - new Date(isoString)) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
}

function formatBookingDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === now.toDateString()) {
    return `Today ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function OverviewPage() {
  const [statsData, setStatsData] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [recentBookings, setRecentBookings] = useState(null);
  const [activityData, setActivityData] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/stats", { headers: API_HEADERS })
      .then((res) => res.json())
      .then((data) => setStatsData(data))
      .catch((err) => console.error("Error fetching stats:", err));

    fetch("http://localhost:3000/api/admin/alerts", { headers: API_HEADERS })
      .then((res) => res.json())
      .then((data) => setAlerts(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching alerts:", err));

    fetch("http://localhost:3000/api/admin/bookings", { headers: API_HEADERS })
      .then((res) => res.json())
      .then((data) => setRecentBookings(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching bookings:", err));

    fetch("http://localhost:3000/api/admin/activity", { headers: API_HEADERS })
      .then((res) => res.json())
      .then((data) => setActivityData(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching activity:", err));
  }, []);

  const stats = statsData
    ? [
        { icon: "⚖️", label: "Open Disputes",          value: statsData.openDisputes,         color: C.red    },
        { icon: "🚨", label: "Open Incidents",          value: statsData.openIncidents,         color: C.red    },
        { icon: "🕵️", label: "Pending Verifications",  value: statsData.pendingVerifications,  color: C.navy   },
        { icon: "💳", label: "Refund Requests",         value: statsData.refundRequests,        color: C.orange },
        { icon: "⭐", label: "Flagged Reviews",         value: statsData.flaggedReviews,        color: C.yellow },
        { icon: "📋", label: "Active Bookings",         value: statsData.activeBookings,        color: C.blue   },
      ]
    : [];

  const chartValues = activityData ? activityData.map((d) => d.count) : [];
  const maxChartValue = Math.max(...chartValues, 1);
  const recentBarStart = Math.max(chartValues.length - 3, 0);

  const chartStart = activityData?.[0]?.day
    ? new Date(activityData[0].day).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : "";
  const chartEnd = activityData?.[activityData.length - 1]?.day
    ? new Date(activityData[activityData.length - 1].day).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : "";

  const pageVars = {
    "--overview-navy": C.navy,
    "--overview-mid": C.mid,
    "--overview-dark": C.dark,
    "--overview-border": C.border,
    "--overview-orange": C.orange,
    "--overview-orange-mid": C.orangeMid,
  };

  return (
    <div className="overview-page" style={pageVars}>
      <SectionHeader
        title="Support Overview"
        subtitle="Live data from database"
      />

      {/* STATS */}
      <div className="overview-page__stats-grid">
        {statsData ? (
          stats.map((s) => <StatCard key={s.label} {...s} />)
        ) : (
          <p>Loading stats...</p>
        )}
      </div>

      <div className="overview-page__top-grid">
        {/* CHART — Support Case Activity */}
        <Card style={{ padding: 20 }}>
          <div className="overview-page__card-header">
            <div>
              <h3 className="overview-page__card-title">Support Case Activity</h3>
              <p className="overview-page__card-subtitle">
                Daily disputes and incidents over the last 10 days
              </p>
            </div>
          </div>

          <div className="overview-page__chart">
            {activityData === null ? (
              <p style={{ fontSize: 13, color: C.mid }}>Loading chart...</p>
            ) : chartValues.length === 0 ? (
              <p style={{ fontSize: 13, color: C.mid }}>No activity data.</p>
            ) : (
              chartValues.map((v, i) => (
                <div
                  key={i}
                  className="overview-page__chart-bar"
                  style={{
                    "--overview-chart-bar-height": `${(v / maxChartValue) * 100}%`,
                    "--overview-chart-bar-bg": i >= recentBarStart ? C.orange : C.orangeMid,
                  }}
                />
              ))
            )}
          </div>

          {chartValues.length > 0 && (
            <div className="overview-page__chart-labels">
              <span>{chartStart}</span>
              <span>{chartEnd}</span>
            </div>
          )}
        </Card>

        {/* LIVE ALERTS */}
        <Card style={{ padding: 20 }}>
          <h3>🔔 Live Alerts</h3>
          {alerts === null ? (
            <p style={{ fontSize: 13, color: C.mid }}>Loading alerts...</p>
          ) : alerts.length === 0 ? (
            <p style={{ fontSize: 13, color: C.mid }}>No recent alerts.</p>
          ) : (
            alerts.map((a, i) => (
              <div key={i} className="overview-page__alert-item">
                <span>{ALERT_ICONS[a.type] ?? "🔔"}</span>
                <div>
                  <p>{a.text}</p>
                  <p>{formatRelativeTime(a.time)}</p>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>

      {/* RECENT BOOKINGS TABLE */}
      <Card>
        <div className="overview-page__table-header">
          <h3>Recent Bookings</h3>
          <Btn variant="ghost" small>View All →</Btn>
        </div>

        <table className="overview-page__table">
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Owner</Th>
              <Th>Minder</Th>
              <Th>Service</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th>Action</Th>
            </tr>
          </thead>

          <tbody>
            {recentBookings === null ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "16px", color: C.mid, fontSize: 13 }}>
                  Loading bookings...
                </td>
              </tr>
            ) : recentBookings.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "16px", color: C.mid, fontSize: 13 }}>
                  No bookings found.
                </td>
              </tr>
            ) : (
              recentBookings.map((b) => (
                <tr key={b.bookingID}>
                  <Td>#{b.bookingID.slice(0, 6).toUpperCase()}</Td>
                  <Td>{b.ownerName}</Td>
                  <Td>{b.minderName}</Td>
                  <Td>{b.serviceName}</Td>
                  <Td>{formatBookingDate(b.startTime)}</Td>
                  <Td><StatusBadge status={b.status.toLowerCase()} /></Td>
                  <Td><Btn variant="outline" small>View</Btn></Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
