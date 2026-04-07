import { useState } from "react";
import { C } from "../../constants.js";
import { StatusBadge } from "../../components/badge/Badge.jsx";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card, Th, Td } from "../../components/card/Card.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";

export default function DisputesPage() {
  const [selected, setSelected] = useState(null);

  const disputes = [
    {
      id: "#DSP-101",
      booking: "#HT-8801",
      raisedBy: "Sarah J.",
      against: "James W.",
      type: "Refund request",
      severity: "high",
      refundRequested: "£42",
      status: "open",
      submitted: "Today 9:10am",
      assignedTo: "Chadi S.",
      summary: "Owner says minder ended the walk early and did not complete the agreed service.",
      evidence: "Chat history available, booking timeline reviewed, no incident report submitted.",
    },
    {
      id: "#DSP-100",
      booking: "#HT-8797",
      raisedBy: "Chris L.",
      against: "Tom H.",
      type: "No-show complaint",
      severity: "high",
      refundRequested: "Full refund",
      status: "escalated",
      submitted: "Yesterday 4:20pm",
      assignedTo: "Sifat R.",
      summary: "Owner reported the minder did not arrive and did not respond within the booking window.",
      evidence: "Unread message thread, failed check-in, no visit report submitted.",
    },
    {
      id: "#DSP-099",
      booking: "#HT-8788",
      raisedBy: "Anna B.",
      against: "Emma R.",
      type: "Service quality",
      severity: "medium",
      refundRequested: "Partial refund",
      status: "pending",
      submitted: "28 Mar 11:00am",
      assignedTo: "Shadi H.",
      summary: "Owner disputes the quality of pet sitting and says medication instructions were not followed correctly.",
      evidence: "Visit report submitted, owner uploaded supporting screenshots.",
    },
    {
      id: "#DSP-098",
      booking: "#HT-8776",
      raisedBy: "Rachel K.",
      against: "Priya P.",
      type: "Payment dispute",
      severity: "low",
      refundRequested: "£18",
      status: "resolved",
      submitted: "25 Mar 2:35pm",
      assignedTo: "Chadi S.",
      summary: "Refund amount corrected after payment review.",
      evidence: "Escrow release adjusted and both parties notified.",
    },
  ];

  const dispute = selected ? disputes.find((d) => d.id === selected) : null;

  const severityPill = (severity) => {
    const map = {
      low: { bg: C.greenLight, color: C.green, label: "Low" },
      medium: { bg: C.yellowLight, color: C.yellow, label: "Medium" },
      high: { bg: C.redLight, color: C.red, label: "High" },
    };

    const item = map[severity] || map.medium;

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "5px 9px",
          borderRadius: 999,
          background: item.bg,
          color: item.color,
          fontWeight: 800,
          fontSize: 11,
        }}
      >
        {item.label}
      </span>
    );
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: dispute ? "1fr 380px" : "1fr", gap: 20 }}>
      <div>
        <SectionHeader
          title="Disputes"
          subtitle="Review complaints, refund requests and escalated support cases"
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
          {[
            ["⚖️", "Open", "6", C.red],
            ["💷", "Refund Requests", "9", C.orange],
            ["⬆️", "Escalated", "2", C.yellow],
            ["✅", "Resolved", "21", C.green],
          ].map(([icon, lbl, val, col]) => (
            <Card key={lbl} style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "center" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: col + "18",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                {icon}
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    color: C.mid,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                  }}
                >
                  {lbl}
                </p>
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
                <Th>Booking</Th>
                <Th>Raised By</Th>
                <Th>Against</Th>
                <Th>Type</Th>
                <Th>Severity</Th>
                <Th>Refund</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((d) => (
                <tr
                  key={d.id}
                  style={{
                    background: selected === d.id ? C.orangeLight : "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => setSelected(selected === d.id ? null : d.id)}
                >
                  <Td>
                    <span style={{ fontWeight: 800, color: C.orange, fontSize: 12 }}>{d.id}</span>
                  </Td>
                  <Td>
                    <span style={{ color: C.blue, fontWeight: 700, fontSize: 12 }}>{d.booking}</span>
                  </Td>
                  <Td>{d.raisedBy}</Td>
                  <Td>{d.against}</Td>
                  <Td style={{ fontSize: 12 }}>{d.type}</Td>
                  <Td>{severityPill(d.severity)}</Td>
                  <Td style={{ fontSize: 12 }}>{d.refundRequested}</Td>
                  <Td>
                    <StatusBadge status={d.status} />
                  </Td>
                  <Td>
                    <Btn
                      variant="outline"
                      small
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(d.id);
                      }}
                    >
                      View
                    </Btn>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {dispute && (
        <Card style={{ padding: 20, height: "fit-content", position: "sticky", top: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <span style={{ fontWeight: 800, color: C.orange, fontSize: 14 }}>{dispute.id}</span>
              <div style={{ marginTop: 8 }}>
                <StatusBadge status={dispute.status} />
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.mid }}
            >
              ✕
            </button>
          </div>

          <h3 style={{ margin: "0 0 4px", color: C.navy, fontSize: 16, fontWeight: 800 }}>{dispute.type}</h3>
          <p style={{ margin: "0 0 16px", color: C.mid, fontSize: 12 }}>{dispute.submitted}</p>

          <div style={{ background: C.light, borderRadius: 10, padding: 12, marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 13, color: C.dark, lineHeight: 1.6 }}>{dispute.summary}</p>
          </div>

          {[
            ["Booking", dispute.booking],
            ["Raised By", dispute.raisedBy],
            ["Against", dispute.against],
            ["Assigned To", dispute.assignedTo],
            ["Refund Requested", dispute.refundRequested],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <span style={{ color: C.mid, fontSize: 12 }}>{k}</span>
              <span style={{ color: C.navy, fontWeight: 700, fontSize: 12 }}>{v}</span>
            </div>
          ))}

          <div style={{ marginTop: 16 }}>
            <p style={{ margin: "0 0 6px", color: C.navy, fontWeight: 800, fontSize: 13 }}>Evidence / Notes</p>
            <div style={{ background: C.light, borderRadius: 10, padding: 12 }}>
              <p style={{ margin: 0, fontSize: 12, color: C.dark, lineHeight: 1.6 }}>{dispute.evidence}</p>
            </div>
          </div>

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <Btn variant="primary">Approve Refund</Btn>
            <Btn variant="danger">Deny Dispute</Btn>
            <Btn variant="outline">Escalate Case</Btn>
            <Btn variant="outline">View Chat History</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}
