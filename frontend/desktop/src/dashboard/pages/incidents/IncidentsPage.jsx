import { useState, useEffect } from "react";
import { C } from "../../constants.js";
import { StatusBadge } from "../../components/badge/Badge.jsx";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card, Th, Td } from "../../components/card/Card.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import "./IncidentsPage.css";

const API = "http://localhost:3000/api";

function authHeaders(user) {
  return {
    "Content-Type": "application/json",
    "X-User-Id": user.userID,
    "X-User-Role": user.role,
  };
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatType(type) {
  return type?.replace(/([A-Z])/g, " $1").trim() || "—";
}

export default function IncidentsPage({ user }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

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

  useEffect(() => {
    fetchIncidents();
  }, []);

  async function fetchIncidents() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/reports/incidents`, { headers: authHeaders(user) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIncidents(data);
    } catch (e) {
      setError(e.message || "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  }

  async function handleEscalate(incidentID) {
    try {
      const res = await fetch(`${API}/reports/incidents/${incidentID}/escalate`, {
        method: "PATCH",
        headers: authHeaders(user),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIncidents((prev) =>
        prev.map((i) => (i.incidentID === incidentID ? { ...i, status: "Escalated" } : i))
      );
      setSelected((prev) => (prev?.incidentID === incidentID ? { ...prev, status: "Escalated" } : prev));
    } catch (e) {
      alert(e.message || "Failed to escalate incident");
    }
  }

  async function handleResolve(incidentID) {
    try {
      const res = await fetch(`${API}/reports/incidents/${incidentID}/resolve`, {
        method: "PATCH",
        headers: authHeaders(user),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIncidents((prev) =>
        prev.map((i) => (i.incidentID === incidentID ? { ...i, status: "Resolved" } : i))
      );
      setSelected((prev) => (prev?.incidentID === incidentID ? { ...prev, status: "Resolved" } : prev));
    } catch (e) {
      alert(e.message || "Failed to resolve incident");
    }
  }

  // Summary counts from live data
  const openCount = incidents.filter((i) => i.status === "Open").length;
  const escalatedCount = incidents.filter((i) => i.status === "Escalated").length;
  const resolvedCount = incidents.filter((i) => i.status === "Resolved").length;

  const summaryCards = [
    ["🚨", "Open", String(openCount), C.red],
    ["⚡", "Escalated", String(escalatedCount), C.yellow],
    ["✅", "Resolved", String(resolvedCount), C.green],
  ];

  const inc = selected;

  return (
    <div className="incidents-page" style={pageVars}>
      <div>
        <SectionHeader
          title="Incident & Emergency Reports"
          subtitle="Track and resolve incidents reported during active bookings."
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

        {error && <p style={{ color: C.red, padding: "12px 0" }}>⚠️ {error}</p>}
        {loading && <p style={{ color: C.mid, padding: "12px 0" }}>Loading...</p>}

        {!loading && (
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
                  <Th>Reported</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((i) => (
                  <tr key={i.incidentID} className="incidents-page__row">
                    <Td><span className="incidents-page__id">{i.incidentID.slice(0, 8).toUpperCase()}</span></Td>
                    <Td style={{ fontSize: 12 }}>{formatType(i.incidentType)}</Td>
                    <Td>{i.ownerFirstName} {i.ownerLastName}</Td>
                    <Td>{i.minderFirstName} {i.minderLastName}</Td>
                    <Td>🐾 {i.petName}</Td>
                    <Td><span className="incidents-page__booking">{i.bookingID.slice(0, 8).toUpperCase()}</span></Td>
                    <Td style={{ fontSize: 11 }}>{formatDate(i.reportedAt)}</Td>
                    <Td><StatusBadge status={i.status?.toLowerCase()} /></Td>
                    <Td>
                      <Btn variant="outline" small onClick={() => setSelected(i)}>Details</Btn>
                    </Td>
                  </tr>
                ))}
                {incidents.length === 0 && (
                  <tr><Td colSpan={9} style={{ textAlign: "center", color: C.mid }}>No incidents found.</Td></tr>
                )}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {inc && (
        <div className="incidents-page__overlay" onClick={() => setSelected(null)}>
          <div className="incidents-page__overlay-card" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setSelected(null)} className="incidents-page__overlay-close">✕</button>

            <div className="incidents-page__overlay-header">
              <div className="incidents-page__overlay-header-main">
                <span className="incidents-page__detail-id">{inc.incidentID.slice(0, 8).toUpperCase()}</span>
                <h3 className="incidents-page__detail-title">{formatType(inc.incidentType)}</h3>
                <p className="incidents-page__detail-submitted">{formatDate(inc.reportedAt)}</p>
                <div className="incidents-page__detail-status">
                  <StatusBadge status={inc.status?.toLowerCase()} />
                </div>
              </div>
            </div>

            <div className="incidents-page__overlay-grid">
              <div className="incidents-page__overlay-section">
                <h4 className="incidents-page__overlay-section-title">Incident Details</h4>
                <div className="incidents-page__detail-description-box">
                  <p className="incidents-page__detail-description">{inc.description}</p>
                </div>
                {[
                  ["Owner", `${inc.ownerFirstName} ${inc.ownerLastName}`],
                  ["Minder", `${inc.minderFirstName} ${inc.minderLastName}`],
                  ["Pet", inc.petName],
                  ["Booking", inc.bookingID.slice(0, 8).toUpperCase()],
                  ["Severity", inc.severityLevel],
                ].map(([k, v]) => (
                  <div key={k} className="incidents-page__detail-row">
                    <span className="incidents-page__detail-key">{k}</span>
                    <span className="incidents-page__detail-value">{v}</span>
                  </div>
                ))}
              </div>

              <div className="incidents-page__overlay-section">
                <h4 className="incidents-page__overlay-section-title">Response Actions</h4>
                <div className="incidents-page__overlay-meta">
                  <div className="incidents-page__overlay-meta-card">
                    <span className="incidents-page__overlay-meta-label">Status</span>
                    <strong className="incidents-page__overlay-meta-value">{inc.status}</strong>
                  </div>
                  <div className="incidents-page__overlay-meta-card">
                    <span className="incidents-page__overlay-meta-label">Severity</span>
                    <strong className="incidents-page__overlay-meta-value">{inc.severityLevel}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="incidents-page__detail-actions">
              {inc.status !== "Resolved" && (
                <>
                  {inc.status !== "Escalated" && (
                    <Btn variant="primary" onClick={() => handleEscalate(inc.incidentID)}>
                      Escalate to Manager
                    </Btn>
                  )}
                  <Btn variant="success" onClick={() => handleResolve(inc.incidentID)}>
                    Mark as Resolved
                  </Btn>
                </>
              )}
              <Btn variant="outline" onClick={() => setSelected(null)}>Close</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
