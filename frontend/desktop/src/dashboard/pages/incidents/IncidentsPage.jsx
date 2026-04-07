import { useState } from "react";
import { C } from "../../constants.js";
import { StatusBadge } from "../../components/badge/Badge.jsx";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card, Th, Td } from "../../components/card/Card.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import "./IncidentsPage.css";

export default function IncidentsPage() {
  const [selected, setSelected] = useState(null);

  const incidents = [
    {
      id: "#INC-042",
      type: "Pet Injury",
      owner: "Sarah J.",
      minder: "James W.",
      pet: "Buddy",
      booking: "#HT-8801",
      submitted: "Today 8:32am",
      description:
        "Buddy appears to have a cut on his left front paw. Minder noticed during walk and has administered basic first aid. Owner notified.",
      status: "escalated",
    },
    {
      id: "#INC-041",
      type: "Minder No-Show",
      owner: "Chris L.",
      minder: "Tom H.",
      pet: "Luna",
      booking: "#HT-8797",
      submitted: "28 Mar 3pm",
      description:
        "Minder did not arrive for the booked 3pm walk. Owner unable to reach minder via in-app message.",
      status: "open",
    },
    {
      id: "#INC-040",
      type: "Pet Lost",
      owner: "Rachel K.",
      minder: "Priya P.",
      pet: "Mochi",
      booking: "#HT-8790",
      submitted: "25 Mar 11am",
      description:
        "Pet went missing during outdoor walk. Minder searched surrounding area. Pet was found after 45 minutes. No injuries.",
      status: "resolved",
    },
    {
      id: "#INC-039",
      type: "Pet Illness",
      owner: "Anna B.",
      minder: "Tom H.",
      pet: "Max",
      booking: "#HT-8770",
      submitted: "20 Mar 7pm",
      description:
        "Pet showed signs of sickness (vomiting) during boarding. Vet was contacted. Dietary cause suspected.",
      status: "resolved",
    },
  ];

  const inc = selected ? incidents.find((i) => i.id === selected) : null;

  const pageVars = {
    "--incidents-orange": C.orange,
    "--incidents-orange-light": C.orangeLight,
    "--incidents-mid": C.mid,
    "--incidents-dark": C.dark,
    "--incidents-navy": C.navy,
    "--incidents-blue": C.blue,
    "--incidents-light": C.light,
    "--incidents-border": C.border,
  };

  const summaryCards = [
    ["🚨", "Open", "2", C.red],
    ["⚡", "Escalated", "1", C.yellow],
    ["✅", "Resolved", "18", C.green],
  ];

  return (
    <div className="incidents-page" style={pageVars}>
      <div>
        <SectionHeader
          title="Incident & Emergency Reports"
          subtitle="Track and resolve incidents reported during active bookings (RQ18, 48)"
        />

        <div className="incidents-page__summary-grid">
          {summaryCards.map(([icon, lbl, val, col]) => (
            <Card key={lbl} style={{ padding: "14px 16px" }}>
              <div className="incidents-page__summary-card">
                <div
                  className="incidents-page__summary-icon"
                  style={{ "--incidents-summary-icon-bg": `${col}18` }}
                >
                  {icon}
                </div>
                <div>
                  <p className="incidents-page__summary-label">{lbl}</p>
                  <p
                    className="incidents-page__summary-value"
                    style={{ "--incidents-summary-value-color": col }}
                  >
                    {val}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <table className="incidents-page__table">
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
                <tr key={i.id} className="incidents-page__row">
                  <Td>
                    <span className="incidents-page__id">{i.id}</span>
                  </Td>
                  <Td style={{ fontSize: 12 }}>{i.type}</Td>
                  <Td>{i.owner}</Td>
                  <Td>{i.minder}</Td>
                  <Td>🐾 {i.pet}</Td>
                  <Td>
                    <span className="incidents-page__booking">{i.booking}</span>
                  </Td>
                  <Td style={{ fontSize: 11 }}>{i.submitted}</Td>
                  <Td>
                    <StatusBadge status={i.status} />
                  </Td>
                  <Td>
                    <Btn
                      variant="outline"
                      small
                      onClick={() => setSelected(i.id)}
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
        <div
          className="incidents-page__overlay"
          onClick={() => setSelected(null)}
        >
          <div
            className="incidents-page__overlay-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="incidents-page__overlay-close"
            >
              ✕
            </button>

            <div className="incidents-page__overlay-header">
              <div className="incidents-page__overlay-header-main">
                <span className="incidents-page__detail-id">{inc.id}</span>
                <h3 className="incidents-page__detail-title">{inc.type}</h3>
                <p className="incidents-page__detail-submitted">{inc.submitted}</p>
                <div className="incidents-page__detail-status">
                  <StatusBadge status={inc.status} />
                </div>
              </div>
            </div>

            <div className="incidents-page__overlay-grid">
              <div className="incidents-page__overlay-section">
                <h4 className="incidents-page__overlay-section-title">
                  Incident Details
                </h4>

                <div className="incidents-page__detail-description-box">
                  <p className="incidents-page__detail-description">
                    {inc.description}
                  </p>
                </div>

                {[
                  ["Owner", inc.owner],
                  ["Minder", inc.minder],
                  ["Pet", inc.pet],
                  ["Booking", inc.booking],
                ].map(([k, v]) => (
                  <div key={k} className="incidents-page__detail-row">
                    <span className="incidents-page__detail-key">{k}</span>
                    <span className="incidents-page__detail-value">{v}</span>
                  </div>
                ))}
              </div>

              <div className="incidents-page__overlay-section">
                <h4 className="incidents-page__overlay-section-title">
                  Response Actions
                </h4>

                <div className="incidents-page__overlay-meta">
                  <div className="incidents-page__overlay-meta-card">
                    <span className="incidents-page__overlay-meta-label">Status</span>
                    <strong className="incidents-page__overlay-meta-value">
                      {inc.status}
                    </strong>
                  </div>

                  <div className="incidents-page__overlay-meta-card">
                    <span className="incidents-page__overlay-meta-label">Booking</span>
                    <strong className="incidents-page__overlay-meta-value">
                      {inc.booking}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="incidents-page__detail-actions">
              <Btn variant="primary">Escalate to Manager</Btn>
              <Btn variant="success">Mark as Resolved</Btn>
              <Btn variant="outline">Contact Owner</Btn>
              <Btn variant="outline">Contact Minder</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}