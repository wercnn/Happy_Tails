import { useState } from "react";
import { C } from "../constants.js";
import { StatusBadge } from "../components/badge/Badge.jsx";
import { Btn } from "../components/btn/Btn.jsx";
import { Card, Th, Td } from "../components/card/Card.jsx";
import { Input } from "../components/Input.jsx";
import { SectionHeader } from "../components/SectionHeader.jsx";

export default function BookingsPage() {
  const [filter, setFilter] = useState("all");

  const bookings = [
    { id: "#HT-8801", owner: "Sarah J.", minder: "James W.", pet: "Buddy", service: "Dog Walking (60 min)", date: "9 Apr 2026", cost: "£23.10", status: "confirmed" },
    { id: "#HT-8802", owner: "Mike T.", minder: "Priya P.", pet: "Whiskers", service: "Pet Sitting", date: "12 Apr 2026", cost: "£48.00", status: "pending" },
    { id: "#HT-8798", owner: "Anna B.", minder: "James W.", pet: "Max", service: "Home Boarding", date: "2 Apr 2026", cost: "£105.00", status: "completed" },
    { id: "#HT-8797", owner: "Chris L.", minder: "Tom H.", pet: "Luna", service: "Dog Walking (30 min)", date: "28 Mar 2026", cost: "£15.75", status: "cancelled" },
    { id: "#HT-8800", owner: "Rachel K.", minder: "Emma R.", pet: "Mochi", service: "Day Care", date: "5 Apr 2026", cost: "£34.50", status: "confirmed" },
  ];

  const filters = ["all", "confirmed", "pending", "completed", "cancelled"];
  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div>
      <SectionHeader title="Booking Management" subtitle="Monitor booking activity and step in when customer support intervention is needed." action={<Input placeholder="Search bookings..." icon="🔍" style={{ width: 240 }} />} />

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "7px 16px",
              borderRadius: 20,
              border: `1.5px solid ${filter === f ? C.orange : C.border}`,
              background: filter === f ? C.orange : C.white,
              color: filter === f ? C.white : C.dark,
              fontWeight: 700,
              fontSize: 12,
              cursor: "pointer",
              textTransform: "capitalize",
              fontFamily: "inherit",
            }}
          >
            {f === "all" ? "All Bookings" : f}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          ["📋", "Total", "387", C.navy],
          ["✅", "Confirmed", "198", C.green],
          ["⏳", "Pending", "83", C.orange],
          ["❌", "Cancelled", "26", C.red],
        ].map(([icon, lbl, val, col]) => (
          <Card key={lbl} style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: col + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: C.mid, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{lbl}</p>
              <p style={{ margin: "2px 0 0", fontWeight: 800, color: col, fontSize: 20 }}>{val}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>Booking ID</Th>
              <Th>Pet Owner</Th>
              <Th>Pet Minder</Th>
              <Th>Pet</Th>
              <Th>Service</Th>
              <Th>Date</Th>
              <Th>Cost</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id}>
                <Td>
                  <span style={{ fontWeight: 800, color: C.orange, fontSize: 12 }}>{b.id}</span>
                </Td>
                <Td>{b.owner}</Td>
                <Td>{b.minder}</Td>
                <Td>🐾 {b.pet}</Td>
                <Td style={{ fontSize: 12 }}>{b.service}</Td>
                <Td style={{ fontSize: 12 }}>{b.date}</Td>
                <Td>
                  <strong style={{ color: C.navy }}>{b.cost}</strong>
                </Td>
                <Td>
                  <StatusBadge status={b.status} />
                </Td>
                <Td>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Btn variant="outline" small>
                      View
                    </Btn>
                    <Btn variant = "outline" small>
                      Intervene 
                    </Btn>
                    {b.status === "pending" && (
                      <Btn variant="danger" small>
                        Cancel
                      </Btn>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

