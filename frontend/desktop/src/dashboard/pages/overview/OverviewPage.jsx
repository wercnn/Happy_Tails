import { useEffect, useState } from "react";
import { C } from "../../constants.js";
import { Badge, StatusBadge } from "../../components/badge/Badge.jsx";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card, Th, Td } from "../../components/card/Card.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import { StatCard } from "../../components/statCard/StatCard.jsx";
import "./OverviewPage.css";

export default function OverviewPage() {
  const [statsData, setStatsData] = useState(null);

  // 🔌 FETCH DATA FROM BACKEND
  useEffect(() => {
    fetch("http://localhost:3000/api/stats", {
      headers: {
        "X-User-Id": "u-support-001",
        "X-User-Role": "support",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Stats:", data);
        setStatsData(data);
      })
      .catch((err) => console.error("Error fetching stats:", err));
  }, []);

  // 🧠 BUILD STATS FROM API
  const stats = statsData
    ? [
        {
          icon: "⚖️",
          label: "Open Disputes",
          value: statsData.openDisputes,
          color: C.red,
        },
        {
          icon: "🚨",
          label: "Open Incidents",
          value: statsData.openIncidents,
          color: C.red,
        },
        {
          icon: "🕵️",
          label: "Pending Verifications",
          value: statsData.pendingVerifications,
          color: C.navy,
        },
        {
          icon: "💳",
          label: "Refund Requests",
          value: statsData.refundRequests,
          color: C.orange,
        },
        {
          icon: "⭐",
          label: "Flagged Reviews",
          value: statsData.flaggedReviews,
          color: C.yellow,
        },
        {
          icon: "📋",
          label: "Active Bookings",
          value: statsData.activeBookings,
          color: C.blue,
        },
      ]
    : [];

  // ⛔ keep static for now (you can connect later)
  const recentBookings = [
    { id: "#HT-8801", owner: "Sarah J.", minder: "James W.", service: "Dog Walking", date: "Today 9am", status: "confirmed" },
    { id: "#HT-8802", owner: "Mike T.", minder: "Priya P.", service: "Pet Sitting", date: "Today 2pm", status: "pending" },
    { id: "#HT-8800", owner: "Anna B.", minder: "Tom H.", service: "Dog Walking", date: "Yesterday", status: "completed" },
    { id: "#HT-8799", owner: "Chris L.", minder: "Emma R.", service: "Home Boarding", date: "28 Mar", status: "cancelled" },
  ];

  const alerts = [
    { icon: "⚖️", text: "Dispute opened", time: "4 min ago" },
    { icon: "🚨", text: "Incident escalated", time: "5 min ago" },
    { icon: "🕵️", text: "New verifications pending", time: "1 hr ago" },
  ];

  const chartValues = [12, 18, 15, 22, 28, 20, 35, 30, 42, 38];

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

      {/* ✅ STATS */}
      <div className="overview-page__stats-grid">
        {statsData ? (
          stats.map((s) => <StatCard key={s.label} {...s} />)
        ) : (
          <p>Loading stats...</p>
        )}
      </div>

      <div className="overview-page__top-grid">
        {/* CHART */}
        <Card style={{ padding: 20 }}>
          <div className="overview-page__card-header">
            <h3>Support Activity</h3>
            <Badge color={C.green} bg={C.greenLight}>
              Live
            </Badge>
          </div>

          <div className="overview-page__chart">
            {chartValues.map((v, i) => (
              <div
                key={i}
                className="overview-page__chart-bar"
                style={{
                  "--overview-chart-bar-height": `${v}%`,
                  "--overview-chart-bar-bg": C.orange,
                }}
              />
            ))}
          </div>
        </Card>

        {/* ALERTS */}
        <Card style={{ padding: 20 }}>
          <h3>🔔 Live Alerts</h3>
          {alerts.map((a, i) => (
            <div key={i} className="overview-page__alert-item">
              <span>{a.icon}</span>
              <div>
                <p>{a.text}</p>
                <p>{a.time}</p>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* BOOKINGS TABLE */}
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
            {recentBookings.map((b) => (
              <tr key={b.id}>
                <Td>{b.id}</Td>
                <Td>{b.owner}</Td>
                <Td>{b.minder}</Td>
                <Td>{b.service}</Td>
                <Td>{b.date}</Td>
                <Td><StatusBadge status={b.status} /></Td>
                <Td>
                  <Btn variant="outline" small>View</Btn>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}