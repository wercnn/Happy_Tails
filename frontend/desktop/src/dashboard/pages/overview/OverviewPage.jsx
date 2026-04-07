import { C } from "../../constants.js";
import { Badge, StatusBadge } from "../../components/badge/Badge.jsx";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card, Th, Td } from "../../components/card/Card.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import { StatCard } from "../../components/statCard/StatCard.jsx";
import "./OverviewPage.css";

export default function OverviewPage() {
  const stats = [
    { icon: "⚖️", label: "Open Disputes", value: "6", delta: "+2", deltaUp: false, color: C.red },
    { icon: "🚨", label: "Open Incidents", value: "7", delta: "+2", deltaUp: false, color: C.red },
    { icon: "🕵️", label: "Pending Verifications", value: "23", delta: "-5", deltaUp: true, color: C.navy },
    { icon: "💳", label: "Refund Requests", value: "9", delta: "+3", deltaUp: false, color: C.orange },
    { icon: "⭐", label: "Flagged Reviews", value: "7", delta: "+1", deltaUp: false, color: C.yellow },
    { icon: "📋", label: "Active Bookings", value: "387", delta: "+42", deltaUp: true, color: C.blue },
  ];

  const recentBookings = [
    { id: "#HT-8801", owner: "Sarah J.", minder: "James W.", service: "Dog Walking", date: "Today 9am", status: "confirmed" },
    { id: "#HT-8802", owner: "Mike T.", minder: "Priya P.", service: "Pet Sitting", date: "Today 2pm", status: "pending" },
    { id: "#HT-8800", owner: "Anna B.", minder: "Tom H.", service: "Dog Walking", date: "Yesterday", status: "completed" },
    { id: "#HT-8799", owner: "Chris L.", minder: "Emma R.", service: "Home Boarding", date: "28 Mar", status: "cancelled" },
  ];

  const alerts = [
    { icon: "⚖️", text: "Dispute #DSP-101 opened — refund requested for booking #HT-8801", time: "4 min ago" },
    { icon: "🚨", text: "Incident #INC-042 escalated — Buddy reported injured", time: "5 min ago" },
    { icon: "🕵️", text: "3 new minder identity verifications awaiting review", time: "1 hr ago" },
    { icon: "⭐", text: "Review #RV-281 flagged for abusive language", time: "2 hr ago" },
    { icon: "💳", text: "Refund request #REF-119 submitted by Sarah J.", time: "3 hr ago" },
  ];

  const chartValues = [
    12, 18, 15, 22, 28, 20, 35, 30, 42, 38,
    45, 52, 48, 60, 55, 58, 65, 70, 62, 68,
    72, 80, 75, 82, 88, 79, 90, 95, 88, 92,
  ];

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
        subtitle="Track disputes, refunds and verification activity across the platform."
      />

      <div className="overview-page__stats-grid">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="overview-page__top-grid">
        <Card style={{ padding: 20 }}>
          <div className="overview-page__card-header">
            <div>
              <h3 className="overview-page__card-title">Support Case Activity</h3>
              <p className="overview-page__card-subtitle">
                Daily support workload across bookings and disputes
              </p>
            </div>
            <Badge color={C.green} bg={C.greenLight}>
              ↑ 18% vs last month
            </Badge>
          </div>

          <div className="overview-page__chart">
            {chartValues.map((v, i) => (
              <div
                key={i}
                className="overview-page__chart-bar"
                style={{
                  "--overview-chart-bar-height": `${(v / 95) * 100}%`,
                  "--overview-chart-bar-bg": i >= 27 ? C.orange : C.orangeMid,
                }}
              />
            ))}
          </div>

          <div className="overview-page__chart-labels">
            <span>1 Mar</span>
            <span>15 Mar</span>
            <span>29 Mar</span>
          </div>
        </Card>

        <Card style={{ padding: 20 }}>
          <h3 className="overview-page__alerts-title">🔔 Live Alerts</h3>

          {alerts.map((a, i) => (
            <div
              key={i}
              className="overview-page__alert-item"
              style={{
                "--overview-alert-border":
                  i < alerts.length - 1 ? `1px solid ${C.border}` : "none",
              }}
            >
              <span className="overview-page__alert-icon">{a.icon}</span>
              <div className="overview-page__alert-content">
                <p className="overview-page__alert-text">{a.text}</p>
                <p className="overview-page__alert-time">{a.time}</p>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <div className="overview-page__table-header">
          <h3 className="overview-page__table-title">Recent Bookings</h3>
          <Btn variant="ghost" small>
            View All →
          </Btn>
        </div>

        <table className="overview-page__table">
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Pet Owner</Th>
              <Th>Minder</Th>
              <Th>Service</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {recentBookings.map((b) => (
              <tr key={b.id} className="overview-page__table-row">
                <Td>
                  <span className="overview-page__booking-id">{b.id}</span>
                </Td>
                <Td>{b.owner}</Td>
                <Td>{b.minder}</Td>
                <Td>{b.service}</Td>
                <Td>{b.date}</Td>
                <Td>
                  <StatusBadge status={b.status} />
                </Td>
                <Td>
                  <Btn variant="outline" small>
                    View
                  </Btn>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}