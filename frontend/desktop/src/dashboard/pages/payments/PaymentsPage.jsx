import { useState } from "react";
import { C } from "../../constants.js";
import { Badge, StatusBadge } from "../../components/badge/Badge.jsx";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card, Th, Td } from "../../components/card/Card.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import "./PaymentsPage.css";

export default function PaymentsPage() {
  const [tab, setTab] = useState("transactions");
  const [selectedRefund, setSelectedRefund] = useState(null);

  const transactions = [
    { id: "#PAY-441", booking: "#HT-8798", payer: "Anna B.", amount: "£105.00", fee: "£5.25", net: "£99.75", date: "2 Apr", status: "completed", escrow: false },
    { id: "#PAY-440", booking: "#HT-8801", payer: "Sarah J.", amount: "£23.10", fee: "£1.16", net: "£21.94", date: "9 Apr", status: "pending", escrow: true },
    { id: "#PAY-439", booking: "#HT-8802", payer: "Mike T.", amount: "£48.00", fee: "£2.40", net: "£45.60", date: "12 Apr", status: "pending", escrow: true },
    { id: "#PAY-438", booking: "#HT-8797", payer: "Chris L.", amount: "£15.75", fee: "£0.00", net: "£0.00", date: "28 Mar", status: "refunded", escrow: false },
  ];

  const refunds = [
    {
      id: "#REF-119",
      booking: "#HT-8797",
      owner: "Sarah J.",
      minder: "Tom H.",
      amount: "£15.75",
      reason: "Minder no-show",
      submitted: "28 Mar",
      status: "open",
      notes: "Customer requested a full refund after the minder failed to attend the booking.",
      paymentMethod: "Visa ending 4421",
      handledBy: "Pending assignment",
    },
    {
      id: "#REF-118",
      booking: "#HT-8782",
      owner: "Rachel K.",
      minder: "James W.",
      amount: "£34.00",
      reason: "Service not as described",
      submitted: "20 Mar",
      status: "resolved",
      notes: "Resolved after partial refund approval and customer follow-up.",
      paymentMethod: "Mastercard ending 1182",
      handledBy: "Sifat R.",
    },
    {
      id: "#REF-117",
      booking: "#HT-8770",
      owner: "Mike T.",
      minder: "Priya P.",
      amount: "£48.00",
      reason: "Booking cancelled",
      submitted: "15 Mar",
      status: "escalated",
      notes: "Escalated due to timing of cancellation and dispute over payout release.",
      paymentMethod: "Visa ending 7724",
      handledBy: "Chadi S.",
    },
  ];

  const statCards = [
    { icon: "💷", label: "Monthly Revenue", value: "£18,340", valueClass: "payments-page__stat-value--green" },
    { icon: "🔒", label: "In Escrow", value: "£4,820", valueClass: "payments-page__stat-value--blue" },
    { icon: "↩️", label: "Refunds Issued", value: "£218", valueClass: "payments-page__stat-value--red" },
    { icon: "📈", label: "Platform Fees", value: "£917", valueClass: "payments-page__stat-value--orange" },
  ];

  const tabs = [
    ["transactions", "Transactions"],
    ["refunds", "Refund Requests"],
  ];

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
            className={`payments-page__tab-btn ${
              tab === key ? "payments-page__tab-btn--active" : ""
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "transactions" && (
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
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <Td>
                    <span className="payments-page__id">{t.id}</span>
                  </Td>
                  <Td>
                    <span className="payments-page__booking">{t.booking}</span>
                  </Td>
                  <Td>{t.payer}</Td>
                  <Td>
                    <strong>{t.amount}</strong>
                  </Td>
                  <Td>
                    <span className="payments-page__fee">{t.fee}</span>
                  </Td>
                  <Td>
                    <strong className="payments-page__net">{t.net}</strong>
                  </Td>
                  <Td>
                    <span className="payments-page__small-text">{t.date}</span>
                  </Td>
                  <Td>
                    {t.escrow ? (
                      <Badge color={C.blue} bg={C.blueLight}>
                        🔒 Held
                      </Badge>
                    ) : (
                      <Badge color={C.green} bg={C.greenLight}>
                        Released
                      </Badge>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge status={t.status} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "refunds" && (
        <Card>
          <table className="payments-page__table">
            <thead>
              <tr>
                <Th>Refund ID</Th>
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
                <tr key={r.id}>
                  <Td>
                    <span className="payments-page__id">{r.id}</span>
                  </Td>
                  <Td>
                    <span className="payments-page__booking">{r.booking}</span>
                  </Td>
                  <Td>{r.owner}</Td>
                  <Td>{r.minder}</Td>
                  <Td>
                    <strong>{r.amount}</strong>
                  </Td>
                  <Td>
                    <span className="payments-page__small-text">{r.reason}</span>
                  </Td>
                  <Td>
                    <span className="payments-page__small-text">{r.submitted}</span>
                  </Td>
                  <Td>
                    <StatusBadge status={r.status} />
                  </Td>
                  <Td>
                    {r.status === "open" ? (
                      <div className="payments-page__actions">
                        <Btn variant="success" small>
                          Approve Refund
                        </Btn>
                        <Btn variant="danger" small>
                          Deny Refund
                        </Btn>
                        <Btn variant="outline" small>
                          Escalate
                        </Btn>
                        <Btn variant="outline" small onClick={() => setSelectedRefund(r)}>
                          View
                        </Btn>
                      </div>
                    ) : (
                      <Btn variant="outline" small onClick={() => setSelectedRefund(r)}>
                        View
                      </Btn>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {selectedRefund && (
        <div
          className="payments-page__overlay"
          onClick={() => setSelectedRefund(null)}
        >
          <div
            className="payments-page__overlay-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="payments-page__overlay-close"
              onClick={() => setSelectedRefund(null)}
            >
              ✕
            </button>

            <div className="payments-page__overlay-header">
              <div className="payments-page__overlay-header-main">
                <p className="payments-page__overlay-id">{selectedRefund.id}</p>
                <h2 className="payments-page__overlay-title">Refund Request</h2>
                <p className="payments-page__overlay-subtitle">
                  {selectedRefund.submitted} · {selectedRefund.booking}
                </p>
                <div className="payments-page__overlay-badges">
                  <StatusBadge status={selectedRefund.status} />
                </div>
              </div>
            </div>

            <div className="payments-page__overlay-grid">
              <div className="payments-page__overlay-section">
                <h3 className="payments-page__overlay-section-title">Refund Details</h3>

                <div className="payments-page__overlay-list">
                  <div className="payments-page__overlay-row">
                    <span>Owner</span>
                    <strong>{selectedRefund.owner}</strong>
                  </div>
                  <div className="payments-page__overlay-row">
                    <span>Minder</span>
                    <strong>{selectedRefund.minder}</strong>
                  </div>
                  <div className="payments-page__overlay-row">
                    <span>Booking</span>
                    <strong>{selectedRefund.booking}</strong>
                  </div>
                  <div className="payments-page__overlay-row">
                    <span>Amount</span>
                    <strong>{selectedRefund.amount}</strong>
                  </div>
                  <div className="payments-page__overlay-row">
                    <span>Reason</span>
                    <strong>{selectedRefund.reason}</strong>
                  </div>
                  <div className="payments-page__overlay-row">
                    <span>Payment Method</span>
                    <strong>{selectedRefund.paymentMethod}</strong>
                  </div>
                  <div className="payments-page__overlay-row">
                    <span>Handled By</span>
                    <strong>{selectedRefund.handledBy}</strong>
                  </div>
                </div>
              </div>

              <div className="payments-page__overlay-section">
                <h3 className="payments-page__overlay-section-title">Notes</h3>

                <div className="payments-page__overlay-note-box">
                  <p className="payments-page__overlay-note-text">
                    {selectedRefund.notes}
                  </p>
                </div>

                <div className="payments-page__overlay-stats">
                  <div className="payments-page__overlay-stat">
                    <span className="payments-page__overlay-stat-label">Status</span>
                    <strong className="payments-page__overlay-stat-value">
                      {selectedRefund.status}
                    </strong>
                  </div>
                  <div className="payments-page__overlay-stat">
                    <span className="payments-page__overlay-stat-label">Amount</span>
                    <strong className="payments-page__overlay-stat-value">
                      {selectedRefund.amount}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="payments-page__overlay-actions">
              <Btn variant="success">Approve Refund</Btn>
              <Btn variant="danger">Deny Refund</Btn>
              <Btn variant="outline">Escalate Case</Btn>
              <Btn variant="outline">View Booking</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}