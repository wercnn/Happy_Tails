import { useState } from "react";
import { C } from "../constants.js";
import { StatusBadge } from "../components/badge/Badge.jsx";
import { Btn } from "../components/btn/Btn.jsx";
import { Card, Th, Td } from "../components/card/Card.jsx";
import { SectionHeader } from "../components/SectionHeader.jsx";

export default function IncidentsPage() {
  const [selected, setSelected] = useState(null);

  const incidents = [
    { id: "#INC-042", type: "Pet Injury", owner: "Sarah J.", minder: "James W.", pet: "Buddy", booking: "#HT-8801", submitted: "Today 8:32am", description: "Buddy appears to have a cut on his left front paw. Minder noticed during walk and has administered basic first aid. Owner notified.", status: "escalated" },
    { id: "#INC-041", type: "Minder No-Show", owner: "Chris L.", minder: "Tom H.", pet: "Luna", booking: "#HT-8797", submitted: "28 Mar 3pm", description: "Minder did not arrive for the booked 3pm walk. Owner unable to reach minder via in-app message.", status: "open" },
    { id: "#INC-040", type: "Pet Lost", owner: "Rachel K.", minder: "Priya P.", pet: "Mochi", booking: "#HT-8790", submitted: "25 Mar 11am", description: "Pet went missing during outdoor walk. Minder searched surrounding area. Pet was found after 45 minutes. No injuries.", status: "resolved" },
    { id: "#INC-039", type: "Pet Illness", owner: "Anna B.", minder: "Tom H.", pet: "Max", booking: "#HT-8770", submitted: "20 Mar 7pm", description: "Pet showed signs of sickness (vomiting) during boarding. Vet was contacted. Dietary cause suspected.", status: "resolved" },
  ];

  const inc = selected ? incidents.find((i) => i.id === selected) : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: inc ? "1fr 380px" : "1fr", gap: 20 }}>
      <div>
        <SectionHeader title="Incident & Emergency Reports" subtitle="Track and resolve incidents reported during active bookings (RQ18, 48)" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
          {[
            ["🚨", "Open", "2", C.red],
            ["⚡", "Escalated", "1", C.yellow],
            ["✅", "Resolved", "18", C.green],
          ].map(([icon, lbl, val, col]) => (
            <Card key={lbl} style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "center" }}>
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
                <Th>ID</Th>
                <Th>Type</Th>
                <Th>Owner</Th>
                <Th>Minder</Th>
                <Th>Pet</Th>
                <Th>Booking</Th>
                <Th>Submitted</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((i) => (
                <tr
                  key={i.id}
                  style={{ background: selected === i.id ? C.orangeLight : "transparent", cursor: "pointer" }}
                  onClick={() => setSelected(selected === i.id ? null : i.id)}
                >
                  <Td>
                    <span style={{ fontWeight: 800, color: C.orange, fontSize: 12 }}>{i.id}</span>
                  </Td>
                  <Td style={{ fontSize: 12 }}>{i.type}</Td>
                  <Td>{i.owner}</Td>
                  <Td>{i.minder}</Td>
                  <Td>🐾 {i.pet}</Td>
                  <Td>
                    <span style={{ color: C.blue, fontWeight: 700, fontSize: 12 }}>{i.booking}</span>
                  </Td>
                  <Td style={{ fontSize: 11 }}>{i.submitted}</Td>
                  <Td>
                    <StatusBadge status={i.status} />
                  </Td>
                  <Td>
                    <Btn
                      variant="outline"
                      small
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(i.id);
                      }}
                    >
                      Details
                    </Btn>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {inc && (
        <Card style={{ padding: 20, height: "fit-content", position: "sticky", top: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <span style={{ fontWeight: 800, color: C.orange, fontSize: 14 }}>{inc.id}</span>
              <StatusBadge status={inc.status} />{" "}
            </div>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.mid }}>
              ✕
            </button>
          </div>
          <h3 style={{ margin: "0 0 4px", color: C.navy, fontSize: 16, fontWeight: 800 }}>{inc.type}</h3>
          <p style={{ margin: "0 0 16px", color: C.mid, fontSize: 12 }}>{inc.submitted}</p>
          <div style={{ background: C.light, borderRadius: 10, padding: 12, marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 13, color: C.dark, lineHeight: 1.6 }}>{inc.description}</p>
          </div>

          {[
            ["Owner", inc.owner],
            ["Minder", inc.minder],
            ["Pet", inc.pet],
            ["Booking", inc.booking],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: C.mid, fontSize: 12 }}>{k}</span>
              <span style={{ color: C.navy, fontWeight: 700, fontSize: 12 }}>{v}</span>
            </div>
          ))}

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <Btn variant="primary">Escalate to Manager</Btn>
            <Btn variant="success">Mark as Resolved</Btn>
            <Btn variant="outline">Contact Owner</Btn>
            <Btn variant="outline">Contact Minder</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}

