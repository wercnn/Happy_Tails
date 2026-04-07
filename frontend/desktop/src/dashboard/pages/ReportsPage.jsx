import { C } from "../constants.js";
import { Btn } from "../components/btn/Btn.jsx";
import { Card } from "../components/card/Card.jsx";
import { Avatar } from "../components/avatar/Avatar.jsx";
import { SectionHeader } from "../components/SectionHeader.jsx";

export default function ReportsPage() {
  const serviceData = [
    { service: "Dog Walking", bookings: 198, revenue: "£7,920", share: 51 },
    { service: "Pet Sitting", bookings: 87, revenue: "£4,350", share: 22 },
    { service: "Home Boarding", bookings: 64, revenue: "£5,120", share: 17 },
    { service: "Day Care", bookings: 38, revenue: "£1,900", share: 10 },
  ];

  const topMinders = [
    { name: "James Walker", bookings: 87, revenue: "£1,740", rating: 4.9, location: "Luton" },
    { name: "Priya Patel", bookings: 54, revenue: "£1,080", rating: 4.7, location: "Luton" },
    { name: "Tom Hughes", bookings: 32, revenue: "£640", rating: 4.8, location: "Bedford" },
    { name: "Emma Reeves", bookings: 28, revenue: "£560", rating: 4.6, location: "Luton" },
  ];

  return (
    <div>
      <SectionHeader
        title="Platform Reports"
        subtitle="Analytics and performance insights for Happy Tails operations"
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="outline">📅 Date Range</Btn>
            <Btn variant="primary">Export CSV</Btn>
          </div>
        }
      />

      {/* Monthly trend */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <Card style={{ padding: 20 }}>
          <h3 style={{ margin: "0 0 4px", color: C.navy, fontWeight: 800, fontSize: 15 }}>Monthly Bookings</h3>
          <p style={{ margin: "0 0 16px", color: C.mid, fontSize: 12 }}>Oct 2025 – Mar 2026</p>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 80 }}>
            {[{ m: "Oct", v: 180 }, { m: "Nov", v: 210 }, { m: "Dec", v: 290 }, { m: "Jan", v: 320 }, { m: "Feb", v: 356 }, { m: "Mar", v: 387 }].map((d, i) => (
              <div key={d.m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div
                  style={{
                    width: "100%",
                    borderRadius: "4px 4px 0 0",
                    background: i === 5 ? C.orange : C.orangeMid,
                    height: `${(d.v / 387) * 80}px`,
                  }}
                />
                <span style={{ fontSize: 10, color: C.mid, fontWeight: 600 }}>{d.m}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card style={{ padding: 20 }}>
          <h3 style={{ margin: "0 0 4px", color: C.navy, fontWeight: 800, fontSize: 15 }}>Monthly Revenue (£)</h3>
          <p style={{ margin: "0 0 16px", color: C.mid, fontSize: 12 }}>Oct 2025 – Mar 2026</p>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 80 }}>
            {[{ m: "Oct", v: 9200 }, { m: "Nov", v: 11400 }, { m: "Dec", v: 15600 }, { m: "Jan", v: 16800 }, { m: "Feb", v: 17200 }, { m: "Mar", v: 18340 }].map((d, i) => (
              <div key={d.m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div
                  style={{
                    width: "100%",
                    borderRadius: "4px 4px 0 0",
                    background: i === 5 ? C.green : "#22A45D55",
                    height: `${(d.v / 18340) * 80}px`,
                  }}
                />
                <span style={{ fontSize: 10, color: C.mid, fontWeight: 600 }}>{d.m}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Service breakdown */}
        <Card style={{ padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", color: C.navy, fontWeight: 800, fontSize: 15 }}>Bookings by Service Type</h3>
          {serviceData.map((s, i) => (
            <div key={s.service} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{s.service}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontSize: 12, color: C.mid }}>{s.bookings} bookings</span>
                  <strong style={{ fontSize: 13, color: C.navy }}>{s.revenue}</strong>
                </div>
              </div>
              <div style={{ height: 8, background: C.light, borderRadius: 4 }}>
                <div style={{ height: "100%", borderRadius: 4, width: `${s.share}%`, background: [C.orange, C.blue, C.green, C.yellow][i] }} />
              </div>
            </div>
          ))}
        </Card>

        {/* Top minders */}
        <Card style={{ padding: 20 }}>
          <h3 style={{ margin: "0 0 16px", color: C.navy, fontWeight: 800, fontSize: 15 }}>Top Performing Minders</h3>
          {topMinders.map((m, i) => (
            <div
              key={m.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                borderBottom: i < topMinders.length - 1 ? `1px solid ${C.border}` : "none",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: C.orangeLight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 13,
                  color: C.orange,
                }}
              >
                {i + 1}
              </div>
              <Avatar name={m.name} size={34} color={C.blue} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: C.navy, fontSize: 13 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: C.mid }}>📍 {m.location} · ⭐ {m.rating}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, color: C.green, fontSize: 13 }}>{m.revenue}</div>
                <div style={{ fontSize: 11, color: C.mid }}>{m.bookings} bookings</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

