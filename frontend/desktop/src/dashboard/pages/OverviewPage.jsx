import { C } from "../constants.js";
import { Badge, StatusBadge } from "../components/Badge.jsx";
import { Btn } from "../components/Btn.jsx";
import { Card, Th, Td } from "../components/Card.jsx";
import { SectionHeader } from "../components/SectionHeader.jsx";
import { StatCard } from "../components/StatCard.jsx";

export default function OverviewPage() {
  const stats = [
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

  return (
    <div>
      <SectionHeader title="Support Overview" subtitle="Track disputes, refunds and verification activity across the platform." />

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 24 }}>
        {/* Booking trend chart */}
        <Card style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, color: C.navy, fontWeight: 800, fontSize: 15 }}>Support Case Activity</h3>
              <p style={{ margin: "2px 0 0", color: C.mid, fontSize: 12 }}>Daily support workload across bookings and disputes</p>
            </div>
            <Badge color={C.green} bg={C.greenLight}>
              ↑ 18% vs last month
            </Badge>
          </div>
          <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 100 }}>
            {[12, 18, 15, 22, 28, 20, 35, 30, 42, 38, 45, 52, 48, 60, 55, 58, 65, 70, 62, 68, 72, 80, 75, 82, 88, 79, 90, 95, 88, 92].map(
              (v, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    borderRadius: "2px 2px 0 0",
                    background: i >= 27 ? C.orange : C.orangeMid,
                    height: `${(v / 95) * 100}%`,
                    minHeight: 3,
                  }}
                />
              )
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: C.mid }}>
            <span>1 Mar</span>
            <span>15 Mar</span>
            <span>29 Mar</span>
          </div>
        </Card>

        {/* Alerts */}
        <Card style={{ padding: 20 }}>
          <h3 style={{ margin: "0 0 14px", color: C.navy, fontWeight: 800, fontSize: 15 }}>🔔 Live Alerts</h3>
          {alerts.map((a, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                padding: "10px 0",
                borderBottom: i < alerts.length - 1 ? `1px solid ${C.border}` : "none",
              }}
            >
              <span style={{ fontSize: 18, marginTop: 1 }}>{a.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 12, color: C.dark, lineHeight: 1.4 }}>{a.text}</p>
                <p style={{ margin: "3px 0 0", fontSize: 11, color: C.mid }}>{a.time}</p>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Recent bookings */}
      <Card>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, color: C.navy, fontWeight: 800, fontSize: 15 }}>Recent Bookings</h3>
          <Btn variant="ghost" small>
            View All →
          </Btn>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
              <tr key={b.id} style={{ transition: "background 0.15s" }}>
                <Td>
                  <span style={{ fontWeight: 700, color: C.orange }}>{b.id}</span>
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

