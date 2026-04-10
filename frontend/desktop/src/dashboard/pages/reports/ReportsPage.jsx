import { useState, useEffect } from "react";
import { C } from "../../constants.js";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card } from "../../components/card/Card.jsx";
import { Avatar } from "../../components/avatar/Avatar.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import "./ReportsPage.css";

const API = "http://localhost:3000/api";

export default function ReportsPage({ user }) {
  const safeUser = user || {
    userID: "u-support-001",
    role: "support",
  };

  function headers() {
    return {
      "Content-Type": "application/json",
      "X-User-Id": safeUser.userID,
      "X-User-Role": safeUser.role,
    };
  }

  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch(`${API}/stats`, {
        headers: headers(),
      });
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    }
  }

  // fallback UI if no data yet
  if (!stats) return <p>Loading reports...</p>;

  // 👉 simple dynamic data (you can improve later)
  const serviceData = [
    { service: "Bookings", bookings: stats.activeBookings, revenue: "—", share: 100 },
    { service: "Disputes", bookings: stats.openDisputes, revenue: "—", share: 50 },
    { service: "Incidents", bookings: stats.openIncidents, revenue: "—", share: 40 },
  ];

  const topMinders = [
    { name: "Top Minder", bookings: stats.activeBookings, revenue: "—", rating: 5, location: "UK" },
  ];

  return (
    <div className="reports-page">
      <SectionHeader title="Platform Reports" />

      <div className="reports-page__bottom-grid">
        <Card>
          <div className="reports-page__card reports-page__card--padded">
            <h3>Platform Overview</h3>

            {serviceData.map((s) => (
              <div key={s.service}>
                {s.service}: {s.bookings}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="reports-page__card reports-page__card--padded">
            <h3>Top Minders</h3>

            {topMinders.map((m, i) => (
              <div key={i}>
                <Avatar name={m.name} size={34} color={C.blue} />
                {m.name} - {m.bookings} bookings
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}