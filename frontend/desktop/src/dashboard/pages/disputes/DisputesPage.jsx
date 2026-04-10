import { useState, useEffect } from "react";
import { C } from "../../constants.js";
import { StatusBadge } from "../../components/badge/Badge.jsx";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card, Th, Td } from "../../components/card/Card.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import "./DisputesPage.css";

const API = "http://localhost:3000/api";

export default function DisputesPage({ user }) {
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

  const [disputes, setDisputes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ FETCH FROM BACKEND
  useEffect(() => {
    fetchDisputes();
  }, []);

  async function fetchDisputes() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/disputes`, { headers: headers() });
      const data = await res.json();
      setDisputes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const dispute = selected;

  // ✅ SUMMARY COUNTS
  const summary = {
    open: disputes.filter((d) => d.status === "Open").length,
    escalated: disputes.filter((d) => d.status === "Escalated").length,
    resolved: disputes.filter((d) => d.status === "Resolved").length,
    refunds: disputes.filter((d) => d.isRefundRequested).length,
  };

  const severityPill = (severity) => {
    const map = {
      low: { bg: C.greenLight, color: C.green, label: "Low" },
      medium: { bg: C.yellowLight, color: C.yellow, label: "Medium" },
      high: { bg: C.redLight, color: C.red, label: "High" },
    };

    const item = map[severity?.toLowerCase()] || map.medium;

    return (
      <span
        style={{
          background: item.bg,
          color: item.color,
          padding: "4px 8px",
          borderRadius: "6px",
          fontSize: 12,
        }}
      >
        {item.label}
      </span>
    );
  };

  return (
    <div className="disputes-page">
      <SectionHeader
        title="Disputes"
        subtitle="Live disputes from database"
      />

      {/* SUMMARY */}
      <div className="disputes-page__summary-grid">
        <Card>Open: {summary.open}</Card>
        <Card>Escalated: {summary.escalated}</Card>
        <Card>Resolved: {summary.resolved}</Card>
        <Card>Refunds: {summary.refunds}</Card>
      </div>

      {/* TABLE */}
      <Card>
        {loading ? (
          <p>Loading disputes...</p>
        ) : (
          <table className="disputes-page__table">
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Booking</Th>
                <Th>User</Th>
                <Th>Type</Th>
                <Th>Severity</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>

            <tbody>
              {disputes.map((d) => (
                <tr key={d.disputeID}>
                  <Td>{d.disputeID}</Td>
                  <Td>{d.bookingID}</Td>
                  <Td>{d.userID}</Td>
                  <Td>{d.disputeType}</Td>
                  <Td>{severityPill(d.severityLevel)}</Td>
                  <Td>
                    <StatusBadge status={d.status?.toLowerCase()} />
                  </Td>
                  <Td>
                    <Btn onClick={() => setSelected(d)}>View</Btn>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* MODAL */}
      {dispute && (
        <div
          className="disputes-page__overlay"
          onClick={() => setSelected(null)}
        >
          <div
            className="disputes-page__overlay-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{dispute.disputeID}</h2>

            <p><strong>Booking:</strong> {dispute.bookingID}</p>
            <p><strong>User:</strong> {dispute.userID}</p>
            <p><strong>Type:</strong> {dispute.disputeType}</p>
            <p><strong>Reason:</strong> {dispute.reason}</p>
            <p><strong>Status:</strong> {dispute.status}</p>

            <Btn onClick={() => setSelected(null)}>Close</Btn>
          </div>
        </div>
      )}
    </div>
  );
}