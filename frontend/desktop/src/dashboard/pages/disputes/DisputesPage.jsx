import { useState } from "react";
import { C } from "../../constants.js";
import { StatusBadge } from "../../components/badge/Badge.jsx";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card, Th, Td } from "../../components/card/Card.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import "./DisputesPage.css";

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
      summary:
        "Owner says minder ended the walk early and did not complete the agreed service.",
      evidence:
        "Chat history available, booking timeline reviewed, no incident report submitted.",
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
      summary:
        "Owner reported the minder did not arrive and did not respond within the booking window.",
      evidence:
        "Unread message thread, failed check-in, no visit report submitted.",
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
      summary:
        "Owner disputes the quality of pet sitting and says medication instructions were not followed correctly.",
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
        className="disputes-page__severity-pill"
        style={{
          "--severity-pill-bg": item.bg,
          "--severity-pill-color": item.color,
        }}
      >
        {item.label}
      </span>
    );
  };

  const pageVars = {
    "--disputes-orange": C.orange,
    "--disputes-orange-light": C.orangeLight,
    "--disputes-mid": C.mid,
    "--disputes-dark": C.dark,
    "--disputes-navy": C.navy,
    "--disputes-blue": C.blue,
    "--disputes-light": C.light,
    "--disputes-border": C.border,
  };

  const summaryCards = [
    ["⚖️", "Open", "6", C.red],
    ["💷", "Refund Requests", "9", C.orange],
    ["⬆️", "Escalated", "2", C.yellow],
    ["✅", "Resolved", "21", C.green],
  ];

  return (
    <div
      className="disputes-page"
      style={{
        ...pageVars,
        gridTemplateColumns: dispute ? "1fr 380px" : "1fr",
      }}
    >
      <div>
        <SectionHeader
          title="Disputes"
          subtitle="Review complaints, refund requests and escalated support cases"
        />

        <div className="disputes-page__summary-grid">
          {summaryCards.map(([icon, lbl, val, col]) => (
            <Card key={lbl} style={{ padding: "14px 16px" }}>
              <div className="disputes-page__summary-card">
                <div
                  className="disputes-page__summary-icon"
                  style={{ "--disputes-summary-icon-bg": `${col}18` }}
                >
                  {icon}
                </div>
                <div>
                  <p className="disputes-page__summary-label">{lbl}</p>
                  <p
                    className="disputes-page__summary-value"
                    style={{ "--disputes-summary-value-color": col }}
                  >
                    {val}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <table className="disputes-page__table">
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
                  className={`disputes-page__row ${
                    selected === d.id ? "disputes-page__row--selected" : ""
                  }`}
                  onClick={() => setSelected(selected === d.id ? null : d.id)}
                >
                  <Td>
                    <span className="disputes-page__id">{d.id}</span>
                  </Td>
                  <Td>
                    <span className="disputes-page__booking">{d.booking}</span>
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
          <div className="disputes-page__detail-header">
            <div>
              <span className="disputes-page__detail-id">{dispute.id}</span>
              <div className="disputes-page__detail-status">
                <StatusBadge status={dispute.status} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="disputes-page__close-btn"
            >
              ✕
            </button>
          </div>

          <h3 className="disputes-page__detail-title">{dispute.type}</h3>
          <p className="disputes-page__detail-submitted">{dispute.submitted}</p>

          <div className="disputes-page__detail-summary-box">
            <p className="disputes-page__detail-summary-text">{dispute.summary}</p>
          </div>

          {[
            ["Booking", dispute.booking],
            ["Raised By", dispute.raisedBy],
            ["Against", dispute.against],
            ["Assigned To", dispute.assignedTo],
            ["Refund Requested", dispute.refundRequested],
          ].map(([k, v]) => (
            <div key={k} className="disputes-page__detail-row">
              <span className="disputes-page__detail-key">{k}</span>
              <span className="disputes-page__detail-value">{v}</span>
            </div>
          ))}

          <div className="disputes-page__evidence-section">
            <p className="disputes-page__evidence-title">Evidence / Notes</p>
            <div className="disputes-page__evidence-box">
              <p className="disputes-page__evidence-text">{dispute.evidence}</p>
            </div>
          </div>

          <div className="disputes-page__detail-actions">
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