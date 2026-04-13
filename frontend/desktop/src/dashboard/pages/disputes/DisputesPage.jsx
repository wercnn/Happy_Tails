import { useEffect, useState } from "react";
import { C } from "../../constants.js";
import { StatusBadge } from "../../components/badge/Badge.jsx";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card, Th, Td } from "../../components/card/Card.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import "./DisputesPage.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const authHeaders = {
  "Content-Type": "application/json",
  "X-User-Id": "u-support-001",
  "X-User-Role": "support",
};

export default function DisputesPage({ searchQuery = "" }) {
  const [disputes, setDisputes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const normaliseDispute = (d) => ({
    id: d.disputeID || d.id,
    booking: d.bookingID || d.bookingId || d.booking || "N/A",
    raisedBy:
      d.raisedByFirstName
        ? `${d.raisedByFirstName} ${d.raisedByLastName || ""}`.trim()
        : d.raisedByName || d.raisedBy || "Unknown",
    against:
      d.minderFirstName
        ? `${d.minderFirstName} ${d.minderLastName || ""}`.trim()
        : d.againstName || d.against || "Unknown",
    type: d.disputeType || d.type || "Dispute",
    severity: (d.severityLevel || d.severity || "medium").toLowerCase(),
    refundRequested:
      d.isRefundRequested != null
        ? d.isRefundRequested ? "Yes" : "No"
        : d.refundRequested || d.refund || "N/A",
    status: (d.status || "open").toLowerCase(),
    submitted: d.createdAt
      ? new Date(d.createdAt).toLocaleString()
      : d.submitted || "N/A",
    assignedTo: d.assignedToName || d.assignedTo || "Unassigned",
    summary: d.reason || d.summary || d.description || "No summary provided.",
    evidence: d.resolutionNotes || d.evidence || d.notes || "No evidence provided.",
  });

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/api/disputes`, {
        method: "GET",
        headers: authHeaders,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch disputes.");
      }

      const list = Array.isArray(data) ? data : data.disputes || [];
      setDisputes(list.map(normaliseDispute));
    } catch (err) {
      setError(err.message || "Something went wrong while loading disputes.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDisputeDetails = async (id) => {
    try {
      setDetailsLoading(true);

      const response = await fetch(`${API_BASE}/api/disputes/${id}`, {
        method: "GET",
        headers: authHeaders,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch dispute details.");
      }

      setSelectedDispute(normaliseDispute(data));
    } catch (err) {
      setError(err.message || "Failed to load dispute details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleOpenDispute = async (id) => {
    setSelected(id);
    setSelectedDispute(null);
    await fetchDisputeDetails(id);
  };

  const handleResolve = async (resolutionNote) => {
    if (!selected) return;

    try {
      setActionLoading(true);

      const response = await fetch(`${API_BASE}/api/disputes/${selected}/resolve`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({
          resolutionNote,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to resolve dispute.");
      }

      await fetchDisputes();
      await fetchDisputeDetails(selected);
    } catch (err) {
      setError(err.message || "Failed to resolve dispute.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!selected) return;

    try {
      setActionLoading(true);

      const response = await fetch(`${API_BASE}/api/disputes/${selected}/escalate`, {
        method: "PATCH",
        headers: authHeaders,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to escalate dispute.");
      }

      await fetchDisputes();
      await fetchDisputeDetails(selected);
    } catch (err) {
      setError(err.message || "Failed to escalate dispute.");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

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
    ["⚖️", "Open", disputes.filter((d) => d.status === "open").length, C.red],
    ["💷", "Refund Requests", disputes.length, C.orange],
    ["⬆️", "Escalated", disputes.filter((d) => d.status === "escalated").length, C.yellow],
    ["✅", "Resolved", disputes.filter((d) => d.status === "resolved").length, C.green],
  ];

  const visibleDisputes = searchQuery
    ? disputes.filter((d) =>
        [d.id, d.booking, d.raisedBy, d.against, d.type, d.status]
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : disputes;

  const dispute = selectedDispute || disputes.find((d) => d.id === selected);

  return (
    <div className="disputes-page" style={pageVars}>
      <div>
        <SectionHeader
          title="Disputes"
          subtitle="Review complaints, refund requests and escalated support cases"
        />

        {error && (
          <Card style={{ marginBottom: "16px", padding: "14px 16px", color: C.red }}>
            {error}
          </Card>
        )}

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
          {loading ? (
            <div style={{ padding: "18px" }}>Loading disputes...</div>
          ) : (
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
                {visibleDisputes.map((d) => (
                  <tr key={d.id} className="disputes-page__row">
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
                      <Btn variant="outline" small onClick={() => handleOpenDispute(d.id)}>
                        View
                      </Btn>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {dispute && (
        <div className="disputes-page__overlay" onClick={() => setSelected(null)}>
          <div
            className="disputes-page__overlay-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setSelectedDispute(null);
              }}
              className="disputes-page__overlay-close"
            >
              ✕
            </button>

            {detailsLoading ? (
              <div>Loading dispute details...</div>
            ) : (
              <>
                <div className="disputes-page__overlay-header">
                  <div className="disputes-page__overlay-header-main">
                    <span className="disputes-page__detail-id">{dispute.id}</span>
                    <h3 className="disputes-page__detail-title">{dispute.type}</h3>
                    <p className="disputes-page__detail-submitted">{dispute.submitted}</p>
                    <div className="disputes-page__detail-status">
                      <StatusBadge status={dispute.status} />
                    </div>
                  </div>
                </div>

                <div className="disputes-page__overlay-grid">
                  <div className="disputes-page__overlay-section">
                    <h4 className="disputes-page__overlay-section-title">Case Details</h4>

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
                  </div>

                  <div className="disputes-page__overlay-section">
                    <h4 className="disputes-page__overlay-section-title">Evidence / Notes</h4>

                    <div className="disputes-page__evidence-box">
                      <p className="disputes-page__evidence-text">{dispute.evidence}</p>
                    </div>

                    <div className="disputes-page__overlay-meta">
                      <div className="disputes-page__overlay-meta-card">
                        <span className="disputes-page__overlay-meta-label">Severity</span>
                        <div>{severityPill(dispute.severity)}</div>
                      </div>

                      <div className="disputes-page__overlay-meta-card">
                        <span className="disputes-page__overlay-meta-label">Status</span>
                        <strong className="disputes-page__overlay-meta-value">
                          {dispute.status}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="disputes-page__detail-actions">
                  <Btn
                    variant="primary"
                    disabled={actionLoading}
                    onClick={() => handleResolve("Refund approved")}
                  >
                    {actionLoading ? "Processing..." : "Approve Refund"}
                  </Btn>

                  <Btn
                    variant="danger"
                    disabled={actionLoading}
                    onClick={() => handleResolve("Refund denied")}
                  >
                    {actionLoading ? "Processing..." : "Deny Dispute"}
                  </Btn>

                  <Btn
                    variant="outline"
                    disabled={actionLoading}
                    onClick={handleEscalate}
                  >
                    {actionLoading ? "Processing..." : "Escalate Case"}
                  </Btn>

                  <Btn variant="outline" disabled>
                    View Chat History
                  </Btn>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
