import { useState, useEffect } from "react";
import { C } from "../../constants.js";
import { Badge, StatusBadge } from "../../components/badge/Badge.jsx";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card, Th, Td } from "../../components/card/Card.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import "./PaymentsPage.css";

const API = "http://localhost:3000/api";

function authHeaders(user) {
  return {
    "Content-Type": "application/json",
    "X-User-Id": user.userID,
    "X-User-Role": user.role,
  };
}

function fmt(amount) {
  return `£${Number(amount).toFixed(2)}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function PaymentsPage({ user, searchQuery = "" }) {
  const [tab, setTab] = useState("transactions");
  const [payments, setPayments] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRefund, setSelectedRefund] = useState(null);

  const tabs = [
    ["transactions", "Transactions"],
    ["refunds", "Refund Requests"],
  ];

  useEffect(() => {
    fetchPayments();
    fetchDisputes();
  }, []);

  async function fetchPayments() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/payments`, { headers: authHeaders(user) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPayments(data);
    } catch (e) {
      setError(e.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }

  async function fetchDisputes() {
    try {
      const res = await fetch(`${API}/disputes`, { headers: authHeaders(user) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDisputes(data);
    } catch (e) {
      // disputes error is non-blocking; transactions still show
    }
  }

  async function handleRelease(paymentID) {
    try {
      const res = await fetch(`${API}/payments/${paymentID}/release`, {
        method: "PATCH",
        headers: authHeaders(user),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPayments((prev) =>
        prev.map((p) => (p.paymentID === paymentID ? { ...p, escrowStatus: data.escrowStatus, paymentStatus: data.paymentStatus } : p))
      );
    } catch (e) {
      alert(e.message || "Failed to release payment");
    }
  }

  async function handleApproveRefund(paymentID, disputeID) {
    try {
      const res = await fetch(`${API}/payments/${paymentID}/refund`, {
        method: "PATCH",
        headers: authHeaders(user),
        body: JSON.stringify({ reason: "Refund approved by support" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPayments((prev) =>
        prev.map((p) => (p.paymentID === paymentID ? { ...p, escrowStatus: "Refunded", paymentStatus: "Refunded" } : p))
      );
      setDisputes((prev) =>
        prev.map((d) => (d.disputeID === disputeID ? { ...d, status: "Resolved" } : d))
      );
      setSelectedRefund(null);
    } catch (e) {
      alert(e.message || "Failed to approve refund");
    }
  }

  async function handleDenyRefund(disputeID) {
    try {
      const res = await fetch(`${API}/disputes/${disputeID}/resolve`, {
        method: "PATCH",
        headers: authHeaders(user),
        body: JSON.stringify({ resolutionNotes: "Refund request denied after review" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDisputes((prev) =>
        prev.map((d) => (d.disputeID === disputeID ? { ...d, status: "Resolved" } : d))
      );
      setSelectedRefund(null);
    } catch (e) {
      alert(e.message || "Failed to deny refund");
    }
  }

  async function handleEscalate(disputeID) {
    try {
      const res = await fetch(`${API}/disputes/${disputeID}/escalate`, {
        method: "PATCH",
        headers: authHeaders(user),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDisputes((prev) =>
        prev.map((d) => (d.disputeID === disputeID ? { ...d, status: "Escalated" } : d))
      );
      setSelectedRefund(null);
    } catch (e) {
      alert(e.message || "Failed to escalate");
    }
  }

  // Compute stat cards from live data
  const totalRevenue = payments.reduce((s, p) => s + Number(p.serviceCost), 0);
  const inEscrow = payments.filter((p) => p.escrowStatus === "Holding").reduce((s, p) => s + Number(p.amount), 0);
  const refundsIssued = payments.filter((p) => p.escrowStatus === "Refunded").reduce((s, p) => s + Number(p.amount), 0);
  const platformFees = payments.reduce((s, p) => s + Number(p.platformFee), 0);

  const statCards = [
    { icon: "💷", label: "Total Revenue", value: fmt(totalRevenue), valueClass: "payments-page__stat-value--green" },
    { icon: "🔒", label: "In Escrow", value: fmt(inEscrow), valueClass: "payments-page__stat-value--blue" },
    { icon: "↩️", label: "Refunds Issued", value: fmt(refundsIssued), valueClass: "payments-page__stat-value--red" },
    { icon: "📈", label: "Platform Fees", value: fmt(platformFees), valueClass: "payments-page__stat-value--orange" },
  ];

  const visiblePayments = searchQuery
    ? payments.filter((p) =>
        [p.paymentID, p.bookingID, p.payerFirstName, p.payerLastName, p.paymentStatus, p.escrowStatus]
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : payments;

  const refunds = disputes.filter((d) => d.isRefundRequested);
  const activeStatuses = ["Open", "Pending"];

  return (
    <div className="payments-page">
      <SectionHeader
        title="Payments & Refunds"
        subtitle="Review transactions, escrow activity and refund requests."
      />

      <div className="payments-page__stats-grid">
        {statCards.map((item) => (
          <Card key={item.label}>
            <div className="payments-page__stat-card">
              <div className="payments-page__stat-head">
                <span className="payments-page__stat-icon">{item.icon}</span>
                <span className="payments-page__stat-label">{item.label}</span>
              </div>
              <p className={`payments-page__stat-value ${item.valueClass}`}>{item.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="payments-page__tabs">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`payments-page__tab-btn ${tab === key ? "payments-page__tab-btn--active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p style={{ color: C.red, padding: "12px 0" }}>⚠️ {error}</p>}
      {loading && <p style={{ color: C.mid, padding: "12px 0" }}>Loading...</p>}

      {!loading && tab === "transactions" && (
        <Card>
          <table className="payments-page__table">
            <thead>
              <tr>
                <Th>Payment ID</Th>
                <Th>Booking</Th>
                <Th>Payer</Th>
                <Th>Amount</Th>
                <Th>Platform Fee</Th>
                <Th>Net Payout</Th>
                <Th>Date</Th>
                <Th>Escrow</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {visiblePayments.map((p) => (
                <tr key={p.paymentID}>
                  <Td><span className="payments-page__id">{p.paymentID.slice(0, 8).toUpperCase()}</span></Td>
                  <Td><span className="payments-page__booking">{p.bookingID.slice(0, 8).toUpperCase()}</span></Td>
                  <Td>{p.payerFirstName} {p.payerLastName}</Td>
                  <Td><strong>{fmt(p.amount)}</strong></Td>
                  <Td><span className="payments-page__fee">{fmt(p.platformFee)}</span></Td>
                  <Td><strong className="payments-page__net">{fmt(p.serviceCost)}</strong></Td>
                  <Td><span className="payments-page__small-text">{formatDate(p.paidAt)}</span></Td>
                  <Td>
                    {p.escrowStatus === "Holding" ? (
                      <Badge color={C.blue} bg={C.blueLight}>🔒 Held</Badge>
                    ) : p.escrowStatus === "Refunded" ? (
                      <Badge color={C.red} bg={C.redLight}>Refunded</Badge>
                    ) : (
                      <Badge color={C.green} bg={C.greenLight}>Released</Badge>
                    )}
                  </Td>
                  <Td><StatusBadge status={p.paymentStatus?.toLowerCase()} /></Td>
                  <Td>
                    {p.escrowStatus === "Holding" && (
                      <Btn variant="success" small onClick={() => handleRelease(p.paymentID)}>
                        Release
                      </Btn>
                    )}
                  </Td>
                </tr>
              ))}
              {visiblePayments.length === 0 && (
                <tr><Td colSpan={10} style={{ textAlign: "center", color: C.mid }}>No transactions found.</Td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {!loading && tab === "refunds" && (
        <Card>
          <table className="payments-page__table">
            <thead>
              <tr>
                <Th>Dispute ID</Th>
                <Th>Booking</Th>
                <Th>Owner</Th>
                <Th>Minder</Th>
                <Th>Amount</Th>
                <Th>Reason</Th>
                <Th>Submitted</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((r) => (
                <tr key={r.disputeID}>
                  <Td><span className="payments-page__id">{r.disputeID.slice(0, 8).toUpperCase()}</span></Td>
                  <Td><span className="payments-page__booking">{r.bookingID.slice(0, 8).toUpperCase()}</span></Td>
                  <Td>{r.raisedByFirstName} {r.raisedByLastName}</Td>
                  <Td>{r.minderFirstName ? `${r.minderFirstName} ${r.minderLastName}` : "—"}</Td>
                  <Td><strong>{r.paymentAmount ? fmt(r.paymentAmount) : "—"}</strong></Td>
                  <Td><span className="payments-page__small-text">{r.reason}</span></Td>
                  <Td><span className="payments-page__small-text">{formatDate(r.createdAt)}</span></Td>
                  <Td><StatusBadge status={r.status?.toLowerCase()} /></Td>
                  <Td>
                    {activeStatuses.includes(r.status) ? (
                      <div className="payments-page__actions">
                        <Btn variant="success" small onClick={() => handleApproveRefund(r.paymentID, r.disputeID)}>
                          Approve
                        </Btn>
                        <Btn variant="danger" small onClick={() => handleDenyRefund(r.disputeID)}>
                          Deny
                        </Btn>
                        <Btn variant="outline" small onClick={() => handleEscalate(r.disputeID)}>
                          Escalate
                        </Btn>
                        <Btn variant="outline" small onClick={() => setSelectedRefund(r)}>
                          View
                        </Btn>
                      </div>
                    ) : (
                      <Btn variant="outline" small onClick={() => setSelectedRefund(r)}>View</Btn>
                    )}
                  </Td>
                </tr>
              ))}
              {refunds.length === 0 && (
                <tr><Td colSpan={9} style={{ textAlign: "center", color: C.mid }}>No refund requests found.</Td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {selectedRefund && (
        <div className="payments-page__overlay" onClick={() => setSelectedRefund(null)}>
          <div className="payments-page__overlay-card" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="payments-page__overlay-close" onClick={() => setSelectedRefund(null)}>✕</button>

            <div className="payments-page__overlay-header">
              <div className="payments-page__overlay-header-main">
                <p className="payments-page__overlay-id">{selectedRefund.disputeID.slice(0, 8).toUpperCase()}</p>
                <h2 className="payments-page__overlay-title">Refund Request</h2>
                <p className="payments-page__overlay-subtitle">
                  {formatDate(selectedRefund.createdAt)} · {selectedRefund.bookingID.slice(0, 8).toUpperCase()}
                </p>
                <div className="payments-page__overlay-badges">
                  <StatusBadge status={selectedRefund.status?.toLowerCase()} />
                </div>
              </div>
            </div>

            <div className="payments-page__overlay-grid">
              <div className="payments-page__overlay-section">
                <h3 className="payments-page__overlay-section-title">Refund Details</h3>
                <div className="payments-page__overlay-list">
                  {[
                    ["Owner", `${selectedRefund.raisedByFirstName} ${selectedRefund.raisedByLastName}`],
                    ["Minder", selectedRefund.minderFirstName ? `${selectedRefund.minderFirstName} ${selectedRefund.minderLastName}` : "—"],
                    ["Booking", selectedRefund.bookingID.slice(0, 8).toUpperCase()],
                    ["Amount", selectedRefund.paymentAmount ? fmt(selectedRefund.paymentAmount) : "—"],
                    ["Reason", selectedRefund.reason],
                    ["Type", selectedRefund.disputeType],
                  ].map(([k, v]) => (
                    <div key={k} className="payments-page__overlay-row">
                      <span>{k}</span>
                      <strong>{v}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="payments-page__overlay-section">
                <h3 className="payments-page__overlay-section-title">Notes</h3>
                <div className="payments-page__overlay-note-box">
                  <p className="payments-page__overlay-note-text">
                    {selectedRefund.resolutionNotes || "No resolution notes yet."}
                  </p>
                </div>
                <div className="payments-page__overlay-stats">
                  <div className="payments-page__overlay-stat">
                    <span className="payments-page__overlay-stat-label">Status</span>
                    <strong className="payments-page__overlay-stat-value">{selectedRefund.status}</strong>
                  </div>
                  <div className="payments-page__overlay-stat">
                    <span className="payments-page__overlay-stat-label">Severity</span>
                    <strong className="payments-page__overlay-stat-value">{selectedRefund.severityLevel}</strong>
                  </div>
                </div>
              </div>
            </div>

            {activeStatuses.includes(selectedRefund.status) && (
              <div className="payments-page__overlay-actions">
                <Btn variant="success" onClick={() => handleApproveRefund(selectedRefund.paymentID, selectedRefund.disputeID)}>
                  Approve Refund
                </Btn>
                <Btn variant="danger" onClick={() => handleDenyRefund(selectedRefund.disputeID)}>
                  Deny Refund
                </Btn>
                <Btn variant="outline" onClick={() => handleEscalate(selectedRefund.disputeID)}>
                  Escalate Case
                </Btn>
              </div>
            )}
            {!activeStatuses.includes(selectedRefund.status) && (
              <div className="payments-page__overlay-actions">
                <Btn variant="outline" onClick={() => setSelectedRefund(null)}>Close</Btn>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
